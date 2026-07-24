"use client";

// 경제 관리 — 아이템 카탈로그 가격(서버 권위 소스). CP 지급/회수는 회원 상세에서.
import { useEffect, useState } from "react";
import { aget, asend } from "@/lib/admin-api";
import { BTN_GHOST, Card, INPUT } from "./ui";

type Item = { item_type: string; price: number; sort: number };
const LABEL: Record<string, string> = { bomb: "폭탄", line: "라인", shuffle: "셔플", time: "시간+", heart: "하트(이어하기)" };

export default function AdminEconomy() {
  const [items, setItems] = useState<Item[]>([]);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    aget<Item[]>("/api/admin/catalog").then(setItems).catch(() => {});
  }, []);

  return (
    <Card title="아이템 가격 (CELEB Point)">
      <div className="flex flex-col gap-2">
        {items.map((it, idx) => (
          <div key={it.item_type} className="flex items-center gap-2">
            <span className="w-20 text-[13px] font-bold">{LABEL[it.item_type] ?? it.item_type}</span>
            <input
              value={it.price}
              onChange={(e) => {
                const v = parseInt(e.target.value.replace(/\D/g, ""), 10) || 0;
                setItems((arr) => arr.map((x, i) => (i === idx ? { ...x, price: v } : x)));
              }}
              inputMode="numeric"
              className={`${INPUT} w-28 text-right tabular-nums`}
            />
            <button
              onClick={async () => {
                await asend("/api/admin/catalog", "PUT", { item_type: it.item_type, price: it.price });
                setSaved(it.item_type);
                setTimeout(() => setSaved(null), 1500);
              }}
              className={BTN_GHOST}
            >
              {saved === it.item_type ? "저장됨 ✓" : "저장"}
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-snug text-subtle">CP 수동 지급/회수는 회원 탭 → 상세에서 처리해요 (원장 자동 기록).</p>
    </Card>
  );
}
