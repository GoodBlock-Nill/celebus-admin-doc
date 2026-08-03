"use client";

// 댓글 (W2) — 200자·대댓글 1단. 멤버 댓글은 하이라이트+최상단. 신고 3회 자동 숨김.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Flag, Trash2, CornerDownRight } from "lucide-react";
import { CharmIcon } from "./CharmIcon";
import { sb } from "@/lib/supabase-browser";
import type { StageCommentPublic } from "@/lib/types";
import { useLang } from "./LangProvider";
import { useSession } from "./SessionProvider";

function CommentRow({
  c,
  mine,
  onReply,
  onDelete,
  onReport,
  isReply,
}: {
  c: StageCommentPublic;
  mine: boolean;
  onReply?: () => void;
  onDelete: () => void;
  onReport: () => void;
  isReply: boolean;
}) {
  const { t } = useLang();
  return (
    <div className={`${isReply ? "ml-7" : ""} ${c.is_member ? "rounded-xl bg-primary-soft px-3 py-2.5" : "px-1 py-2"}`}>
      <div className="flex items-center gap-2">
        {isReply && <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-subtle" />}
        {c.is_member && c.member_avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.member_avatar} alt="" loading="lazy" className="h-5 w-5 rounded-full object-cover ring-2 ring-card" />
        ) : null}
        <span className={`text-[12px] font-bold ${c.is_member ? "text-primary-strong" : "text-muted"}`}>
          {c.is_member ? c.member_name : c.fan_label}
        </span>
        {c.is_member && (
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9.5px] font-extrabold text-white">
            {t("comment_member_badge")}
          </span>
        )}
        <span className="flex-1" />
        {mine ? (
          <button onClick={onDelete} aria-label={t("comment_delete")} className="-my-1.5 flex h-11 w-11 items-center justify-center rounded-full text-subtle hover:text-muted">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button onClick={onReport} aria-label={t("comment_report")} className="-my-1.5 flex h-11 w-11 items-center justify-center rounded-full text-subtle hover:text-muted">
            <Flag className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-fg/85">{c.body}</p>
      {!isReply && onReply && (
        <button onClick={onReply} className="mt-0.5 text-[11.5px] font-bold text-subtle">
          {t("comment_reply")}
        </button>
      )}
    </div>
  );
}

export default function CommentSection({ postId }: { postId: string }) {
  const { t } = useLang();
  const { requireLogin } = useSession();
  const [comments, setComments] = useState<StageCommentPublic[]>([]);
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<StageCommentPublic | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, mineRes] = await Promise.all([
      sb.from("stage_comments_public").select("*").eq("post_id", postId).order("created_at"),
      fetch(`/api/stage/posts/${postId}/comments`).then((r) => r.json()).catch(() => ({ mine: [] })),
    ]);
    setComments((data ?? []) as StageCommentPublic[]);
    setMine(new Set<string>(mineRes.mine ?? []));
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    if (busy || !body.trim()) return;
    if (!requireLogin(() => submit())) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/stage/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), parent_id: replyTo?.id ?? null }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setBody("");
        setReplyTo(null);
        void load();
      } else {
        toast(t(j.code === "profanity" ? "err_profanity" : j.code === "rate_capped" ? "err_rate_capped_comment" : "err_server"));
      }
    } catch {
      toast(t("err_server"));
    }
    setBusy(false);
  }

  async function remove(id: string) {
    const res = await fetch(`/api/stage/comments/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast(t("comment_deleted"));
      void load();
    } else toast(t("err_server"));
  }

  async function report(id: string) {
    if (!requireLogin(() => report(id))) return;
    const res = await fetch(`/api/stage/comments/${id}/report`, { method: "POST" });
    const j = await res.json().catch(() => ({}));
    toast(res.ok || j.code === "already" ? t("comment_reported") : t("err_server"));
    if (res.ok) void load();
  }

  // 정렬: 멤버 댓글 최상단 고정 → 나머지 시간순. 답글은 부모 아래.
  const roots = comments.filter((c) => !c.parent_id);
  const ordered = [...roots.filter((c) => c.is_member), ...roots.filter((c) => !c.is_member)];
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);

  return (
    <div className="mt-4 border-t border-border pt-3">
      <h3 className="mb-1 text-[13px] font-bold text-muted">
        {t("comments_title")} {comments.length > 0 && <span className="text-subtle">({comments.length})</span>}
      </h3>

      {loading ? (
        <div className="space-y-2 py-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-xl bg-black/[0.05]" />
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 py-6 text-center text-[12.5px] text-subtle">
          <CharmIcon name="message-circle" size={40} />
          {t("comment_empty")}
        </div>
      ) : (
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {ordered.map((c) => (
            <div key={c.id}>
              <CommentRow c={c} mine={mine.has(c.id)} isReply={false} onReply={() => setReplyTo(c)} onDelete={() => void remove(c.id)} onReport={() => void report(c.id)} />
              {repliesOf(c.id).map((r) => (
                <CommentRow key={r.id} c={r} mine={mine.has(r.id)} isReply onDelete={() => void remove(r.id)} onReport={() => void report(r.id)} />
              ))}
            </div>
          ))}
        </div>
      )}

      {replyTo && (
        <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-muted">
          <CornerDownRight className="h-3 w-3" />
          {t("comment_reply")}: {replyTo.is_member ? replyTo.member_name : replyTo.fan_label}
          <button onClick={() => setReplyTo(null)} className="ml-1 font-bold text-fg">×</button>
        </div>
      )}
      <div className="mt-2 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && submit()}
          maxLength={200}
          placeholder={t("comment_ph")}
          className="min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 py-2.5 text-[13px] text-fg outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 placeholder:text-subtle"
        />
        <button onClick={submit} disabled={busy || !body.trim()} className="shrink-0 rounded-xl bg-primary px-4 text-[13px] font-bold text-white disabled:opacity-40">
          {t("comment_send")}
        </button>
      </div>
    </div>
  );
}
