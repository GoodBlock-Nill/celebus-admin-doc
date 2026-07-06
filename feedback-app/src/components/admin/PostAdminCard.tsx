"use client";

import { useState } from "react";
import { toast } from "sonner";
import { EyeOff, Eye, Trash2, Star, Pin, Save } from "lucide-react";
import type { ImplStatus } from "@/lib/types";
import type { AdminPost } from "@/lib/admin-types";

const STATUS_OPTS: { value: ImplStatus; label: string }[] = [
  { value: "none", label: "상태 없음" },
  { value: "reviewing", label: "검토중" },
  { value: "planned", label: "반영 예정" },
  { value: "realized", label: "실현됨" },
];

const chip = (active: boolean) =>
  `flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
    active ? "bg-primary text-white" : "bg-card-2 text-muted hover:text-fg"
  }`;

export default function PostAdminCard({
  post,
  headers,
  onLocalUpdate,
  onRemove,
}: {
  post: AdminPost;
  headers: () => Record<string, string>;
  onLocalUpdate: (id: string, fields: Partial<AdminPost>) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const reply = draft ?? post.official_reply ?? "";

  async function patch(fields: Partial<AdminPost>) {
    const res = await fetch(`/api/admin/posts/${post.id}`, { method: "PATCH", headers: headers(), body: JSON.stringify(fields) });
    if (res.ok) onLocalUpdate(post.id, fields);
    else toast.error("처리 실패");
  }

  async function saveReply() {
    await patch({ official_reply: reply.trim() });
    toast.success("공식 답글을 저장했어요.");
  }

  async function remove() {
    if (!confirm("완전히 삭제할까요?")) return;
    const res = await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE", headers: headers() });
    if (res.ok) onRemove(post.id);
    else toast.error("삭제 실패");
  }

  return (
    <div className={`rounded-2xl border p-4 ${post.hidden ? "border-danger/40 bg-danger/5" : "border-border bg-card"}`}>
      <div className="mb-1 flex flex-wrap items-center gap-2 text-[12px] text-muted">
        <span className="font-bold text-fg">{post.nickname}</span>
        <span>· {post.target}</span>
        <span>· ♥ {post.like_count}</span>
        {post.report_count > 0 && <span className="text-danger">· 신고 {post.report_count}</span>}
        {post.hidden && <span className="rounded bg-danger/20 px-1.5 text-danger">숨김</span>}
        {post.curated && <span className="rounded bg-amber-400/20 px-1.5 text-amber-300">채택</span>}
        {post.pinned && <span className="rounded bg-white/10 px-1.5">고정</span>}
      </div>
      {post.title && <p className="text-sm font-bold text-fg">{post.title}</p>}
      <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-fg/90">{post.body}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => patch({ curated: !post.curated })} className={chip(post.curated)}>
          <Star className={`h-3.5 w-3.5 ${post.curated ? "fill-current" : ""}`} /> 채택
        </button>
        <button onClick={() => patch({ pinned: !post.pinned })} className={chip(post.pinned)}>
          <Pin className={`h-3.5 w-3.5 ${post.pinned ? "fill-current" : ""}`} /> 고정
        </button>
        <select
          value={post.impl_status}
          onChange={(e) => patch({ impl_status: e.target.value as ImplStatus })}
          className="rounded-full border border-border bg-card-2 px-3 py-1 text-xs font-semibold text-fg outline-none"
        >
          {STATUS_OPTS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-2">
        <textarea
          value={reply}
          onChange={(e) => setDraft(e.target.value.slice(0, 500))}
          placeholder="공식/아티스트 답글 (비우고 저장하면 삭제)"
          rows={2}
          className="w-full resize-none rounded-xl border border-border bg-bg px-3 py-2 text-[13px] outline-none focus:border-primary/60"
        />
        <div className="mt-1 flex items-center gap-2">
          <button onClick={saveReply} className="flex items-center gap-1 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-white hover:bg-primary">
            <Save className="h-3.5 w-3.5" /> 답글 저장
          </button>
          <button onClick={() => patch({ hidden: !post.hidden })} className="flex items-center gap-1 rounded-full bg-card-2 px-3 py-1 text-xs font-semibold text-muted hover:text-fg">
            {post.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {post.hidden ? "숨김 해제" : "숨기기"}
          </button>
          <button onClick={remove} className="flex items-center gap-1 rounded-full bg-card-2 px-3 py-1 text-xs font-semibold text-muted hover:text-danger">
            <Trash2 className="h-3.5 w-3.5" /> 삭제
          </button>
        </div>
      </div>
    </div>
  );
}
