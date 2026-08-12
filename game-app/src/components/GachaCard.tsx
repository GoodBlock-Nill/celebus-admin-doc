"use client";

// 럭키드로우 카드 1장 — 뒷면(로고+홀로 시머) ↔ 앞면 CSS 3D 플립.
// 앞면은 관리자가 업로드한 카드 이미지로 전체를 채우고(없으면 보상 아트 폴백),
// 카드 안에는 텍스트를 두지 않으며 보상명은 카드 하단(밖)에 표기 (사용자 결정 2026-08-12).
// 등급(S~D)은 내부 분류로만 쓰고 유저에게 글자로 노출하지 않는다 — 색 연출(글로우·컨페티)로만 희소성 표현.
import { Gift } from "lucide-react";
import type { GachaDrawCard, GachaGrade } from "@/lib/game-api";
import { useLang } from "./LangProvider";

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

// 재화 보상 폴백 아트 — 관리자 카드 이미지가 없을 때 중앙에 표시
const ITEM_ART: Record<string, string> = {
  heart: "/items/heart.png",
  bomb: "/items/item-bomb.png",
  line: "/items/item-line.png",
  shuffle: "/items/item-shuffle.png",
  time: "/items/item-time.png",
};

function rewardArt(card: GachaDrawCard): string | null {
  if (card.reward?.cp) return "/currency.png";
  if (card.reward?.item) return ITEM_ART[card.reward.item] ?? null;
  return null;
}

export default function GachaCard({
  card,
  flipped,
  glowing,
  size,
  onTap,
}: {
  card: GachaDrawCard | null; // null = 뒷면 전용 (대기 연출)
  flipped: boolean;
  glowing?: boolean; // 플립 직전 긴장 연출 — 등급 색 글로우
  size: "lg" | "sm";
  onTap?: () => void;
}) {
  const { t, lang } = useLang();
  const dim = size === "lg" ? "h-[220px] w-[156px]" : "h-[104px] w-[74px]";
  const color = card ? GRADE_COLORS[card.grade] : "#8b5cf6";
  const prizeName = card ? card.prize[lang] || card.prize.ko || "" : "";
  // 카드 하단 보상 라벨 — 재화는 수량 표기(+100 CP), 실물은 상품명
  const label = card ? (card.reward ? rewardLabel(card, t) : prizeName) : "";
  const art = card ? rewardArt(card) : null;

  return (
    <div className={`flex shrink-0 flex-col items-center ${size === "lg" ? "gap-2" : "gap-1"}`}>
      <button
        type="button"
        onClick={onTap}
        disabled={!onTap}
        aria-label={flipped && card ? `${prizeName || label}` : undefined}
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

          {/* 앞면 — 관리자 업로드 카드 이미지(전체 채움) > 보상 아트 폴백. 텍스트 없음 */}
          <div
            className="gacha-face gacha-front absolute inset-0 overflow-hidden rounded-[14px]"
            style={{
              background: `radial-gradient(120% 90% at 50% 0%, ${color}30 0%, transparent 55%), linear-gradient(180deg, ${color}14 0%, var(--color-surface-2) 70%)`,
              boxShadow: flipped ? `0 0 ${size === "lg" ? 26 : 12}px ${color}66, inset 0 0 0 2px ${color}` : undefined,
            }}
          >
            {card &&
              (card.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  {art ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={art}
                      alt=""
                      className={`${size === "lg" ? "h-24 w-24" : "h-10 w-10"} object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]`}
                    />
                  ) : (
                    <Gift className={size === "lg" ? "h-16 w-16" : "h-7 w-7"} style={{ color }} strokeWidth={1.5} />
                  )}
                </div>
              ))}
          </div>
        </div>
      </button>

      {/* 보상 라벨 — 카드 하단, 플립 후 표시 */}
      <span
        className={`text-center font-black leading-tight break-keep transition-opacity duration-300 ${flipped && card ? "opacity-100" : "opacity-0"} ${
          size === "lg" ? "max-w-[170px] text-[14px] text-gold" : "w-[74px] text-[9px] text-fg"
        }`}
      >
        {flipped && card ? label : " "}
      </span>
    </div>
  );
}
