"use client";

// 주간 리포트 — 주간(KST 월~일) 지표 스냅샷 + 전주 대비 증감 + 룰 기반 개선 인사이트.
// 탭을 열면 완료된 최근 주가 자동 생성·저장된다(서버 lazy 생성). 밸런스 탭이 "실시간 계측"이라면
// 여기는 "주 단위 회고" — 개선 액션의 근거를 남기는 용도.
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Info, CircleCheck, RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { aget, asend } from "@/lib/admin-api";
import { Card, Stat } from "./ui";
import type { WeeklyReport, WeeklyMetrics, Insight } from "@/app/api/admin/weekly-report/route";

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
const fmtWeek = (ws: string) => {
  const end = new Date(`${ws}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);
  return `${ws.slice(5).replace("-", ".")} ~ ${end.toISOString().slice(5, 10).replace("-", ".")}`;
};

// 전주 대비 증감 화살표 — 낮을수록 좋은 지표는 invert로 색 반전
function Delta({ now, prev, invert = false, unit = "" }: { now: number; prev: number | null; invert?: boolean; unit?: string }) {
  if (prev == null || prev === 0) return null;
  const diff = now - prev;
  if (Math.abs(diff) < 0.001) return <span className="ml-1.5 inline-flex items-center text-[11px] font-bold text-subtle"><Minus className="h-3 w-3" /></span>;
  const up = diff > 0;
  const goodDir = invert ? !up : up;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`ml-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold ${goodDir ? "text-emerald-400" : "text-danger"}`}>
      <Icon className="h-3 w-3" /> {up ? "+" : ""}{Number.isInteger(diff) ? diff : diff.toFixed(1)}{unit}
    </span>
  );
}

const INSIGHT_META = {
  warn: { icon: AlertTriangle, cls: "text-amber-400", label: "경고" },
  info: { icon: Info, cls: "text-sky-400", label: "관찰" },
  good: { icon: CircleCheck, cls: "text-emerald-400", label: "양호" },
} as const;

export default function AdminWeeklyReport() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(false);
    try {
      const j = await aget<{ reports: WeeklyReport[] }>("/api/admin/weekly-report");
      setReports(j.reports ?? []);
      setSelected((cur) => cur ?? j.reports?.[0]?.week_start ?? null);
    } catch {
      setErr(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const idx = reports.findIndex((r) => r.week_start === selected);
  const report = idx >= 0 ? reports[idx] : null;
  const prev: WeeklyMetrics | null = idx >= 0 ? reports[idx + 1]?.metrics ?? null : null; // 목록은 최신순

  async function regenerate() {
    if (!report || busy) return;
    setBusy(true);
    try {
      await asend("/api/admin/weekly-report", "POST", { week_start: report.week_start });
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="py-10 text-center text-[12.5px] text-subtle">리포트 생성·로드 중… (첫 진입 시 최대 수 초)</p>;
  if (err) return <p className="py-10 text-center text-[12.5px] text-danger">불러오지 못했어요. 새로고침해 주세요.</p>;
  if (!report) return <p className="py-10 text-center text-[12.5px] text-subtle">아직 데이터가 있는 완료 주가 없어요. 다음 주 월요일부터 자동 생성돼요.</p>;

  const m = report.metrics;
  const abRate = pct(m.abandon.abandoned, m.abandon.started);
  const prevAbRate = prev ? pct(prev.abandon.abandoned, prev.abandon.started) : null;
  const offered = m.cont.used + m.cont.declined;
  const contRate = pct(m.cont.used, offered);
  const prevContRate = prev ? pct(prev.cont.used, prev.cont.used + prev.cont.declined) : null;
  const rpp = m.players > 0 ? m.runs / m.players : 0;
  const prevRpp = prev && prev.players > 0 ? prev.runs / prev.players : null;
  const insights = (report.insights ?? []) as Insight[];
  const hotspots = m.levels
    .filter((l) => l.mode === "daily" && l.runs >= 20)
    .map((l) => ({ ...l, rate: pct(l.near, l.runs) }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      {/* 주차 선택 + 재생성 */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={report.week_start}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-[10px] bg-surface-2 px-3 py-2 text-[13px] font-bold ring-1 ring-hairline"
        >
          {reports.map((r) => (
            <option key={r.week_start} value={r.week_start}>{fmtWeek(r.week_start)} 주</option>
          ))}
        </select>
        <button onClick={() => void regenerate()} disabled={busy} className="inline-flex items-center gap-1.5 rounded-[10px] bg-surface-2 px-3 py-2 text-[12px] font-bold text-muted ring-1 ring-hairline hover:text-fg disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} /> 재생성
        </button>
        <span className="text-[11.5px] text-subtle">표본 {m.coverage.total}판 · 텔레메트리 {pct(m.coverage.with_telemetry, m.coverage.total)}%</span>
      </div>

      {/* 개선 인사이트 */}
      <Card title="개선 인사이트 (룰 기반 자동 판정)">
        <ul className="flex flex-col gap-2">
          {insights.map((i, k) => {
            const meta = INSIGHT_META[i.level] ?? INSIGHT_META.info;
            const Icon = meta.icon;
            return (
              <li key={k} className="flex items-start gap-2 text-[13px] leading-relaxed">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.cls}`} />
                <span><b className={`mr-1 ${meta.cls}`}>[{meta.label}]</b>{i.text}</span>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* 핵심 지표 + 전주 대비 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="주간 활성 유저" value={<>{m.players}<Delta now={m.players} prev={prev?.players ?? null} /></>} />
        <Stat label="판수" value={<>{m.runs}<Delta now={m.runs} prev={prev?.runs ?? null} /></>} />
        <Stat label="유저당 판수" value={<>{rpp.toFixed(1)}<Delta now={Number(rpp.toFixed(1))} prev={prevRpp != null ? Number(prevRpp.toFixed(1)) : null} /></>} />
        <Stat label="신규 유저" value={<>{m.new_players}<Delta now={m.new_players} prev={prev?.new_players ?? null} /></>} />
        <Stat label="이탈률 (시작 후 미제출)" value={<>{abRate}%<Delta now={abRate} prev={prevAbRate} invert unit="%p" /></>} />
        <Stat label="이어하기 사용률" value={<>{contRate}%<Delta now={contRate} prev={prevContRate} unit="%p" /></>} />
        <Stat label="이어하기 평균 연속" value={<>{m.cont.avg_continues}<Delta now={m.cont.avg_continues} prev={prev?.cont.avg_continues ?? null} invert /></>} />
        <Stat label="최대 재도전 체인" value={<>{m.chains.max_len}<Delta now={m.chains.max_len} prev={prev?.chains.max_len ?? null} invert /></>} />
      </div>

      {/* 근소 실패 핫스팟 */}
      <Card title="근소 실패 핫스팟 — 일반 매치 (진행도 80%+에서 종료, 표본 20판 이상)">
        {hotspots.length === 0 ? (
          <p className="text-[12.5px] text-subtle">표본 20판 이상 레벨이 없어요.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {hotspots.map((h) => (
              <div key={h.level} className="flex items-center gap-3 text-[13px]">
                <span className="w-14 shrink-0 font-black tabular-nums">L{h.level}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div className={`h-full rounded-full ${h.rate >= 25 ? "bg-amber-400" : "bg-primary-400"}`} style={{ width: `${Math.min(100, h.rate)}%` }} />
                </div>
                <span className={`w-24 shrink-0 text-right tabular-nums ${h.rate >= 25 ? "font-bold text-amber-400" : "text-muted"}`}>{h.rate}% ({h.near}/{h.runs})</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-[11.5px] leading-relaxed text-subtle">25% 이상(주황)은 "한 끗 차이 좌절" 구간 — 설정 탭의 레벨 목표 하향 또는 클러치 타임 검토 대상이에요.</p>
      </Card>
    </div>
  );
}
