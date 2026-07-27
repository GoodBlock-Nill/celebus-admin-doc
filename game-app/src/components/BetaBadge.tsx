"use client";

// 베타 뱃지 — 로고 우상단에 살짝 기울여 부착(스티커 느낌). home.beta=false면 미노출.
import { GAME_CONFIG } from "@/lib/game-config";

export default function BetaBadge({ className = "" }: { className?: string }) {
  if (!GAME_CONFIG.home.beta) return null;
  return (
    <span
      className={`pointer-events-none select-none rounded-full bg-gold px-2 py-0.5 text-[10px] font-black tracking-wider text-black shadow-[0_2px_8px_rgba(0,0,0,0.45)] ring-1 ring-white/60 ${className}`}
      style={{ transform: "rotate(8deg)" }}
    >
      BETA
    </span>
  );
}
