"use client";

// 콘테스트 CRUD + 상태 전환 (관리자 UI는 운영자 전용 — 한국어 고정)
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { ContestRow } from "@/lib/admin-types";
import { adminFetch } from "@/lib/admin-types";
import { STATUS_LABELS } from "@/lib/contest-status";
import type { ContestStatus } from "@/lib/types";

const NEXT_ACTIONS: Record<ContestStatus, { to: ContestStatus; label: string }[]> = {
  draft: [{ to: "open", label: "게시 (접수 시작)" }],
  open: [
    { to: "voting", label: "접수 마감 (투표만)" },
    { to: "judging", label: "접수+투표 동시 마감" },
    { to: "draft", label: "게시 취소" },
  ],
  voting: [{ to: "judging", label: "투표 마감 (심사)" }],
  judging: [{ to: "announced", label: "수상 발표" }],
  announced: [{ to: "closed", label: "아카이브" }],
  closed: [],
};

const input = "w-full rounded-lg border border-border bg-bg px-2.5 py-2 text-[13px] outline-none focus:border-primary/60";
const lbl = "mb-1 block text-[11px] font-bold text-muted";

function toLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toIso(local: string): string | null {
  return local ? new Date(local).toISOString() : null;
}

function ContestForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: ContestRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState({
    slug: initial?.slug ?? "",
    artist: initial?.artist ?? "V01D",
    contest_type: initial?.contest_type ?? "video",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    rules: initial?.rules ?? "",
    prize_summary: initial?.prize_summary ?? "",
    prizes: JSON.stringify(initial?.prizes ?? [], null, 2),
    cover_image_url: initial?.cover_image_url ?? "",
    submit_start_at: toLocal(initial?.submit_start_at ?? null),
    submit_end_at: toLocal(initial?.submit_end_at ?? null),
    vote_end_at: toLocal(initial?.vote_end_at ?? null),
    announce_at: toLocal(initial?.announce_at ?? null),
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    if (busy) return;
    let prizes: unknown;
    try {
      prizes = JSON.parse(f.prizes || "[]");
    } catch {
      return toast.error("보상 JSON 형식이 올바르지 않아요.");
    }
    setBusy(true);
    try {
      const body = JSON.stringify({
        slug: f.slug,
        artist: f.artist,
        contest_type: f.contest_type,
        title: f.title,
        description: f.description,
        rules: f.rules,
        prize_summary: f.prize_summary,
        prizes,
        cover_image_url: f.cover_image_url || null,
        submit_start_at: toIso(f.submit_start_at),
        submit_end_at: toIso(f.submit_end_at),
        vote_end_at: toIso(f.vote_end_at),
        announce_at: toIso(f.announce_at),
      });
      const res = initial
        ? await adminFetch(`/api/admin/contests/${initial.id}`, { method: "PATCH", body })
        : await adminFetch("/api/admin/contests", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      toast.success(initial ? "수정 완료" : "생성 완료 (draft)");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-primary/40 bg-card p-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={lbl}>slug (URL)</label>
          <input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} className={input} placeholder="v01d-cover-2026" />
        </div>
        <div>
          <label className={lbl}>아티스트</label>
          <input value={f.artist} onChange={(e) => setF({ ...f, artist: e.target.value })} className={input} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={lbl}>유형</label>
          <select
            value={f.contest_type}
            onChange={(e) => setF({ ...f, contest_type: e.target.value as "image" | "video" })}
            className={input}
          >
            <option value="video">영상 (YouTube·TikTok·릴스)</option>
            <option value="image">이미지 (X·Instagram·Threads)</option>
          </select>
        </div>
        <div>
          <label className={lbl}>커버 이미지 URL (선택)</label>
          <input value={f.cover_image_url} onChange={(e) => setF({ ...f, cover_image_url: e.target.value })} className={input} />
        </div>
      </div>
      <div>
        <label className={lbl}>제목</label>
        <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={input} />
      </div>
      <div>
        <label className={lbl}>소개</label>
        <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} className={input} />
      </div>
      <div>
        <label className={lbl}>참가 규정</label>
        <textarea value={f.rules} onChange={(e) => setF({ ...f, rules: e.target.value })} rows={3} className={input} />
      </div>
      <div>
        <label className={lbl}>보상 요약 (히어로 한 줄)</label>
        <input value={f.prize_summary} onChange={(e) => setF({ ...f, prize_summary: e.target.value })} className={input} placeholder="1위 V01D 전원 싸인 앨범" />
      </div>
      <div>
        <label className={lbl}>
          보상 목록 JSON — [{"{"}rank_label, name, image_url?, award_type: popular|judge, count{"}"}]
        </label>
        <textarea
          value={f.prizes}
          onChange={(e) => setF({ ...f, prizes: e.target.value })}
          rows={5}
          className={`${input} font-mono text-[12px]`}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ["submit_start_at", "접수 시작"],
            ["submit_end_at", "접수 마감"],
            ["vote_end_at", "투표 마감"],
            ["announce_at", "발표 예정"],
          ] as const
        ).map(([k, label]) => (
          <div key={k}>
            <label className={lbl}>{label}</label>
            <input
              type="datetime-local"
              value={f[k]}
              onChange={(e) => setF({ ...f, [k]: e.target.value })}
              className={input}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="rounded-full border border-border px-4 py-2 text-[13px] font-bold text-muted">
          취소
        </button>
        <button onClick={save} disabled={busy || !f.slug || !f.title} className="flex-1 rounded-full bg-primary py-2 text-[13px] font-black text-white disabled:opacity-40">
          {initial ? "수정 저장" : "생성 (draft)"}
        </button>
      </div>
    </div>
  );
}

