"use client";

import { toast } from "sonner";
import { EyeOff, Eye, Trash2, Star } from "lucide-react";
import type { AdminComment } from "@/lib/admin-types";

const chip = (active: boolean) =>
  `flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
    active ? "bg-primary text-white" : "bg-card-2 text-muted hover:text-fg"
  }`;

export default function CommentAdminCard({
  comment,
  headers,
  onLocalUpdate,
  onRemove,
}: {
  comment: AdminComment;
  headers: () => Record<string, string>;
  onLocalUpdate: (id: string, fields: Partial<AdminComment>) => void;
  onRemove: (id: string) => void;
}) {
  async function patch(fields: Partial<AdminComment>) {
    const res = await fetch(`/api/admin/comments/${comment.id}`, { method: "PATCH", headers: headers(), body: JSON.stringify(fields) });
    if (res.ok) onLocalUpdate(comment.id, fields);
    else toast.error("처리 실패");
  }

  async function remove() {
    if (!confirm("이 댓글을 삭제할까요?")) return;
    const res = await fetch(`/api/admin/comments/${comment.id}`, { method: "DELETE", headers: headers() });
    if (res.ok) onRemove(comment.id);
    else toast.error("삭제 실패");
  }

  return (
    <div className={`rounded-2xl border p-4 ${comment.hidden ? "border-danger/40 bg-danger/5" : "border-border bg-card"}`}>
      <div className="mb-1 flex flex-wrap items-center gap-2 text-[12px] text-muted">
        <span className="font-bold text-fg">{comment.nickname}</span>
        <span>· ♥ {comment.like_count}</span>
        {comment.report_count > 0 && <span className="text-danger">· 신고 {comment.report_count}</span>}
        {comment.hidden && <span className="rounded bg-danger/20 px-1.5 text-danger">숨김</span>}
        {comment.is_op && <span className="rounded bg-primary/20 px-1.5 text-primary-400">작성자</span>}
        {comment.pinned && <span className="rounded bg-amber-400/20 px-1.5 text-amber-300">베스트</span>}
        <a href={`/post/${comment.post_id}`} target="_blank" rel="noopener noreferrer" className="ml-auto underline hover:text-fg">원글 보기 ↗</a>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm text-fg/90">{comment.body}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => patch({ pinned: !comment.pinned })} className={chip(comment.pinned)}>
          <Star className={`h-3.5 w-3.5 ${comment.pinned ? "fill-current" : ""}`} /> 베스트
        </button>
        <button onClick={() => patch({ hidden: !comment.hidden })} className="flex items-center gap-1 rounded-full bg-card-2 px-3 py-1 text-xs font-semibold text-muted hover:text-fg">
          {comment.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {comment.hidden ? "숨김 해제" : "숨기기"}
        </button>
        <button onClick={remove} className="flex items-center gap-1 rounded-full bg-card-2 px-3 py-1 text-xs font-semibold text-muted hover:text-danger">
          <Trash2 className="h-3.5 w-3.5" /> 삭제
        </button>
      </div>
    </div>
  );
}
