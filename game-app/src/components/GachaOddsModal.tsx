"use client";

// 뽑기 확률 공시 모달 — 확률형 아이템 공시 의무 대응 (가중치 → % 환산, 실제 추첨 풀과 항상 일치)
import { useRef } from "react";
import { GAME_CONFIG } from "@/lib/game-config";
import type { GachaEvent } from "@/lib/game-api";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { GRADE_COLORS } from "./GachaCard";
import { useLang } from "./LangProvider";

export default function GachaOddsModal({ event, onClose }: { event: GachaEvent; onClose: () => void }) {
  const { t, lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true, onClose);

  const isBox = event.kind === "physical_box";
  // 박스형: 잔여/전체 공시 (남은 수량 비례 균등 확률) / 확률형: 가중치 → %
  const items = isBox ? event.pool : event.pool.filter((p) => (p.weight ?? 0) > 0);
  const total = items.reduce((s, p) => s + (p.weight ?? 0), 0);

  return (
    <div className="anim-backdrop-in fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-contain bg-black/80 p-4">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t("gacha_odds_title")}
        tabIndex={-1}
        className="anim-pop-in my-auto w-full max-w-xs rounded-[22px] bg-surface-2 p-5 outline-none ring-1 ring-hairline"
      >
        <div className="text-center text-[16px] font-black text-fg">{t("gacha_odds_title")}</div>
        <div className="mt-3 flex flex-col gap-1.5">
          {items.map((p, i) => {
            const pct = total > 0 ? ((p.weight ?? 0) / total) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-2.5 rounded-[12px] bg-surface-1 px-3 py-2.5 ring-1 ring-hairline">
                {(p.image_url ?? (p.reward_payload?.cp != null ? GAME_CONFIG.gachaCards.cp : p.reward_payload?.item ? GAME_CONFIG.gachaCards[p.reward_payload.item as keyof typeof GAME_CONFIG.gachaCards] : null)) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url ?? (p.reward_payload?.cp != null ? GAME_CONFIG.gachaCards.cp : GAME_CONFIG.gachaCards[p.reward_payload?.item as keyof typeof GAME_CONFIG.gachaCards])}
                    alt=""
                    className="h-7 w-7 shrink-0 rounded-[6px] object-cover"
                  />
                ) : (
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: GRADE_COLORS[p.grade] }} />
                )}
                <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-fg">{p.prize[lang] || p.prize.ko || ""}</span>
                {isBox ? (
                  <span className={`shrink-0 text-[13px] font-black tabular-nums ${(p.remaining_qty ?? 0) === 0 ? "text-subtle line-through" : "text-muted"}`}>
                    {t("gacha_stock_left").replace("{r}", String(p.remaining_qty ?? 0)).replace("{t}", String(p.total_qty ?? 0))}
                  </span>
                ) : (
                  <span className="shrink-0 text-[13px] font-black tabular-nums text-muted">{pct.toFixed(pct >= 10 ? 1 : 2)}%</span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] leading-snug text-subtle break-keep">{isBox ? t("gacha_box_note") : t("gacha_paid_note")}</p>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-full bg-primary py-3 text-[15px] font-black text-white active:scale-[0.99]"
        >
          {t("confirm")}
        </button>
      </div>
    </div>
  );
}
