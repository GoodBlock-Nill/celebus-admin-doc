"use client";

import { resolveAvatar } from "@/lib/game-api";

const SIZES = {
  sm: { box: 32, text: 16 },
  md: { box: 44, text: 22 },
  lg: { box: 72, text: 38 },
} as const;

// 랭킹 프로필 아바타 — 값 형태에 따라 이모지(글리프) 또는 이미지(미래 소셜 프사)로 렌더.
export default function Avatar({ value, size = "sm" }: { value: string | null | undefined; size?: keyof typeof SIZES }) {
  const r = resolveAvatar(value);
  const { box, text } = SIZES[size];

  if (r.kind === "img") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={r.src}
        alt=""
        width={box}
        height={box}
        className="shrink-0 rounded-full object-cover ring-1 ring-hairline"
        style={{ width: box, height: box }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full ring-1 ring-black/10"
      style={{ width: box, height: box, background: r.bg, fontSize: text }}
    >
      {r.glyph}
    </span>
  );
}
