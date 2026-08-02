"use client";

// 스테이지 피드 카드 — 썸네일 + 플랫폼 + 카테고리 + 팬 하트. 탭하면 상세(임베드) 열림.
import { Heart, Eye, BadgeCheck } from "lucide-react";
import { CharmIcon, PlayBadge } from "./CharmIcon";
import type { StagePostPublic } from "@/lib/types";
import { useLang } from "./LangProvider";

export default function StageCard({
  post,
  liked,
  onOpen,
  onToggleLike,
}: {
  post: StagePostPublic;
  liked: boolean;
  onOpen: () => void;
  onToggleLike: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button onClick={onOpen} className="relative block w-full text-left" aria-label={post.title}>
        {post.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.thumbnail_url} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />
        ) : (
          <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-1.5 bg-card-2 text-subtle">
            <CharmIcon name="image-off" size={44} />
            <span className="text-[10px] font-semibold">{t("thumb_no_image")}</span>
          </div>
        )}
        {/* 하단 비네트 — 배지·재생 아이콘 가독성 보조 */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/45" />
        <span className="absolute left-2 top-2 rounded-lg bg-black/45 px-2 py-1 text-[9.5px] font-extrabold text-white backdrop-blur-sm">
          {t(`cat_${post.category}`)}
        </span>
        {post.is_official && (
          <span className="brand-gradient absolute right-2 top-2 flex items-center gap-0.5 rounded-lg px-1.5 py-1 text-[9.5px] font-extrabold text-white shadow-sm">
            <BadgeCheck className="h-3 w-3" /> {t("official_badge")}
          </span>
        )}
        <span className="absolute bottom-2 right-2">
          <PlayBadge size="sm" />
        </span>
      </button>
      <div className="px-2.5 pb-2.5 pt-2">
        <button onClick={onOpen} className="block w-full text-left">
          <div className="line-clamp-2 text-[12.5px] font-bold leading-snug text-fg">{post.title}</div>
        </button>
        <div className="mt-1 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[11px] text-muted">@{post.handle}</span>
          <span className="flex shrink-0 items-center gap-0.5 text-[11px] text-subtle" aria-label={t("views_label")}>
            <Eye className="h-3.5 w-3.5" /> <span className="tabular-nums">{post.view_count.toLocaleString()}</span>
          </span>
          <button
            onClick={onToggleLike}
            aria-label={t("action_like")}
            aria-pressed={liked}
            className={`-my-2 flex min-h-11 shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-bold transition-colors ${
              liked ? "text-primary" : "text-muted"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
            <span className="tabular-nums">{post.like_count}</span>
          </button>
        </div>
        {post.uploader_nickname && (
          <div className="mt-0.5 truncate text-[10px] text-subtle">{t("uploader_by")} {post.uploader_nickname}</div>
        )}
      </div>
    </div>
  );
}
