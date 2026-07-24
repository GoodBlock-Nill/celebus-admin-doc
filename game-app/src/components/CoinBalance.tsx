"use client";

// CELEB Point 잔액 칩 — 브랜드 코인 아이콘(currency.png) + 숫자
export default function CoinBalance({ amount }: { amount: number | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 py-1 pl-1 pr-3 text-[13px] font-black text-fg ring-1 ring-hairline">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/currency.png" alt="CELEB Point" className="h-6 w-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
      <span className="tabular-nums">{(amount ?? 0).toLocaleString()}</span>
    </span>
  );
}
