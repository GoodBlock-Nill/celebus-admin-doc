"use client";

// 럭키드로우 이벤트 상세 (읽기 전용) — 소진 현황·참여 통계·행별 잔여/확률·실물 당첨 요약을 한 화면에.
// 수정은 [편집](폼)으로, 당첨자 개별 처리는 [당첨자] 패널로 분리 — 이 화면은 운영 현황 파악 전용.
import { useEffect, useState } from "react";
import { aget } from "@/lib/admin-api";
import { GRADE_COLORS } from "../GachaCard";

type PoolItem = {
  id?: string;
  grade: "S" | "A" | "B" | "C" | "D";
  prize: { ko?: string; en?: string; ja?: string };
  is_physical: boolean;
  fulfillment?: "delivery" | "mobile_ticket";
  reward_payload: { cp?: number; item?: string; qty?: number } | null;
  total_qty: number | null;
  remaining_qty?: number | null;
  per_user_cap: number | null;
  sort: number;
};
type Stats = { draws: number; players: number; last_draw_at: string | null; winners: Record<string, number> };

const ITEM_LABEL: Record<string, string> = { heart: "하트", bomb: "폭탄", line: "라인", shuffle: "셔플", time: "시간+" };
const WINNER_LABEL: [string, string][] = [
  ["pending", "수령 정보 입력 대기"],
  ["submitted", "지급·발송 대기"],
  ["shipped", "지급 완료"],
  ["expired", "기한 만료"],
  ["revoked", "무효 처리"],
];

const rewardLabel = (p: PoolItem) =>
  p.is_physical
    ? p.prize.ko || "(상품명)"
    : p.reward_payload?.cp != null
      ? `${p.reward_payload.cp.toLocaleString()} CP`
      : `${ITEM_LABEL[p.reward_payload?.item ?? ""] ?? "-"} ×${p.reward_payload?.qty ?? 1}`;

const fmtDate = (s: string) => {
  const d = new Date(s);
  return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function AdminGachaDetail({ eventId, pool }: { eventId: string; pool: PoolItem[] }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    aget<Stats>(`/api/admin/gacha/stats?event_id=${eventId}`)
      .then(setStats)
      .catch(() => setFailed(true));
  }, [eventId]);

  const rows = [...pool].sort((a, b) => a.sort - b.sort);
  const total = rows.reduce((s, p) => s + (p.total_qty ?? 0), 0);
  const remaining = rows.reduce((s, p) => s + (p.remaining_qty ?? 0), 0);
  const drawn = total - remaining;
  const winnerTotal = Object.values(stats?.winners ?? {}).reduce((s, n) => s + n, 0);

  return (
    <div className="mt-1 flex flex-col gap-3 rounded-[12px] bg-surface-2 p-3.5 ring-1 ring-hairline">
      {/* 소진 현황 */}
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-[12.5px] font-bold text-muted">소진 현황</span>
          <span className="text-[13px] font-black tabular-nums text-fg">
            {drawn.toLocaleString()}/{total.toLocaleString()}
            <span className="ml-1 text-[12px] font-bold text-subtle">({total > 0 ? Math.round((drawn / total) * 100) : 0}%)</span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-1">
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${total > 0 ? (drawn / total) * 100 : 0}%` }} />
        </div>
      </div>

      {/* 참여 통계 */}
      <div className="flex gap-4 text-[12.5px]">
        <span className="text-muted">
          뽑기 <b className="tabular-nums text-fg">{stats ? stats.draws.toLocaleString() : failed ? "-" : "…"}</b>회
        </span>
        <span className="text-muted">
          참여자 <b className="tabular-nums text-fg">{stats ? stats.players.toLocaleString() : failed ? "-" : "…"}</b>명
        </span>
        {stats?.last_draw_at && <span className="text-subtle">마지막 뽑기 {fmtDate(stats.last_draw_at)}</span>}
      </div>

      {/* 행별 현황 — 시작 확률(수량/박스) vs 현재 확률(잔여/잔여 합) */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[430px] text-[12.5px]">
          <thead>
            <tr className="text-left text-[11.5px] text-subtle">
              <th className="py-1 pr-2 font-bold">보상</th>
              <th className="py-1 pr-2 text-right font-bold">수량</th>
              <th className="py-1 pr-2 text-right font-bold">잔여</th>
              <th className="py-1 pr-2 text-right font-bold">시작 확률</th>
              <th className="py-1 pr-2 text-right font-bold">현재 확률</th>
              <th className="py-1 font-bold">비고</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const soldOut = (p.remaining_qty ?? 0) <= 0;
              return (
                <tr key={p.id ?? i} className="border-t border-hairline">
                  <td className="max-w-[160px] truncate py-1.5 pr-2 font-bold text-fg">
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: GRADE_COLORS[p.grade] }} />
                    {rewardLabel(p)}
                  </td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-muted">{(p.total_qty ?? 0).toLocaleString()}</td>
                  <td className={`py-1.5 pr-2 text-right tabular-nums ${soldOut ? "font-black text-danger" : "text-fg"}`}>
                    {soldOut ? "소진" : (p.remaining_qty ?? 0).toLocaleString()}
                  </td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-subtle">
                    {total > 0 && p.total_qty ? (((p.total_qty ?? 0) / total) * 100).toFixed(2) : "0"}%
                  </td>
                  <td className="py-1.5 pr-2 text-right font-bold tabular-nums text-primary-400">
                    {remaining > 0 && !soldOut ? (((p.remaining_qty ?? 0) / remaining) * 100).toFixed(2) : "0"}%
                  </td>
                  <td className="whitespace-nowrap py-1.5 text-[11.5px] text-subtle">
                    {p.is_physical && (p.fulfillment === "mobile_ticket" ? "모바일 티켓" : "배송")}
                    {p.is_physical && p.per_user_cap != null && ` · 1인 ${p.per_user_cap}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 실물 당첨 요약 — 개별 처리는 [당첨자] 패널에서 */}
      {rows.some((p) => p.is_physical) && (
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="font-bold text-muted">실물 당첨 {stats ? `${winnerTotal.toLocaleString()}건` : failed ? "-" : "…"}</span>
          {stats &&
            WINNER_LABEL.filter(([k]) => (stats.winners[k] ?? 0) > 0).map(([k, label]) => (
              <span key={k} className={`rounded-full px-2 py-0.5 font-bold ring-1 ring-hairline ${k === "pending" ? "bg-gold/15 text-gold" : "bg-surface-1 text-muted"}`}>
                {label} {stats.winners[k]}
              </span>
            ))}
        </div>
      )}

      <p className="text-[11.5px] leading-relaxed text-subtle break-keep">
        현재 확률은 잔여 수량 비례(유저 확률 공시와 동일 기준)예요. 구성·수량 수정은 [편집], 당첨자 개별 처리는 [당첨자]에서 해요.
      </p>
    </div>
  );
}
