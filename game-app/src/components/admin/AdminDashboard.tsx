"use client";

// 대시보드 — SSO 현실 반영: 자체 가입 폼이 없어 선형 '가입 퍼널'은 폐기.
//   오늘 지표 + 핵심 지표(활성화·리텐션·인당판수, 목표는 참고값) + 로그인 마찰 + 누적.
import { useEffect, useState } from "react";
import { aget } from "@/lib/admin-api";
import { Card, Stat } from "./ui";

type Stats = {
  profiles_total: number;
  profiles_today: number;
  scores_total: number;
  scores_today: number;
  players_today: number;
  daily_claims_today: number;
  funnel_today: Record<string, number>;
  d1_cohort: number;
  d1_returned: number;
  flagged_total: number;
  replay_mismatch_week: number;
  replay_enforce_modes: string[];
};

const MODE_KO: Record<string, string> = { daily: "일반 매치", free: "아이템 매치" };

// 참고 목표(운영자 확정 전 초안) — 달성 시 초록 강조
const KPI = { activation: 25, d1: 30, gamesPerPlayer: 3 };

function KpiCard({ label, value, target, unit, note }: { label: string; value: number | null; target: number; unit: string; note?: string }) {
  const ok = value != null && value >= target;
  return (
    <div className={`rounded-[12px] px-3.5 py-3 ring-1 ${ok ? "bg-verified/10 ring-verified/30" : "bg-surface-2 ring-hairline"}`}>
      <div className="text-[12px] font-bold text-muted">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={`text-[22px] font-black tabular-nums ${ok ? "text-verified" : "text-fg"}`}>{value == null ? "-" : `${value}${unit}`}</span>
        <span className="text-[11.5px] text-subtle">
          목표 {target}
          {unit}
        </span>
      </div>
      {note && <div className="mt-0.5 text-[11px] text-subtle">{note}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => {
    aget<Stats>("/api/admin/stats").then(setS).catch(() => {});
  }, []);
  if (!s) return <p className="text-[13px] text-subtle">불러오는 중…</p>;

  const f = s.funnel_today ?? {};
  const pct = (a: number | undefined, b: number | undefined) => (a != null && b != null && b > 0 ? Math.round((a / b) * 100) : null);
  const activation = pct(f.first_game, f.visit); // 방문 → 첫 판
  const d1 = s.d1_cohort > 0 ? Math.round((s.d1_returned / s.d1_cohort) * 100) : null;
  const gpp = s.players_today > 0 ? Math.round((s.scores_today / s.players_today) * 10) / 10 : null;

  return (
    <div className="flex flex-col gap-4">
      {/* 오늘 지표 */}
      <Card title="오늘 (KST)">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="방문" value={f.visit ?? 0} />
          <Stat label="신규 가입" value={s.profiles_today} />
          <Stat label="첫 판 시작" value={f.first_game ?? 0} />
          <Stat label="활성 플레이어" value={s.players_today} />
          <Stat label="게임 수" value={s.scores_today} />
          <Stat label="출석" value={s.daily_claims_today} />
        </div>
      </Card>

      {/* 핵심 지표 (목표는 참고값) */}
      <Card title="핵심 지표 (오늘 · 목표는 참고값)">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <KpiCard label="활성화율 (방문 → 첫 판)" value={activation} target={KPI.activation} unit="%" note={`방문 ${f.visit ?? 0} · 첫 판 ${f.first_game ?? 0}`} />
          <KpiCard label="D1 리텐션" value={d1} target={KPI.d1} unit="%" note={`어제 가입 ${s.d1_cohort}명 중 ${s.d1_returned}명 복귀`} />
          <KpiCard label="인당 판수" value={gpp} target={KPI.gamesPerPlayer} unit="" note={`게임 ${s.scores_today} / 플레이어 ${s.players_today}`} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 로그인 마찰 */}
        <Card title="로그인 마찰 (오늘)">
          <div className="rounded-[12px] bg-surface-2 px-3.5 py-3">
            <div className="text-[12px] font-bold text-muted">CELEBUS 로그인 필요 화면 노출</div>
            <div className="mt-1 text-[22px] font-black tabular-nums">{f.gate_view ?? 0}회</div>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
            CELEBUS에 로그인하지 않은 채로 게임에 들어와 로그인 안내 화면을 본 횟수예요. 앱 배너로 들어오면 자동 로그인되므로,
            이 값이 크면 진입 경로(로그인 세션 전달)를 점검해요.
          </p>
        </Card>

        {/* 누적 */}
        <Card title="누적">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="총 가입자" value={s.profiles_total} />
            <Stat label="총 게임 수" value={s.scores_total} />
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
            CP 발행·소진·유통은 <b className="text-fg">경제</b> 탭에서 자세히 볼 수 있어요.
          </p>
        </Card>
      </div>

      {(s.flagged_total > 0 || (s.replay_mismatch_week ?? 0) > 0) && (
        <Card title="점검 필요">
          {s.flagged_total > 0 && (
            <p className="text-[13.5px] font-bold text-danger">
              ⚠️ 이상 제출 의심 계정 {s.flagged_total}명 — <b>리더보드</b> 탭의 &lsquo;의심만&rsquo; 필터에서 확인·정리하세요.
            </p>
          )}
          {(s.replay_mismatch_week ?? 0) > 0 && (
            <p className="mt-1.5 text-[13.5px] font-bold text-gold">
              🔁 서버 리플레이 불일치 {s.replay_mismatch_week}건 (최근 7일) — <b>로그</b> 탭 시스템 필터에서 확인. 조작 신호이자 엔진 정합 점검용이에요.
            </p>
          )}
        </Card>
      )}

      {/* 리플레이 방어 상태 — 자동 관리 */}
      {(() => {
        const enforced = Array.isArray(s.replay_enforce_modes) ? s.replay_enforce_modes : [];
        const enforcedKo = enforced.map((m) => MODE_KO[m] ?? m);
        return (
          <Card title={`점수 방어 상태 — ${enforced.length === 2 ? "거부 시행 중" : enforced.length ? "일부 거부 시행" : "섀도우 관찰 중"}`}>
            <p className="text-[13px] leading-relaxed text-muted">
              서버 리플레이 검증이 <b className="text-fg">자동 관리</b>돼요 — 모드별로 실유저 데이터에서 명백 조작만 걸러지는 게 확인되면
              그 모드를 <b className="text-fg">자동으로 거부 시행</b>으로 승격하고, 이상 급등 시 자동으로 섀도우로 되돌려요(안전 밸브).
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-[10px] bg-surface-2 px-3.5 py-2.5">
                <div className="text-[11px] text-subtle">거부 시행 모드</div>
                <b className={enforced.length ? "text-verified" : "text-muted"}>{enforced.length ? enforcedKo.join(", ") : "없음 (관찰만)"}</b>
              </div>
              <div className="rounded-[10px] bg-surface-2 px-3.5 py-2.5">
                <div className="text-[11px] text-subtle">리플레이 불일치 (7일)</div>
                <b className={(s.replay_mismatch_week ?? 0) > 0 ? "text-gold" : "text-fg"}>{s.replay_mismatch_week ?? 0}건</b>
              </div>
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
