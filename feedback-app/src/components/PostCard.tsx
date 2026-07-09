"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MoreHorizontal, Pencil, Trash2, ImageDown, Siren, Share2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { PostPublic } from "@/lib/types";
import { getDateLocale } from "@/lib/i18n";
import { useLang } from "./LangProvider";
import TargetBadge from "./TargetBadge";
import { PostBadges, OfficialReply } from "./Badges";

export default function PostCard({
  post,
  rank,
  liked,
  onLike,
  onReport,
  onEdit,
  onDelete,
  onSaveImage,
  onShare,
}: {
  post: PostPublic;
  rank?: number;
  liked: boolean;
  onLike: (p: PostPublic) => void;
  onReport: (p: PostPublic) => void;
  onEdit: (p: PostPublic) => void;
  onDelete: (p: PostPublic) => void;
  onSaveImage: (p: PostPublic) => void;
  onShare: (p: PostPublic) => void;
}) {
  const { t, lang } = useLang();
  const [menu, setMenu] = useState(false);
  const rel = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: getDateLocale(lang) });

  return (
    <div className="relative rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        {typeof rank === "number" && (
          <span className={`text-sm font-black ${rank < 3 ? "grad" : "text-muted"}`}>{rank + 1}</span>
        )}
        <TargetBadge target={post.target} />
        <span className="truncate text-sm font-bold">{post.nickname}</span>
        {post.edited && <span className="text-[10px] text-muted">({t("edited")})</span>}
        <span className="ml-auto text-[11px] text-muted">{rel}</span>
        <button onClick={() => setMenu((v) => !v)} className="text-muted hover:text-fg" aria-label="메뉴">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {(post.curated || post.pinned || post.impl_status !== "none") && (
        <div className="mb-2">
          <PostBadges post={post} />
        </div>
      )}

      <Link href={`/post/${post.id}`} className="block">
        <h3 className="line-clamp-1 text-[16px] font-bold text-fg hover:text-primary-400">{post.title || post.body}</h3>
        {post.title && <p className="mt-1 line-clamp-2 break-words text-[14px] leading-relaxed text-muted">{post.body}</p>}
      </Link>

      <OfficialReply reply={post.official_reply} />

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => onLike(post)}
          disabled={liked}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
            liked ? "bg-accent/15 text-accent" : "bg-card-2 text-muted hover:text-fg"
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          {post.like_count}
        </button>
        <Link href={`/post/${post.id}`} className="flex items-center gap-1.5 rounded-full bg-card-2 px-3 py-1 text-sm font-semibold text-muted hover:text-fg">
          <MessageSquare className="h-4 w-4" /> {post.comment_count}
        </Link>
        <button
          onClick={() => onReport(post)}
          className="ml-auto flex items-center gap-1 text-[12px] text-muted hover:text-danger"
        >
          <Siren className="h-3.5 w-3.5" /> {t("report")}
        </button>
      </div>

      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
          <div className="absolute right-3 top-11 z-50 w-36 overflow-hidden rounded-xl border border-border bg-card-2 py-1 shadow-2xl shadow-black/50">
            {[
              { icon: Pencil, label: t("edit"), fn: () => onEdit(post) },
              { icon: Trash2, label: t("del"), fn: () => onDelete(post) },
              { icon: Share2, label: t("share"), fn: () => onShare(post) },
              { icon: ImageDown, label: t("saveImage"), fn: () => onSaveImage(post) },
            ].map(({ icon: Icon, label, fn }) => (
              <button
                key={label}
                onClick={() => {
                  setMenu(false);
                  fn();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-fg/90 hover:bg-white/5"
              >
                <Icon className="h-4 w-4 text-muted" /> {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
