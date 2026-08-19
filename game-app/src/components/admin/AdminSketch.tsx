"use client";

// CELEB 스케치 검수 큐 (관리자) — AI가 보류(held)한 그림 + 신고 임계로 비공개(hidden)된 그림만 흐른다.
// 스트로크 리플레이로 "그려진 과정"까지 확인 가능 (기획 §6 — 검수 증거 = 스트로크 로그).
import { useEffect, useState } from "react";
import { aget, asend } from "@/lib/admin-api";
import type { SketchStroke } from "@/lib/sketch";
import SketchReplay from "../sketch/SketchReplay";
import { BTN, BTN_DANGER, Card } from "./ui";

type QueueItem = {
  id: string;
  status: "held" | "hidden" | "pending";
  word: string;
  strokes: SketchStroke[];
  duration_ms: number;
  ai_verdict: { action?: string; reason?: string } | null;
  report_count: number;
  created_at: string;
  player_hash_short: string;
};

const STATUS_LABEL: Record<QueueItem["status"], { label: string; cls: string }> = {
  held: { label: "AI 보류", cls: "bg-gold/15 text-gold" },
  hidden: { label: "신고 비공개", cls: "bg-danger/15 text-danger" },
  pending: { label: "판정 전", cls: "bg-surface-1 text-muted" },
};

const fmtDate = (s: string) => {
  const d = new Date(s);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function AdminSketch() {
  const [items, setItems] = useState<QueueItem[] | null>(null);
  const [approvedTotal, setApprovedTotal] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null); // 리플레이 펼침
  const [busy, setBusy] = useState(false);

  const load = () =>
    aget<{ items: QueueItem[]; approved_total: number }>("/api/admin/sketch")
      .then((d) => {
        setItems(d.items ?? []);
        setApprovedTotal(d.approved_total ?? 0);
      })
      .catch(() => setItems([]));
  useEffect(() => {
    void load();
  }, []);

  const act = async (id: string, action: "approve" | "reject") => {
    if (busy) return;
    setBusy(true);
    try {
      await asend("/api/admin/sketch", "POST", { id, action });
      await load();
    } catch {
      /* 실패 시 목록 유지 */
    }
    setBusy(false);
  };

  return (
    <Card title="스케치 검수 큐">
      <p className="mb-3 text-[12.5px] leading-relaxed text-muted break-keep">
        AI 1차 검수가 승인한 그림은 여기 오지 않아요. <b className="text-fg">AI 보류</b>(글자 의심·애매한 그림)와{" "}
        <b className="text-fg">신고 비공개</b>(임계 도달 자동 조치)만 확인하면 돼요. 공개 그림 {approvedTotal.toLocaleString()}장.
      </p>

      {items == null ? (
        <div className="h-24 animate-pulse rounded-[12px] bg-surface-2" />
      ) : items.length === 0 ? (
        <p className="rounded-[12px] bg-surface-2 px-4 py-6 text-center text-[13px] text-muted">처리할 그림이 없어요 🎉</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((it) => {
            const st = STATUS_LABEL[it.status];
            return (
              <div key={it.id} className="rounded-[12px] bg-surface-2 p-3 ring-1 ring-hairline">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                  <span className="text-[13.5px] font-black text-fg">제시어 {it.word}</span>
                  {it.report_count > 0 && <span className="text-[11.5px] font-bold text-danger">신고 {it.report_count}건</span>}
                  <span className="min-w-0 flex-1 truncate text-[11.5px] text-subtle">
                    {fmtDate(it.created_at)} · 작성자 {it.player_hash_short}
                  </span>
                  <button onClick={() => setOpenId((v) => (v === it.id ? null : it.id))} className="shrink-0 rounded-full bg-surface-1 px-3 py-1.5 text-[12px] font-bold text-muted ring-1 ring-hairline">
                    {openId === it.id ? "접기" : "리플레이"}
                  </button>
                  <button onClick={() => void act(it.id, "approve")} disabled={busy} className={BTN}>
                    승인
                  </button>
                  <button onClick={() => void act(it.id, "reject")} disabled={busy} className={BTN_DANGER}>
                    반려
                  </button>
                </div>
                {it.ai_verdict?.reason && (
                  <p className="mt-1.5 text-[12px] text-muted break-keep">AI: {it.ai_verdict.reason}</p>
                )}
                {openId === it.id && (
                  <div className="mx-auto mt-2 max-w-[320px]">
                    <SketchReplay strokes={it.strokes} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
