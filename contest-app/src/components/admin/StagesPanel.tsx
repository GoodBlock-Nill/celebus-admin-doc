"use client";

// 관리자: 스테이지(공연 컨테이너) 관리 — 생성·수정·상태 전환. 유저 업로드는 open 스테이지에만 가능.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { adminFetch } from "@/lib/admin-types";

type StageRow = {
  id: string;
  title: string;
  description: string;
  cover_url: string | null;
  event_date: string | null;
  status: "open" | "archived";
  hidden: boolean;
  post_count: number;
  created_at: string;
};

const EMPTY = { title: "", description: "", event_date: "", cover_url: "" };

export default function StagesPanel() {
  const [stages, setStages] = useState<StageRow[]>([]);
  const [editing, setEditing] = useState<StageRow | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await adminFetch("/api/admin/stages");
    const j = await res.json();
    setStages(j.stages ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  function openEdit(s: StageRow | "new") {
    setEditing(s);
    setForm(s === "new" ? EMPTY : { title: s.title, description: s.description, event_date: s.event_date ?? "", cover_url: s.cover_url ?? "" });
  }

  async function save() {
    if (busy || !form.title.trim()) return;
    setBusy(true);
    const body = JSON.stringify({
      title: form.title.trim(),
      description: form.description.trim(),
      event_date: form.event_date || null,
      cover_url: form.cover_url.trim() || null,
    });
    const res =
      editing !== "new" && editing
        ? await adminFetch(`/api/admin/stages/${editing.id}`, { method: "PATCH", body })
        : await adminFetch("/api/admin/stages", { method: "POST", body });
    setBusy(false);
    if (res.ok) {
      toast("저장했어요.");
      setEditing(null);
      void load();
    } else {
      const j = await res.json().catch(() => ({}));
      toast(j.error ?? "저장 실패");
    }
  }

  async function patch(id: string, patch: Record<string, unknown>, done: string) {
    const res = await adminFetch(`/api/admin/stages/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    if (res.ok) {
      toast(done);
      void load();
    } else toast("변경 실패");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] text-fg/50">유저는 &lsquo;진행중&rsquo; 스테이지에만 영상을 올릴 수 있어요. 보관하면 열람만 가능해요.</p>
        <button onClick={() => openEdit("new")} className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-4 py-2 text-[13px] font-bold text-white">
          <Plus className="h-4 w-4" /> 스테이지 생성
        </button>
      </div>

      {stages.map((s) => (
        <div key={s.id} className="rounded-xl bg-white/[0.04] p-3.5 ring-1 ring-white/10">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[14px] font-bold text-fg">{s.title}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${s.status === "open" ? "bg-primary/20 text-primary-400" : "bg-white/8 text-fg/50"}`}>
                  {s.status === "open" ? "진행중" : "보관"}
                </span>
                {s.hidden && <span className="shrink-0 rounded-full bg-white/8 px-2 py-0.5 text-[10.5px] font-bold text-fg/50">숨김</span>}
              </div>
              <div className="mt-0.5 text-[11.5px] text-fg/45">
                {s.event_date ?? "일자 미정"} · 영상 {s.post_count}개
              </div>
            </div>
            <button onClick={() => openEdit(s)} aria-label="수정" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/6 text-fg/60">
              <Pencil className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button
              onClick={() => patch(s.id, { status: s.status === "open" ? "archived" : "open" }, s.status === "open" ? "보관했어요." : "다시 열었어요.")}
              className="rounded-full bg-white/8 px-3 py-1.5 text-[12px] font-bold text-fg/70"
            >
              {s.status === "open" ? "보관하기" : "다시 열기"}
            </button>
            <button
              onClick={() => patch(s.id, { hidden: !s.hidden }, s.hidden ? "공개했어요." : "숨겼어요.")}
              className="rounded-full bg-white/8 px-3 py-1.5 text-[12px] font-bold text-fg/70"
            >
              {s.hidden ? "공개하기" : "숨기기"}
            </button>
          </div>
        </div>
      ))}
      {stages.length === 0 && <p className="py-8 text-center text-[13px] text-fg/40">스테이지가 없어요. 첫 스테이지를 생성해보세요.</p>}

      {/* 생성/수정 폼 */}
      {editing && (
        <div className="anim-backdrop-in fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={() => setEditing(null)}>
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[92dvh] w-full max-w-lg space-y-3 overflow-y-auto rounded-t-2xl bg-[#141217] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-bold text-fg">{editing === "new" ? "스테이지 생성" : "스테이지 수정"}</h3>
            <label className="block text-[12px] font-bold text-fg/60">
              아카이브명
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={80} placeholder="예: 2026 여름 부산 버스킹"
                className="mt-1 w-full rounded-xl bg-white/6 px-3 py-3 text-[13.5px] text-fg outline-none ring-1 ring-white/10 focus:ring-primary/60 placeholder:text-fg/30" />
            </label>
            <label className="block text-[12px] font-bold text-fg/60">
              소개
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} rows={2}
                className="mt-1 w-full resize-none rounded-xl bg-white/6 px-3 py-3 text-[13.5px] text-fg outline-none ring-1 ring-white/10 focus:ring-primary/60" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-[12px] font-bold text-fg/60">
                공연 일자
                <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-white/6 px-3 py-3 text-[13.5px] text-fg outline-none ring-1 ring-white/10 focus:ring-primary/60" />
              </label>
              <label className="block text-[12px] font-bold text-fg/60">
                커버 이미지 URL (선택)
                <input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://…"
                  className="mt-1 w-full rounded-xl bg-white/6 px-3 py-3 text-[13.5px] text-fg outline-none ring-1 ring-white/10 focus:ring-primary/60 placeholder:text-fg/30" />
              </label>
            </div>
            <button onClick={save} disabled={busy || !form.title.trim()} className="w-full rounded-full bg-primary py-3 text-[14px] font-bold text-white disabled:opacity-40">
              {editing === "new" ? "생성하기" : "저장하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
