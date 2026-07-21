"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import { sb } from "@/lib/supabase-browser";
import { getDeviceId, getCommentLiked, addCommentLiked } from "@/lib/client-util";
import type { CommentPublic } from "@/lib/types";
import { useLang } from "../LangProvider";
import CommentCard from "./CommentCard";
import CommentComposer from "./CommentComposer";
import CommentDeleteModal from "./CommentDeleteModal";

export default function CommentSection({ postId }: { postId: string }) {
  const { t } = useLang();
  const [comments, setComments] = useState<CommentPublic[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [del, setDel] = useState<CommentPublic | null>(null);

  const load = useCallback(async () => {
    const { data } = await sb
      .from("comments_public")
      .select("*")
      .eq("post_id", postId)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: true });
    const list = (data as CommentPublic[]) ?? [];
    setComments(list);
    // 서버(쿠키 신원) 기준 좋아요 상태 동기화 — localStorage 불일치 방지
    const ids = list.map((c) => c.id);
    if (ids.length) {
      try {
        const res = await fetch("/api/comments/liked-status", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        const d = await res.json();
        if (Array.isArray(d.liked) && d.liked.length) {
          setLiked((prev) => {
            const s = new Set(prev);
            for (const id of d.liked) s.add(id);
            return s;
          });
        }
      } catch {
        /* 실패 시 localStorage 기준 유지 */
      }
    }
  }, [postId]);

  useEffect(() => {
    setLiked(getCommentLiked());
    void load();
  }, [load]);

  async function like(c: CommentPublic) {
    if (liked.has(c.id)) return;
    setComments((arr) => arr.map((x) => (x.id === c.id ? { ...x, like_count: x.like_count + 1 } : x)));
    setLiked((s) => new Set(s).add(c.id));
    addCommentLiked(c.id);
    try {
      const res = await fetch(`/api/comments/${c.id}/like`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ voter: getDeviceId() }),
      });
      const data = await res.json();
      if (res.ok && typeof data.like_count === "number") {
        setComments((arr) => arr.map((x) => (x.id === c.id ? { ...x, like_count: data.like_count } : x)));
      }
    } catch {
      /* 낙관적 유지 */
    }
  }

  async function report(c: CommentPublic) {
    try {
      await fetch(`/api/comments/${c.id}/report`, { method: "POST" });
      toast.success(t("comment_report_done"));
    } catch {
      toast.error(t("report_fail"));
    }
  }

  return (
    <div className="mt-6 border-t border-border/60 pt-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold">
        <MessageSquare className="h-4 w-4 text-primary-400" /> {t("comments_label")} {comments.length}
      </h3>
      <CommentComposer postId={postId} onAdded={load} />
      {comments.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted">{t("comment_empty")}</p>
      ) : (
        <div className="mt-3 grid gap-2">
          {comments.map((c) => (
            <CommentCard key={c.id} comment={c} liked={liked.has(c.id)} onLike={like} onReport={report} onDelete={setDel} />
          ))}
        </div>
      )}
      {del && <CommentDeleteModal comment={del} onClose={() => setDel(null)} onDone={() => { setDel(null); void load(); }} />}
    </div>
  );
}
