"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import type { AdminComment } from "@/lib/admin-types";
import CommentAdminCard from "./CommentAdminCard";

type Status = "all" | "reported" | "hidden" | "pinned";
type Sort = "recent" | "reported" | "likes";

const STATUS_OPTS: { value: Status; label: string }[] = [
  { value: "all", label: "전체 상태" },
  { value: "reported", label: "신고됨" },
  { value: "hidden", label: "숨김" },
  { value: "pinned", label: "베스트" },
];
const SORT_OPTS: { value: Sort; label: string }[] = [
  { value: "recent", label: "최신순" },
  { value: "reported", label: "신고순" },
  { value: "likes", label: "좋아요순" },
];

export default function CommentsPanel({ headers }: { headers: () => Record<string, string> }) {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [count, setCount] = useState(0);
  const [size, setSize] = useState(20);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status, sort, page: String(page) });
    if (debouncedQ) params.set("q", debouncedQ);
    const res = await fetch(`/api/admin/comments?${params}`, { headers: headers() });
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments ?? []);
      setCount(data.count ?? 0);
      setSize(data.size ?? 20);
    }
    setLoading(false);
  }, [headers, status, sort, page, debouncedQ]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    setPage(0);
  }, [debouncedQ, status, sort]);
  useEffect(() => {
    void load();
  }, [load]);

  const onLocalUpdate = (id: string, fields: Partial<AdminComment>) => setComments((arr) => arr.map((x) => (x.id === id ? { ...x, ...fields } : x)));
  const onRemove = (id: string) => setComments((arr) => arr.filter((x) => x.id !== id));

  const totalPages = Math.max(1, Math.ceil(count / size));
  const win = Array.from({ length: totalPages }, (_, i) => i).filter((i) => Math.abs(i - page) <= 2);
  const selCls = "rounded-lg border border-border bg-card-2 px-2.5 py-1.5 text-xs font-semibold text-fg outline-none";

  return (
    <div>
      <h2 className="mb-3 text-sm font-black">댓글 관리 <span className="font-medium text-muted">· {count}건</span></h2>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="닉네임·내용 검색" className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={selCls}>
          {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={selCls}>
          {SORT_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {comments.length === 0 ? (
        <p className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
          <Inbox className="h-6 w-6" /> {loading ? "불러오는 중…" : "댓글이 없어요."}
        </p>
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {comments.map((c) => (
            <CommentAdminCard key={c.id} comment={c} headers={headers} onLocalUpdate={onLocalUpdate} onRemove={onRemove} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-1.5">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-muted disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {win[0] > 0 && <span className="px-1 text-xs text-muted">…</span>}
          {win.map((i) => (
            <button key={i} onClick={() => setPage(i)} className={`h-8 min-w-8 rounded-lg px-2 text-sm font-semibold ${i === page ? "bg-primary text-white" : "border border-border bg-card text-muted hover:text-fg"}`}>
              {i + 1}
            </button>
          ))}
          {win[win.length - 1] < totalPages - 1 && <span className="px-1 text-xs text-muted">…</span>}
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-muted disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
