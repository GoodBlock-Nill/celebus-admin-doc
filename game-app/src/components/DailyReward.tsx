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

  // 보상 사다리: reward[d] = base + step*(d-1)
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

  // 장기(8일+) 사다리는 주 단위 뷰 — 출시 앱 패턴(현재 주 7칸만 크게, 나머지는 탭으로 미리보기).
  // 28칸을 한 화면에 깔면 셀이 좁아져 금액이 안 읽힌다. 기본 선택 = 오늘이 속한 주.
  const weeks: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const todayWeek = Math.max(0, Math.floor(todayIdx / 7));
  const [viewWeek, setViewWeek] = useState<number | null>(null); // null = 자동(오늘 주)
  const weekIdx = Math.min(viewWeek ?? todayWeek, weeks.length - 1);
  const doneDays = Math.min(claimable ? streak : todayIdx + 1, maxStreakDays);

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
          {/* 전체 진행도 — 주 마일스톤 눈금 포함 */}
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold text-subtle">{t("daily_week")}</span>
            <span className="text-[11px] font-black tabular-nums text-muted">
              {doneDays}<span className="font-bold text-subtle">/{maxStreakDays}</span>
            </span>
          </div>
          <div className="relative mb-2.5 h-1.5 overflow-hidden rounded-full bg-surface-1">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-400 transition-[width]"
              style={{ width: `${(doneDays / maxStreakDays) * 100}%` }}
            />
            {weeks.length > 1 &&
              weeks.slice(0, -1).map((w, i) => (
                <span
                  key={i}
                  className="absolute top-0 h-full w-px bg-black/40"
                  style={{ left: `${(((i + 1) * 7) / maxStreakDays) * 100}%` }}
                />
              ))}
          </div>

          {/* 주 선택 탭 — 오늘이 속한 주 자동 선택, 다른 주는 보상 미리보기 */}
          {weeks.length > 1 && (
            <div className="mb-2 flex justify-center gap-1">
              {weeks.map((w, i) => {
                const active = i === weekIdx;
                const weekDone = doneDays >= i * 7 + w.length; // 이 주의 마지막 날까지 수령 완료
                return (
                  <button
                    key={i}
                    onClick={() => setViewWeek(i)}
                    className={`rounded-full px-2.5 py-1 text-[10.5px] font-black tabular-nums ring-1 transition-colors ${
                      active ? "bg-primary/25 text-primary-400 ring-primary-400" : "bg-surface-1 text-subtle ring-hairline"
                    }`}
                  >
                    {weekDone ? <Check className="inline h-3 w-3" strokeWidth={3} /> : `${w[0].day}-${w[w.length - 1].day}`}
                  </button>
                );
              })}
            </div>
          )}

          {/* 선택 주 7일 캘린더 — 주 마지막 날(7·14·21·28)은 마일스톤 골드 강조 */}
          <div className="grid grid-cols-7 gap-1">
            {weeks[weekIdx].map(({ day, reward: r }) => {
              const i = day - 1;
              const st = cellState(i);
              const isMax = day === maxStreakDays;
              const isMilestone = day % 7 === 0 || isMax;
              return (
                <div
                  key={day}
                  className={[
                    "relative flex flex-col items-center gap-1 rounded-[10px] py-2",
                    st === "today"
                      ? "bg-primary/25 ring-2 ring-primary-400"
                      : isMilestone
                        ? "bg-gold/10 ring-1 ring-gold/45"
                        : st === "claimed"
                          ? "bg-surface-1 ring-1 ring-hairline"
                          : "bg-surface-1/60 ring-1 ring-hairline",
                  ].join(" ")}
                >
                  <span className={`text-[8px] font-bold ${st === "today" ? "text-primary-400" : isMilestone ? "text-gold" : "text-subtle"}`}>
                    {isMax ? t("daily_max") : `D${day}`}
                  </span>
                  {st === "claimed" ? (
                    <span className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-verified/20 text-verified">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  ) : (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/currency.png"
                        alt=""
                        className={`h-[20px] w-[20px] ${st === "future" ? "opacity-45" : ""} ${isMilestone && st !== "future" ? "drop-shadow-[0_0_5px_rgba(245,196,81,0.7)]" : ""}`}
                      />
                    </>
                  )}
                  <span
                    className={`text-[8.5px] font-black tabular-nums leading-none ${
                      st === "today" ? "text-white" : isMilestone ? "text-gold" : st === "future" ? "text-subtle" : "text-muted"
                    }`}
                  >
                    {r.toLocaleString()}
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
