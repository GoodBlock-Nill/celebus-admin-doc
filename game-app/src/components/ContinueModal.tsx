"use client";

// 이어하기 모달 (일반 매치 전용) — 시간 종료 시 하트 1개로 +N초 계속.
// 백드롭을 진하게 깔아 대기 중 보드 정찰(다음 수 탐색)을 차단 — 랭킹 공정성.
import { useRef } from "react";
import { GAME_CONFIG } from "@/lib/game-config";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { useLang } from "./LangProvider";

export default function ContinueModal({
  hearts,
  onContinue,
  onGiveUp,
}: {
  hearts: number;
  onContinue: () => void;
  onGiveUp: () => void;
}) {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true);
  return (
    <div className="anim-backdrop-in fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t("continue_title")}
        tabIndex={-1}
        className="anim-pop-in w-full max-w-xs rounded-[22px] bg-surface-2 p-6 text-center outline-none ring-1 ring-hairline"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/items/heart.png" alt="" className="anim-logo-float mx-auto h-24 w-24" />
        <div className="mt-2 text-[18px] font-black">{t("continue_title")}</div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted break-keep">
          {t("continue_body").replace("{n}", String(GAME_CONFIG.hearts.continueSec))}
        </p>

        {/* 남은 하트 표시 (나열은 최대 6개, 정확한 수량은 ×N) */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {Array.from({ length: Math.min(hearts, 6) }).map((_, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src="/items/heart.png" alt="" className="h-7 w-7" />
          ))}
          <span className="ml-1 text-[12px] font-bold text-subtle">×{hearts}</span>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={onContinue}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-[15px] font-black text-white active:scale-[0.99]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/items/heart.png" alt="" className="h-5 w-5" /> {t("continue_cta")} (+{GAME_CONFIG.hearts.continueSec}s)
          </button>
          <button
            onClick={onGiveUp}
            className="w-full rounded-full bg-surface-1 py-3 text-[14px] font-bold text-muted ring-1 ring-hairline active:scale-[0.99]"
          >
            {t("continue_giveup")}
          </button>
        </div>
      </div>
    </div>
  );
}