export default function ContestsPanel() {
  const [contests, setContests] = useState<ContestRow[]>([]);
  const [editing, setEditing] = useState<ContestRow | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    const res = await adminFetch("/api/admin/contests");
    const data = await res.json();
    setContests(data.contests ?? []);
  }
  useEffect(() => {
    void load();
  }, []);

  async function transition(c: ContestRow, to: ContestStatus, label: string) {
    if (!confirm(`'${c.title}'\n${STATUS_LABELS[c.status]} → ${STATUS_LABELS[to]} (${label})\n진행할까요?`)) return;
    const res = await adminFetch(`/api/admin/contests/${c.id}`, { method: "PATCH", body: JSON.stringify({ status: to }) });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "전환 실패");
    toast.success(`${STATUS_LABELS[to]} 전환 완료`);
    void load();
  }

  async function purgePii(c: ContestRow) {
    if (!confirm(`'${c.title}' 출품자 전화번호를 전부 파기할까요? 되돌릴 수 없어요.`)) return;
    const res = await adminFetch(`/api/admin/contests/${c.id}/purge-pii`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "파기 실패");
    toast.success(`전화번호 ${data.count}건 파기 완료`);
  }

  async function remove(c: ContestRow) {
    if (!confirm(`'${c.title}' 콘테스트를 삭제할까요? (draft만 가능)`)) return;
    const res = await adminFetch(`/api/admin/contests/${c.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "삭제 실패");
    toast.success("삭제 완료");
    void load();
  }

  return (
    <div className="space-y-3">
      {!creating && !editing && (
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-black text-white"
        >
          <Plus className="h-4 w-4" /> 새 콘테스트
        </button>
      )}
      {(creating || editing) && (
        <ContestForm
          initial={editing}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            void load();
          }}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {contests.map((c) => (
        <div key={c.id} className="rounded-2xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold">{STATUS_LABELS[c.status]}</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary-400">
              {c.contest_type === "video" ? "영상" : "이미지"}
            </span>
            <span className="truncate text-[14px] font-bold">{c.title}</span>
            <span className="ml-auto flex shrink-0 gap-1">
              <button onClick={() => setEditing(c)} aria-label="수정" className="rounded p-1.5 text-muted hover:text-fg">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {c.status === "draft" && (
                <button onClick={() => remove(c)} aria-label="삭제" className="rounded p-1.5 text-muted hover:text-danger">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          </div>
          <p className="mb-2 text-[11px] text-muted">
            /{c.slug} · 접수마감 {c.submit_end_at ? new Date(c.submit_end_at).toLocaleString("ko") : "-"} · 투표마감{" "}
            {c.vote_end_at ? new Date(c.vote_end_at).toLocaleString("ko") : "-"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {NEXT_ACTIONS[c.status].map((a) => {
              const isRollback = a.to === "draft"; // 역방향(게시 취소) — 파괴적 신호
              return (
                <button
                  key={a.to}
                  onClick={() => transition(c, a.to, a.label)}
                  className={`rounded-full border px-3 py-1 text-[12px] font-bold ${
                    isRollback
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                      : "border-primary/40 bg-primary/10 text-primary-400 hover:bg-primary/20"
                  }`}
                >
                  {isRollback ? "↩ " : ""}
                  {a.label}
                  {isRollback ? "" : " →"}
                </button>
              );
            })}
            {c.status === "closed" && (
              <button
                onClick={() => purgePii(c)}
                className="rounded-full border border-danger/40 px-3 py-1 text-[12px] font-bold text-danger hover:bg-danger/10"
              >
                출품자 전화번호 파기
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
