"use client";

import { useEffect, useRef, useState } from "react";
import { Gift, Flame, X } from "lucide-react";
import { toast } from "sonner";
import { getDailyStatus, claimDaily, type DailyStatus } from "@/lib/game-api";
import { sfxCoin } from "@/lib/sfx";
import { useFocusTrap } from "@/lib/use-focus-trap";
import CoinBalance from "./CoinBalance";
import { useLang } from "./LangProvider";

// 출석 보상 모달 — 스트릭 표시 + 오늘 보상 수령. onClaimed로 잔액/상태 상위 반영.
export default function DailyReward({
  onClose,
  onClaimed,
}: {
  onClose: () => void;
  onClaimed?: (celebPoint: number) => void;
}) {
  const { t } = useLang();
  const [status, setStatus] = useState<DailyStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [claimedReward, setClaimedReward] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true, onClose);

  useEffect(() => {
    getDailyStatus().then(setStatus);
  }, []);

  const doClaim = async () => {
    if (busy) return;
    setBusy(true);
    const res = await claimDaily();
    setBusy(false);
    if (!res || !res.claimed) {
      // 이미 오늘 받았거나 실패 → 상태 갱신
      getDailyStatus().then(setStatus);
      return;
    }
    sfxCoin();
    setClaimedReward(res.reward ?? 0);
    setStatus({ claimable: false, streak: res.streak ?? 0, next_reward: null });
    if (res.celeb_point != null) onClaimed?.(res.celeb_point);
    toast.success(t("daily_got").replace("{n}", String(res.reward ?? 0)));
  };

  const streak = status?.streak ?? 0;
  const claimable = status?.claimable ?? false;
  const reward = claimedReward ?? status?.next_reward ?? null;

  return (
    <div className="anim-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("daily_reward")}
        tabIndex={-1}
        className="anim-pop-in relative w-full max-w-xs rounded-[22px] bg-surface-2 p-6 text-center outline-none ring-1 ring-hairline"
      >
        <button onClick={onClose} aria-label={t("back")} className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-subtle active:scale-90">
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary/15 text-primary-400">
          <Gift className="h-8 w-8" />
        </div>
        <div className="mt-3 text-[16px] font-black">{t("daily_reward")}</div>

        {/* 스트릭 */}
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-surface-1 px-3 py-1 text-[12px] font-bold text-gold ring-1 ring-hairline">
          <Flame className="h-3.5 w-3.5" /> {t("streak_days").replace("{n}", String(claimable ? streak : streak))}
        </div>

        {/* 보상 */}
        <div className="my-4">
          <div className="text-[11px] font-bold text-subtle">{claimable && claimedReward == null ? t("next_reward") : t("daily_reward")}</div>
          <div className="mt-1 flex items-center justify-center">
            <CoinBalance amount={reward} />
          </div>
        </div>

        {claimable && claimedReward == null ? (
          <button
            onClick={doClaim}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-[15px] font-black text-white active:scale-[0.99] disabled:opacity-50"
          >
            <Gift className="h-4 w-4" /> {t("claim")}
          </button>
        ) : (
          <div className="rounded-full bg-surface-1 py-3 text-[13px] font-bold text-muted ring-1 ring-hairline">{t("claimed_today")}</div>
        )}
      </div>
    </div>
  );
}
