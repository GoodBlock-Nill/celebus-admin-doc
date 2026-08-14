import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";

// 주간 밸런스 리포트 — 주간(KST 월~일) 지표 스냅샷 + 룰 기반 인사이트.
// GET: 저장된 리포트 목록 반환. 이때 완료된 최근 주(최대 8주) 중 미생성분을 lazy 생성·저장 (크론 불필요).
// POST {week_start}: 해당 주 강제 재생성 (룰 개정 후 재평가용).
export type WeeklyMetrics = {
  week_start: string;
  players: number;
  runs: number;
  new_players: number;
  abandon: { started: number; abandoned: number };
  cont: { used: number; declined: number; timeout: number; avg_continues: number };
  chains: { max_len: number; total: number; chains3plus: number };
  levels: { mode: string; level: number; runs: number; near: number; avg_prog: number | null }[];
  coverage: { total: number; with_telemetry: number };
};
export type Insight = { level: "warn" | "info" | "good"; text: string };
export type WeeklyReport = { week_start: string; metrics: WeeklyMetrics; insights: Insight[]; created_at: string };

// KST 기준 이번 주 월요일 (date 문자열)
function currentWeekStartKst(): string {
  const kst = new Date(Date.now() + 9 * 3600_000);
  const dow = (kst.getUTCDay() + 6) % 7; // 월=0
  kst.setUTCDate(kst.getUTCDate() - dow);
  return kst.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const pct = (a: number, b: number) => (b > 0 ? a / b : 0);

// 룰 기반 인사이트 — 임계값 판정. 룰 개정 시 이 함수만 수정 (기존 리포트는 POST 재생성으로 재평가).
function buildInsights(m: WeeklyMetrics, prev: WeeklyMetrics | null): Insight[] {
  const out: Insight[] = [];

  // ① near-miss 핫스팟 (일반 매치, 표본 20판+)
  const hotspots = m.levels
    .filter((l) => l.mode === "daily" && l.runs >= 20 && pct(l.near, l.runs) >= 0.25)
    .sort((a, b) => pct(b.near, b.runs) - pct(a.near, a.runs))
    .slice(0, 3);
  for (const h of hotspots) {
    out.push({ level: "warn", text: `레벨 ${h.level} 근소 실패율 ${Math.round(pct(h.near, h.runs) * 100)}% (${h.near}/${h.runs}판) — 목표 하향 또는 클러치 타임(보너스 시간) 검토` });
  }

  // ② 이어하기 — 의존 심화 / 가치 불신
  const offered = m.cont.used + m.cont.declined;
  if (m.cont.avg_continues >= 2.5 && m.cont.used >= 20) {
    out.push({ level: "warn", text: `이어하기 의존 심화 — 사용자당 평균 ${m.cont.avg_continues}연속 사용. 연속 사용 상한·첫 회 무료 전환 검토` });
  }
  if (offered >= 30 && pct(m.cont.used, offered) < 0.3) {
    out.push({ level: "info", text: `이어하기 사용률 ${Math.round(pct(m.cont.used, offered) * 100)}% — 제안의 70%가 거절("더 해봤자" 심리). 가격·가치 재설계 검토` });
  }

  // ③ 이탈률 — 절대 경고 + 전주 대비 급등
  const abRate = pct(m.abandon.abandoned, m.abandon.started);
  const prevAbRate = prev ? pct(prev.abandon.abandoned, prev.abandon.started) : null;
  if (m.abandon.started >= 30 && abRate >= 0.18) {
    out.push({ level: "warn", text: `시작 후 미제출(이탈)률 ${Math.round(abRate * 100)}% — 임계(18%) 초과. 초반 페이싱·로딩 점검` });
  } else if (prevAbRate != null && m.abandon.started >= 30 && abRate - prevAbRate >= 0.05) {
    out.push({ level: "warn", text: `이탈률 급등 ${Math.round(prevAbRate * 100)}% → ${Math.round(abRate * 100)}% (전주 대비 +${Math.round((abRate - prevAbRate) * 100)}%p)` });
  } else if (prevAbRate != null && prevAbRate - abRate >= 0.03) {
    out.push({ level: "good", text: `이탈률 개선 ${Math.round(prevAbRate * 100)}% → ${Math.round(abRate * 100)}%` });
  }

  // ④ 활성·판수 변화 (전주 대비)
  if (prev && prev.players >= 10) {
    const dp = pct(m.players - prev.players, prev.players);
    if (dp <= -0.25) out.push({ level: "warn", text: `주간 활성 유저 급감 ${prev.players} → ${m.players}명 (${Math.round(dp * 100)}%)` });
    else if (dp >= 0.25) out.push({ level: "good", text: `주간 활성 유저 증가 ${prev.players} → ${m.players}명 (+${Math.round(dp * 100)}%)` });

    const rpp = pct(m.runs, m.players);
    const prevRpp = pct(prev.runs, prev.players);
    if (prevRpp > 0 && pct(rpp - prevRpp, prevRpp) <= -0.25) {
      out.push({ level: "warn", text: `유저당 판수 급감 ${prevRpp.toFixed(1)} → ${rpp.toFixed(1)}판 — 피로 이탈 전조` });
    }
  }

  // ⑤ 재도전 과열
  if (m.chains.max_len >= 8) {
    out.push({ level: "info", text: `재도전 과열 체인 감지 — 최대 ${m.chains.max_len}연속 (10분 내). "한판만 더" 압박 관찰 필요` });
  }

  // ⑥ 텔레메트리 표본
  if (m.coverage.total >= 30 && pct(m.coverage.with_telemetry, m.coverage.total) < 0.7) {
    out.push({ level: "info", text: `텔레메트리 표본 ${Math.round(pct(m.coverage.with_telemetry, m.coverage.total) * 100)}% — 구버전 클라이언트 비중이 있어 이어하기·근소실패 지표는 참고용` });
  }

  if (!out.some((i) => i.level === "warn")) {
    out.push({ level: "good", text: "경고 신호 없음 — 주요 지표 안정 구간" });
  }
  return out;
}

async function generateWeek(weekStart: string, prev: WeeklyMetrics | null): Promise<WeeklyReport | null> {
  const db = admin();
  const { data, error } = await db.rpc("admin_weekly_stats", { p_week_start: weekStart });
  if (error || !data) return null;
  const metrics = data as WeeklyMetrics;
  if (!metrics.runs) return null; // 데이터 없는 주는 저장하지 않음
  const insights = buildInsights(metrics, prev);
  const now = new Date().toISOString();
  const { error: upErr } = await db
    .from("game_weekly_report")
    .upsert({ week_start: weekStart, metrics, insights, updated_at: now });
  if (upErr) return null;
  return { week_start: weekStart, metrics, insights, created_at: now };
}

export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = admin();

  const { data: stored, error } = await db
    .from("game_weekly_report")
    .select("week_start, metrics, insights, created_at")
    .order("week_start", { ascending: true })
    .limit(30);
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });

  // 완료된 최근 8주 중 미생성분 lazy 생성 (오래된 주부터 — 전주 대비 인사이트를 위해 순서 보장)
  const reports = (stored ?? []) as WeeklyReport[];
  const have = new Set(reports.map((r) => r.week_start));
  const thisWeek = currentWeekStartKst();
  for (let i = 8; i >= 1; i--) {
    const ws = addDays(thisWeek, -7 * i);
    if (have.has(ws)) continue;
    const prev = reports.filter((r) => r.week_start < ws).at(-1)?.metrics ?? null;
    const gen = await generateWeek(ws, prev);
    if (gen) {
      reports.push(gen);
      reports.sort((a, b) => (a.week_start < b.week_start ? -1 : 1));
    }
  }

  return NextResponse.json({ reports: reports.reverse(), this_week: thisWeek });
}

// 강제 재생성 — 룰 개정 후 재평가 or 주 마감 직후 갱신
export async function POST(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = z.object({ week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });

  const db = admin();
  const { data: prevRow } = await db
    .from("game_weekly_report")
    .select("metrics")
    .lt("week_start", parsed.data.week_start)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  const gen = await generateWeek(parsed.data.week_start, (prevRow?.metrics as WeeklyMetrics) ?? null);
  if (!gen) return NextResponse.json({ error: "no_data" }, { status: 404 });
  return NextResponse.json({ report: gen });
}
