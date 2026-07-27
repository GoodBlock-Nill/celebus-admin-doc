"use client";

// 경제 — CP 발행/소진/유통 개요 + 발생원·사용처 분석 + 아이템 가격(서버 권위) 편집.
// CP 수동 지급/회수는 회원 상세에서(원장 자동 기록).
import { useEffect, useState } from "react";
import { aget, asend } from "@/lib/admin-api";
import { BTN_GHOST, Card, Stat } from "./ui";

type Item = { item_type: string; price: number; sort: number };
type Source = { kind: string; total: number; cnt: number };
type Sink = { item: string | null; total: number; cnt: number };
type Economy = {
  circulating: number;
  holders: number;
  minted: number;
  burned: number;
  sources: Source[];
  sinks: Sink[];
  sink_other: number;
};

const ITEM_LABEL: Record<string, string> = { bomb: "폭탄", line: "라인", shuffle: "셔플", time: "시간+", heart: "하트(이어하기)" };
const ITEM_DESC: Record<string, string> = {
  bomb: "주변 3×3 제거",
  line: "가로·세로 줄 제거",
  shuffle: "보드 섞기",
  time: "시간 +10초",
  heart: "일반 매치 이어하기 (+30초)",
};
const SOURCE_LABEL: Record<string, string> = { mission: "미션 보상", daily: "출석 보상", admin: "관리자 지급" };

const won = (n: number) => (n ?? 0).toLocaleString();

export default function AdminEconomy() {
  const [items, setItems] = useState<Item[]>([]);
  const [eco, setEco] = useState<Economy | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    aget<Item[]>("/api/admin/catalog").then(setItems).catch(() => {});
    aget<Economy>("/api/admin/economy").then(setEco).catch(() => {});
  }, []);

  // 아이템별 누적 구매 수(사용처 데이터에서)
  const buyCount = (t: string) => eco?.sinks.find((s) => s.item === t)?.cnt ?? 0;
  const net = (eco?.minted ?? 0) - (eco?.burned ?? 0);

  return (
    <div className="flex flex-col gap-4">
      {/* CP 개요 */}
      <Card title="CP 경제 개요">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label={`유통 CP (보유자 ${eco?.holders ?? 0}명)`} value={eco ? won(eco.circulating) : "…"} />
          <Stat label="누적 발행" value={eco ? won(eco.minted) : "…"} />
          <Stat label="누적 소진" value={eco ? won(eco.burned) : "…"} />
          <Stat label="순 발행 (발행−소진)" value={eco ? won(net) : "…"} />
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
          순 발행이 계속 커지면 CP 인플레이션이에요. 발생원(미션·출석 보상)을 낮추거나 사용처(아이템 가격)를 조정해 균형을 맞춰요.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 발생원 */}
        <Card title="CP 발생원 (어디서 생기나)">
          <div className="flex flex-col gap-1.5">
            {(eco?.sources ?? []).map((s) => (
              <div key={s.kind} className="flex items-center justify-between rounded-[10px] bg-surface-2 px-3.5 py-2.5">
                <span className="text-[13.5px] font-bold">{SOURCE_LABEL[s.kind] ?? s.kind}</span>
                <span className="text-[13px] tabular-nums">
                  <b className="text-verified">+{won(s.total)}</b> <span className="text-subtle">· {won(s.cnt)}건</span>
                </span>
              </div>
            ))}
            {eco && eco.sources.length === 0 && <p className="text-[13px] text-subtle">기록 없음</p>}
          </div>
        </Card>

        {/* 사용처 */}
        <Card title="CP 사용처 (어디로 나가나)">
          <div className="flex flex-col gap-1.5">
            {(eco?.sinks ?? []).map((s) => (
              <div key={s.item ?? "etc"} className="flex items-center justify-between rounded-[10px] bg-surface-2 px-3.5 py-2.5">
                <span className="text-[13.5px] font-bold">아이템 구매 · {ITEM_LABEL[s.item ?? ""] ?? s.item ?? "기타"}</span>
                <span className="text-[13px] tabular-nums">
                  <b className="text-danger">−{won(s.total)}</b> <span className="text-subtle">· {won(s.cnt)}건</span>
                </span>
              </div>
            ))}
            {eco && eco.sink_other > 0 && (
              <div className="flex items-center justify-between rounded-[10px] bg-surface-2 px-3.5 py-2.5">
                <span className="text-[13.5px] font-bold">관리자 회수 등</span>
                <span className="text-[13px] tabular-nums text-danger">−{won(eco.sink_other)}</span>
              </div>
            )}
            {eco && eco.sinks.length === 0 && eco.sink_other === 0 && <p className="text-[13px] text-subtle">기록 없음</p>}
          </div>
        </Card>
      </div>

      {/* 아이템 가격 */}
      <Card title="아이템 가격 (CELEB Point)">
        <div className="flex flex-col gap-2">
          {items.map((it, idx) => (
            <div key={it.item_type} className="flex items-center gap-3 rounded-[10px] bg-surface-2 px-3.5 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold">{ITEM_LABEL[it.item_type] ?? it.item_type}</div>
                <div className="text-[12px] text-subtle">
                  {ITEM_DESC[it.item_type] ?? ""} · 누적 구매 {won(buyCount(it.item_type))}건
                </div>
              </div>
              <span className="text-[12px] text-subtle">가격</span>
              <input
                value={it.price}
                onChange={(e) => {
                  const v = parseInt(e.target.value.replace(/\D/g, ""), 10) || 0;
                  setItems((arr) => arr.map((x, i) => (i === idx ? { ...x, price: v } : x)));
                }}
                inputMode="numeric"
                className="w-28 rounded-[10px] bg-surface-1 px-3 py-2 text-right text-[14px] font-bold tabular-nums text-fg ring-1 ring-hairline focus:outline-none focus:ring-2 focus:ring-primary/60"
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
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
          CP 수동 지급·회수는 <b className="text-fg">회원</b> 탭 → 상세에서 처리해요(원장 자동 기록).
        </p>
      </Card>
    </div>
  );
}
