"use client";

import { Coins } from "lucide-react";

// CELEB Point 잔액 칩
export default function CoinBalance({ amount }: { amount: number | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 px-3 py-1.5 text-[13px] font-black text-gold ring-1 ring-hairline">
      <Coins className="h-4 w-4" />
      {(amount ?? 0).toLocaleString()}
    </span>
  );
}
