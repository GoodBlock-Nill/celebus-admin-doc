"use client";

import { useEffect, useRef, useState } from "react";
import { Flame, X, Check } from "lucide-react";
import { toast } from "sonner";
import { getDailyStatus, claimDaily, type DailyStatus } from "@/lib/game-api";
import { GAME_CONFIG } from "@/lib/game-config";
import { sfxCoin } from "@/lib/sfx";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { useLang } from "./LangProvider";

// 출석 보상 모달 — 7일 출석 캘린더 + 오늘 보상 수령. onClaimed로 잔액/상태 상위 반영.
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
    setStatus((s) => ({ claimable: false, streak: res.streak ?? 0, next_reward: null, daily: s?.daily }));
    if (res.celeb_point != null) onClaimed?.(res.celeb_point);
    toast.success(t("daily_got").replace("{n}", String(res.reward ?? 0)));
  };

  const streak = status?.streak ?? 0;
  const claimable = status?.claimable ?? false;
  const reward = claimedReward ?? status?.next_reward ?? null;

  // 7일 보상 사다리: reward[d] = base + step*(d-1)
  // 서버 적용값(status.daily) 우선 — 빌드 기본값만 쓰면 관리자 설정 변경이 표기에 반영되지 않는다 (지급만 맞고 표는 구값)
  const { base, streakStep, maxStreakDays } = status?.daily ?? GAME_CONFIG.daily;
  const days = Array.from({ length: maxStreakDays }, (_, i) => ({ day: i + 1, reward: base + streakStep * i }));
  // 현재 위치: 수령 가능하면 다음 칸이 '오늘', 이미 받았으면 마지막 받은 칸이 '오늘'
  const todayIdx = claimable ? Math.min(streak, maxStreakDays - 1) : Math.min(streak - 1, maxStreakDays - 1);
  const cellState = (i: number): "claimed" | "today" | "future" => {
    if (claimable) {
      if (i === todayIdx) return "today";
      return i < streak ? "claimed" : "future";
    }
    return i <= todayIdx ? "claimed" : "future";
  };

  return (
    <div className="anim-backdrop-in fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-contain bg-black/75 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("daily_reward")}
        tabIndex={-1}
        className="anim-pop-in relative my-auto w-full max-w-[340px] overflow-hidden rounded-[26px] bg-surface-2 text-center outline-none ring-1 ring-hairline"
      >
        {/* 헤더 밴드 (브랜드 그라데이션 + 선물 카드) */}
        <div className="relative flex flex-col items-center gap-2 bg-gradient-to-b from-primary/30 to-transparent px-6 pt-6 pb-2">
          <button
            onClick={onClose}
            aria-label={t("back")}
            className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-white/70 active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/daily-checkin.png" alt="" className="h-[92px] w-[92px] drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]" />
          <div className="text-[17px] font-black text-white">{t("daily_reward")}</div>
          <div className="inline-flex items-center gap-1 rounded-full bg-black/35 px-3 py-1 text-[12px] font-black text-gold ring-1 ring-white/15">
            <Flame className="h-3.5 w-3.5" /> {t("streak_days").replace("{n}", String(streak))}
          </div>
        </div>

        <div className="px-5 pb-5 pt-3">
          {/* 7일 출석 캘린더 */}
          <div className="mb-1 text-left text-[11px] font-bold text-subtle">{t("daily_week")}</div>
          <div className="grid grid-cols-7 gap-1">
            {days.map(({ day, reward: r }, i) => {
              const st = cellState(i);
              const isMax = day === maxStreakDays;
              return (
                <div
                  key={day}
                  className={[
                    "relative flex flex-col items-center gap-0.5 rounded-[10px] py-1.5",
                    st === "today"
                      ? "bg-primary/25 ring-2 ring-primary-400"
                      : st === "claimed"
                        ? "bg-surface-1 ring-1 ring-hairline"
                        : "bg-surface-1/60 ring-1 ring-hairline",
                  ].join(" ")}
                >
                  <span className={`text-[7.5px] font-bold ${st === "today" ? "text-primary-400" : "text-subtle"}`}>
                    {isMax ? t("daily_max") : `D${day}`}
                  </span>
                  {st === "claimed" ? (
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-verified/20 text-verified">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  ) : (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/currency.png"
                        alt=""
                        className={`h-[18px] w-[18px] ${st === "future" ? "opacity-45" : ""}`}
                      />
                    </>
                  )}
                  <span
                    className={`text-[8px] font-black tabular-nums leading-none ${
                      st === "today" ? "text-white" : st === "future" ? "text-subtle" : "text-muted"
                    }`}
                  >
                    {r}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 오늘 보상 */}
          <div className="mb-4 mt-4">
            <div className="text-[11px] font-bold text-subtle">{t("daily_today")}</div>
            <div className="mt-1 flex items-center justify-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/currency.png" alt="CELEB Point" className="h-7 w-7 drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]" />
              <span className="text-[24px] font-black tabular-nums text-white">
                {reward != null ? reward.toLocaleString() : "-"}
              </span>
            </div>
          </div>

          {claimable && claimedReward == null ? (
            <button
              onClick={doClaim}
              disabled={busy}
              className="btn-ornate w-full rounded-[16px] py-3.5 text-[16px] font-black text-white disabled:opacity-50"
              style={{ background: "linear-gradient(180deg, #7c5cf0 0%, #5a3cc0 100%)" }}
            >
              {t("claim")}
            </button>
          ) : (
            <div className="rounded-[16px] bg-surface-1 py-3.5 text-[14px] font-bold text-muted ring-1 ring-hairline">
              {t("claimed_today")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
