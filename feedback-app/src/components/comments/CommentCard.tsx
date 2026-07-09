"use client";

import { Heart, Siren, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CommentPublic } from "@/lib/types";
import { getDateLocale } from "@/lib/i18n";
import { useLang } from "../LangProvider";

export default function CommentCard({
  comment,
  liked,
  onLike,
  onReport,
  onDelete,
}: {
  comment: CommentPublic;
  liked: boolean;
  onLike: (c: CommentPublic) => void;
  onReport: (c: CommentPublic) => void;
  onDelete: (c: CommentPublic) => void;
}) {
  const { t, lang } = useLang();
  const rel = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: getDateLocale(lang) });

  return (
    <div className={`rounded-2xl border p-3 ${comment.pinned ? "border-amber-400/30 bg-amber-400/5" : "border-border bg-card"}`}>
      <div className="mb-1 flex items-center gap-1.5 text-[13px]">
        <span className="font-bold">{comment.nickname}</span>
        {comment.is_op && <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary-400">{t("badge_op")}</span>}
        {comment.pinned && <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">{t("badge_best")}</span>}
        <span className="ml-auto text-[11px] text-muted">{rel}</span>
      </div>
      <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-fg/90">{comment.body}</p>
      <div className="mt-2 flex items-center gap-3 text-[12px]">
        <button onClick={() => onLike(comment)} disabled={liked} className={`flex items-center gap-1 ${liked ? "text-accent" : "text-muted hover:text-fg"}`}>
          <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} /> {comment.like_count}
        </button>
        <button onClick={() => onReport(comment)} className="flex items-center gap-1 text-muted hover:text-danger">
          <Siren className="h-3.5 w-3.5" /> {t("report")}
        </button>
        <button onClick={() => onDelete(comment)} className="ml-auto flex items-center gap-1 text-muted hover:text-danger">
          <Trash2 className="h-3.5 w-3.5" /> {t("del")}
        </button>
      </div>
    </div>
  );
}
