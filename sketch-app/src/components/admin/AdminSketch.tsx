"use client";

// CELEB 스케치 검수 큐 (관리자) — AI 보류·신고 비공개·판정 전 + 자동 반려 감사(P0).
// 스트로크 리플레이로 "그려진 과정"까지 확인 가능 (기획 §6 — 검수 증거 = 스트로크 로그).
// 상단 지표(P1): 최근 7일 판정 분포 + AI 미탐(승인 후 신고 비공개) — 프롬프트 개선 신호.
import { useEffect, useState } from "react";
import { aget, asend } from "@/lib/admin-api";
import type { SketchStroke } from "@/lib/sketch";
import SketchReplay from "../sketch/SketchReplay";
import { BTN, BTN_DANGER, Card } from "./ui";

type QueueItem = {
  id: string;
  status: "held" | "hidden" | "pending" | "rejected";
  word: string;
  strokes: SketchStroke[];
  duration_ms: number;
  ai_verdict: { action?: string; reason?: string; eraser_ratio?: number } | null;
  report_count: number;
  thumb_url: string | null;
  created_at: string;
  player_hash_short: string;
};
type Metrics = { week_total: number; approve: number; hold: number; reject: number; ai_missed: number };

const STATUS_LABEL: Record<QueueItem["status"], { label: string; cls: string }> = {
  held: { label: "AI 보류", cls: "bg-gold/15 text-gold" },
  hidden: { label: "신고 비공개", cls: "bg-danger/15 text-danger" },
  pending: { label: "판정 전", cls: "bg-surface-1 text-muted" },
  rejected: { label: "자동 반려", cls: "bg-danger/15 text-danger" },
};

const fmtDate = (s: string) => {
  const d = new Date(s);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const pct = (n: number, total: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : "-");

function Row({ it, openId, setOpenId, act, busy }: { it: QueueItem; openId: string | null; setOpenId: (v: string | null) => void; act: (id: string, a: "approve" | "reject") => void; busy: boolean }) {
  const st = STATUS_LABEL[it.status];
  return (
    <div className="rounded-[12px] bg-surface-2 p-3 ring-1 ring-hairline">
      <div className="flex flex-wrap items-center gap-2">
        {it.thumb_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={it.thumb_url} alt="" className="h-10 w-10 shrink-0 rounded-[8px] object-cover ring-1 ring-hairline" />
        ) : null}
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
        <span className="text-[13.5px] font-black text-fg">제시어 {it.word}</span>
        {it.report_count > 0 && <span className="text-[11.5px] font-bold text-danger">신고 {it.report_count}건</span>}
        <span className="min-w-0 flex-1 truncate text-[11.5px] text-subtle">
          {fmtDate(it.created_at)} · 작성자 {it.player_hash_short}
        </span>
        <button onClick={() => setOpenId(openId === it.id ? null : it.id)} className="shrink-0 rounded-full bg-surface-1 px-3 py-1.5 text-[12px] font-bold text-muted ring-1 ring-hairline">
          {openId === it.id ? "접기" : "리플레이"}
        </button>
        <button onClick={() => act(it.id, "approve")} disabled={busy} className={BTN}>
          {it.status === "rejected" || it.status === "hidden" ? "복구 승인" : "승인"}
        </button>
        {it.status !== "rejected" && (
          <button onClick={() => act(it.id, "reject")} disabled={busy} className={BTN_DANGER}>
            반려
          </button>
        )}
      </div>
      {it.ai_verdict?.reason && <p className="mt-1.5 text-[12px] text-muted break-keep">AI: {it.ai_verdict.reason}</p>}
      {openId === it.id && (
        <div className="mx-auto mt-2 max-w-[320px]">
          <SketchReplay strokes={it.strokes} />
        </div>
      )}
    </div>
  );
}

export default function AdminSketch() {
  const [items, setItems] = useState<QueueItem[] | null>(null);
  const [rejected, setRejected] = useState<QueueItem[]>([]);
  const [approvedTotal, setApprovedTotal] = useState(0);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [showRejected, setShowRejected] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    aget<{ items: QueueItem[]; rejected: QueueItem[]; approved_total: number; metrics: Metrics }>("/api/admin/sketch")
      .then((d) => {
        setItems(d.items ?? []);
        setRejected(d.rejected ?? []);
        setApprovedTotal(d.approved_total ?? 0);
        setMetrics(d.metrics ?? null);
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
    <div className="flex flex-col gap-4">
      {/* 판정 품질 지표 — AI 미탐이 늘면 판정 기준(프롬프트) 개선 신호 */}
      {metrics && (
        <Card title="AI 판정 (최근 7일)">
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] text-muted">
            <span>판정 <b className="tabular-nums text-fg">{metrics.week_total}</b>건</span>
            <span>즉시 공개 <b className="tabular-nums text-fg">{pct(metrics.approve, metrics.week_total)}</b></span>
            <span>보류 <b className="tabular-nums text-gold">{pct(metrics.hold, metrics.week_total)}</b></span>
            <span>자동 반려 <b className="tabular-nums text-danger">{pct(metrics.reject, metrics.week_total)}</b></span>
            <span>
              AI 미탐(승인 후 신고 비공개) <b className={`tabular-nums ${metrics.ai_missed > 0 ? "text-danger" : "text-fg"}`}>{metrics.ai_missed}</b>건
            </span>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-subtle break-keep">
            보류율이 계속 20%를 넘거나 미탐이 발생하면 판정 기준 조정이 필요해요. 공개 그림 {approvedTotal.toLocaleString()}장.
          </p>
        </Card>
      )}

      <Card title="스케치 검수 큐">
        <p className="mb-3 text-[12.5px] leading-relaxed text-muted break-keep">
          AI가 승인한 그림은 여기 오지 않아요. <b className="text-fg">AI 보류</b>·<b className="text-fg">신고 비공개</b>만 확인하면 돼요.
        </p>
        {items == null ? (
          <div className="h-24 animate-pulse rounded-[12px] bg-surface-2" />
        ) : items.length === 0 ? (
          <p className="rounded-[12px] bg-surface-2 px-4 py-6 text-center text-[13px] text-muted">처리할 그림이 없어요 🎉</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((it) => (
              <Row key={it.id} it={it} openId={openId} setOpenId={setOpenId} act={(i, a) => void act(i, a)} busy={busy} />
            ))}
          </div>
        )}
      </Card>

      {/* P0: 자동 반려 감사 — AI 단독 반려는 사람이 뒤집을 수 있어야 한다 */}
      <Card title={`자동 반려 감사 (${rejected.length})`}>
        <button onClick={() => setShowRejected((v) => !v)} className="mb-2 rounded-full bg-surface-1 px-3.5 py-1.5 text-[12.5px] font-bold text-muted ring-1 ring-hairline">
          {showRejected ? "접기" : "펼치기"}
        </button>
        {showRejected &&
          (rejected.length === 0 ? (
            <p className="rounded-[12px] bg-surface-2 px-4 py-4 text-center text-[13px] text-muted">자동 반려된 그림이 없어요.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {rejected.map((it) => (
                <Row key={it.id} it={it} openId={openId} setOpenId={setOpenId} act={(i, a) => void act(i, a)} busy={busy} />
              ))}
            </div>
          ))}
      </Card>
    </div>
  );
}
