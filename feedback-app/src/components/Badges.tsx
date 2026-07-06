"use client";

import { Star, Pin, MessageSquareQuote } from "lucide-react";
import type { PostPublic, ImplStatus } from "@/lib/types";
import { useLang } from "./LangProvider";

const STATUS_STYLE: Record<Exclude<ImplStatus, "none">, string> = {
  reviewing: "bg-white/10 text-muted",
  planned: "bg-primary/15 text-primary-400",
  realized: "bg-emerald-500/15 text-emerald-400",
};
const STATUS_KEY: Record<Exclude<ImplStatus, "none">, string> = {
  reviewing: "st_reviewing",
  planned: "st_planned",
  realized: "st_realized",
};

/** 글 헤더에 붙는 채택·고정·실현상태 뱃지 묶음. */
export function PostBadges({ post }: { post: PostPublic }) {
  const { t } = useLang();
  const hasAny = post.curated || post.pinned || post.impl_status !== "none";
  if (!hasAny) return null;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {post.curated && (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
          <Star className="h-2.5 w-2.5 fill-current" /> {t("badge_curated")}
        </span>
      )}
      {post.impl_status !== "none" && (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[post.impl_status]}`}>
          {t(STATUS_KEY[post.impl_status])}
        </span>
      )}
      {post.pinned && (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-muted">
          <Pin className="h-2.5 w-2.5 fill-current" /> {t("badge_pinned")}
        </span>
      )}
    </span>
  );
}

/** 공식/아티스트 답글 블록. */
export function OfficialReply({ reply }: { reply: string | null }) {
  const { t } = useLang();
  if (!reply) return null;
  return (
    <div className="mt-3 rounded-2xl border border-primary/25 bg-primary/5 p-3">
      <div className="mb-1 flex items-center gap-1 text-[11px] font-bold text-primary-400">
        <MessageSquareQuote className="h-3.5 w-3.5" /> {t("official_reply_label")}
      </div>
      <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-fg/90">{reply}</p>
    </div>
  );
}
