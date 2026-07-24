"use client";

// 대시보드 — 오늘 지표 + KPI(목표 대비) + 가입 퍼널
import { useEffect, useState } from "react";
import { aget } from "@/lib/admin-api";
import { Card, Stat } from "./ui";

type Stats = {
  profiles_total: number;
  profiles_today: number;
  scores_total: number;
  scores_today: number;
  players_today: number;
  cp_minted: number;
  cp_burned: number;
  daily_claims_today: number;
  funnel_today: Record<string, number>;
  d1_cohort: number;
  d1_returned: number;
  flagged_total: number;
};

// 파일럿 KPI 목표 (초안 — 운영자 확정값)
const KPI = { signupRate: 60, d1: 30, gamesPerPlayer: 3 };

function KpiCard({ label, value, target, unit }: { label: string; value: number | null; target: number; unit: string }) {
  const ok = value != null && value >= target;
  return (
    <div className={`rounded-[12px] px-3 py-2.5 ring-1 ${ok ? "bg-verified/10 ring-verified/30" : "bg-surface-2 ring-hairline"}`}>
      <div className="text-[10.5px] font-bold text-subtle">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className={`text-[18px] font-black tabular-nums ${ok ? "text-verified" : "text-fg"}`}>
          {value == null ? "-" : `${value}${unit}`}
        </span>
        <span className="text-[10px] text-subtle">
          목표 {target}
          {unit}
        </span>
      </div>
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
  const pct = (a: number | undefined, b: number | undefined) =>
    a != null && b != null && b > 0 ? Math.round((a / b) * 100) : null;
  const signupRate = pct(f.signup_done, f.gate_view);
  const d1 = s.d1_cohort > 0 ? Math.round((s.d1_returned / s.d1_cohort) * 100) : null;
  const gpp = s.players_today > 0 ? Math.round((s.scores_today / s.players_today) * 10) / 10 : null;

  const FUNNEL: [string, number | undefined][] = [
    ["방문", f.visit],
    ["게이트 노출", f.gate_view],
    ["가입 시도", f.signup_start],
    ["가입 완료", f.signup_done],
    ["첫 판 시작", f.first_game],
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card title="파일럿 KPI (오늘, 목표 대비)">
        <div className="grid grid-cols-3 gap-2">
          <KpiCard label="가입 전환 (게이트→완료)" value={signupRate} target={KPI.signupRate} unit="%" />
          <KpiCard label={`D1 리텐션 (코호트 ${s.d1_cohort})`} value={d1} target={KPI.d1} unit="%" />
          <KpiCard label="인당 판수" value={gpp} target={KPI.gamesPerPlayer} unit="" />
        </div>
      </Card>

      <Card title="가입 퍼널 (오늘, KST)">
        <div className="flex items-stretch gap-1.5 overflow-x-auto">
          {FUNNEL.map(([label, v], i) => (
            <div key={label} className="flex min-w-[86px] flex-1 flex-col items-center gap-0.5">
              <div className="w-full rounded-[10px] bg-surface-2 px-2 py-2 text-center">
                <div className="text-[10px] font-bold text-subtle">{label}</div>
                <div className="text-[16px] font-black tabular-nums">{v ?? 0}</div>
              </div>
              {i > 0 && (
                <span className="text-[9.5px] font-bold text-primary-400">
                  {pct(v, FUNNEL[i - 1][1]) != null ? `${pct(v, FUNNEL[i - 1][1])}%` : "-"}
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card title="오늘 지표 (KST)">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="가입자 (누적)" value={s.profiles_total} />
          <Stat label="가입 (오늘)" value={s.profiles_today} />
          <Stat label="플레이 유저 (오늘)" value={s.players_today} />
          <Stat label="게임 수 (오늘)" value={s.scores_today} />
          <Stat label="게임 수 (누적)" value={s.scores_total} />
          <Stat label="출석 (오늘)" value={s.daily_claims_today} />
          <Stat label="CP 발행 (누적)" value={s.cp_minted} />
          <Stat label="CP 소진 (누적)" value={s.cp_burned} />
        </div>
        {s.flagged_total > 0 && (
          <p className="mt-2 text-[11.5px] font-bold text-danger">⚠️ 이상 제출 의심 계정 {s.flagged_total}명 — 리더보드 탭에서 확인</p>
        )}
      </Card>
    </div>
  );
}
