"use client";

// 가챠 카드 1장 — 뒷면(로고+홀로 시머) ↔ 앞면(등급 글로우+상품) CSS 3D 플립.
// 연출 정책: docs/weekly-rank-prize-reward-plan.md §5-2 (수집·도감 요소 없음 — 뽑기 연출 수단으로만 사용)
import type { GachaDrawCard, GachaGrade } from "@/lib/game-api";

export const GRADE_COLORS: Record<GachaGrade, string> = {
  S: "#f5c451", // 골드
  A: "#a78bfa", // 퍼플
  B: "#60a5fa", // 블루
  C: "#c7c7d0",
  D: "#9a9aa6",
};

export function rewardLabel(card: GachaDrawCard, t: (k: string) => string): string {
  const r = card.reward;
  if (r?.cp) return `+${r.cp.toLocaleString()} CP`;
  if (r?.item) return `${t(`item_${r.item}`)} ×${r.qty ?? 1}`;
  return "";
}

export default function GachaCard({
  card,
  flipped,
  glowing,
  size,
  lang,
  onTap,
}: {
  card: GachaDrawCard | null; // null = 뒷면 전용 (대기 연출)
  flipped: boolean;
  glowing?: boolean; // 플립 직전 긴장 연출 — 등급 색 글로우
  size: "lg" | "sm";
  lang: "ko" | "en" | "ja";
  onTap?: () => void;
}) {
  const dim = size === "lg" ? "h-[220px] w-[156px]" : "h-[104px] w-[74px]";
  const color = card ? GRADE_COLORS[card.grade] : "#8b5cf6";
  const prizeName = card ? card.prize[lang] || card.prize.ko || "" : "";

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={!onTap}
      aria-label={flipped && card ? `${card.grade} — ${prizeName}` : undefined}
      className={`gacha-card relative shrink-0 ${dim} ${flipped ? "flipped" : ""} ${onTap ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="gacha-card-inner relative h-full w-full">
        {/* 뒷면 — 보라 그라데이션 + 로고 + 홀로 시머 */}
        <div
          className={`gacha-face absolute inset-0 overflow-hidden rounded-[14px] ring-1 ring-white/20 ${glowing ? "gacha-glow" : ""}`}
          style={{ background: "linear-gradient(160deg, #2a2140 0%, #4a2f8f 55%, #241b38 100%)", "--glow": color } as React.CSSProperties}
        >
          <div className="flex h-full w-full flex-col items-center justify-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/celeb-title.png" alt="" className={`${size === "lg" ? "w-[70%]" : "w-[80%]"} object-contain opacity-90`} />
            <span className={`font-black tracking-widest text-white/35 ${size === "lg" ? "text-[11px]" : "text-[7px]"}`}>V01D POP</span>
          </div>
          <div className="gacha-holo pointer-events-none absolute inset-0" />
        </div>

        {/* 앞면 — 등급 색 테두리 + 상품명 + 보상 */}
        <div
          className="gacha-face gacha-front absolute inset-0 overflow-hidden rounded-[14px] bg-surface-2"
          style={{ boxShadow: flipped ? `0 0 ${size === "lg" ? 26 : 12}px ${color}66, inset 0 0 0 2px ${color}` : undefined }}
        >
          {card && (
            <div className={`flex h-full w-full flex-col items-center justify-center ${size === "lg" ? "gap-2 p-3" : "gap-0.5 p-1"}`}>
              <span
                className={`font-black ${size === "lg" ? "text-[34px]" : "text-[16px]"}`}
                style={{ color, textShadow: `0 0 14px ${color}88` }}
              >
                {card.grade}
              </span>
              {card.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.image_url} alt="" className={`${size === "lg" ? "h-16 w-16" : "h-7 w-7"} rounded-[8px] object-cover`} />
              ) : null}
              <span className={`text-center font-black leading-tight text-fg break-keep ${size === "lg" ? "text-[14px]" : "text-[8.5px]"}`}>
                {prizeName}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
