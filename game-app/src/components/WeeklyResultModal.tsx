"use client";

// 지난주 랭킹 결과 모달 — 새 주 첫 접속 시 1회. 모드별 최종 순위 + 자동 지급된 보상 CP·가챠 이용권.
import { useRef } from "react";
import { Ticket, Trophy } from "lucide-react";
import type { WeeklyReward } from "@/lib/game-api";
import { weekRangeLabel } from "@/lib/week";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { useLang } from "./LangProvider";

// 컨페티 (결정적 배치 — 랜덤 미사용)
const CONFETTI_COLORS = ["#f5c451", "#8b5cf6", "#ec4899", "#60a5fa", "#34d399"];
const CONFETTI = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 61) % 100,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: (i % 5) * 0.12,
}));

export default function WeeklyResultModal({ data, onClose }: { data: WeeklyReward; onClose: () => void }) {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true, onClose);
  const ticketTotal = data.gacha?.total_tickets ?? 0;
  const rewarded = (data.total_cp ?? 0) > 0 || ticketTotal > 0;

  const Row = ({ label, r, tk }: { label: string; r?: { rank: number; cp: number; paid: boolean }; tk?: { tickets: number; paid: boolean } }) =>
    r ? (
      <div className="flex items-center justify-between rounded-[14px] bg-surface-1 px-4 py-3 ring-1 ring-hairline">
        <span className="text-[13px] font-bold text-muted">{label}</span>
        <span className="flex items-baseline gap-2">
          <span className="text-[18px] font-black tabular-nums text-primary-400">
            {r.rank.toLocaleString()}
            <span className="text-[11px] font-bold text-muted">{t("rank_unit")}</span>
          </span>
          {r.paid && r.cp > 0 && <span className="text-[12px] font-black text-gold">+{r.cp} CP</span>}
          {tk?.paid && tk.tickets > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[12px] font-black text-primary-400">
              <Ticket className="h-3.5 w-3.5" />+{tk.tickets}
            </span>
          )}
        </span>
      </div>
    ) : null;

  return (
    <div className="anim-backdrop-in fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-contain bg-black/80 p-4">
      {rewarded &&
        CONFETTI.map((p, i) => (
          <span key={i} className="confetti-piece" style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s` }} />
        ))}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t("weekly_title")}
        tabIndex={-1}
        className="anim-pop-in my-auto w-full max-w-xs rounded-[22px] bg-surface-2 p-6 text-center outline-none ring-1 ring-hairline"
      >
        <Trophy className="mx-auto h-10 w-10 text-gold" />
        <div className="mt-2 text-[17px] font-black">{t("weekly_title")}</div>
        {data.week_start && <div className="mt-0.5 text-[11px] font-bold text-subtle">{weekRangeLabel(data.week_start)} (KST)</div>}

        <div className="mt-4 flex flex-col gap-2">
          <Row label={t("lb_normal")} r={data.rewards?.normal} tk={data.gacha?.tickets?.normal} />
          <Row label={t("lb_item")} r={data.rewards?.item} tk={data.gacha?.tickets?.item} />
        </div>

        {rewarded ? (
          <div className="mt-3 rounded-[14px] bg-gold/10 px-4 py-3 ring-1 ring-gold/30">
            <div className="text-[11px] font-bold text-subtle">{t("weekly_total")}</div>
            {(data.total_cp ?? 0) > 0 && (
              <div className="text-[24px] font-black tabular-nums text-gold">+{(data.total_cp ?? 0).toLocaleString()} CP</div>
            )}
            {ticketTotal > 0 && (
              <div className="mt-0.5 inline-flex items-center gap-1 text-[15px] font-black text-primary-400">
                <Ticket className="h-4 w-4" />
                {t("weekly_tickets").replace("{n}", ticketTotal.toLocaleString())}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-3 text-[12px] leading-snug text-muted break-keep">{t("weekly_no_reward")}</p>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-primary py-3 text-[15px] font-black text-white active:scale-[0.99]"
        >
          {t("weekly_confirm")}
        </button>
      </div>
    </div>
  );
}
