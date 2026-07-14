"use client";

// 플랫폼 브랜드 컬러 원형 글리프 — 단색(currentColor) 탈피.
// 검정 로고(X·TikTok)는 hairline 링으로 다크 배경 대비 확보.
import type { Platform } from "@/lib/types";
import { PlatformIcon } from "./PlatformBadge";

const BRAND: Record<Platform, { bg: string; fg: string; ring?: boolean }> = {
  youtube: { bg: "#ff0033", fg: "#ffffff" },
  tiktok: { bg: "#000000", fg: "#ffffff", ring: true },
  x: { bg: "#000000", fg: "#ffffff", ring: true },
  instagram: { bg: "#e1306c", fg: "#ffffff" },
  threads: { bg: "#000000", fg: "#ffffff", ring: true },
};

export default function PlatformGlyph({
  platform,
  size = 22,
}: {
  platform: Platform;
  size?: number;
}) {
  const b = BRAND[platform];
  const icon = Math.round(size * 0.56);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: b.bg,
        color: b.fg,
        boxShadow: b.ring ? "inset 0 0 0 1px rgba(255,255,255,0.22)" : undefined,
      }}
    >
      <span style={{ width: icon, height: icon }} className="flex items-center justify-center">
        <PlatformIcon platform={platform} className="h-full w-full" />
      </span>
    </span>
  );
}
