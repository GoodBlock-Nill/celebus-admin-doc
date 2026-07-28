"use client";

// 스테이지 피드 카드 — 썸네일 + 플랫폼 + 카테고리 + 팬 하트. 탭하면 상세(임베드) 열림.
import { Heart, ImageOff } from "lucide-react";
import type { MemberHeartPublic, StagePostPublic } from "@/lib/types";
import PlatformBadge from "./PlatformBadge";
import { MemberHeartStack } from "./MemberHearts";
import { useLang } from "./LangProvider";

export default function StageCard({
  post,
  liked,
  hearts = [],
  onOpen,
  onToggleLike,
}: {
  post: StagePostPublic;
  liked: boolean;
  hearts?: MemberHeartPublic[];
  onOpen: () => void;
  onToggleLike: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
      <button onClick={onOpen} className="relative block w-full text-left" aria-label={post.title}>
        {post.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.thumbnail_url} alt="" loading="lazy" className="aspect-video w-full object-cover" />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-white/5 text-fg/30">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        <span className="absolute left-2 top-2">
          <PlatformBadge platform={post.platform} />
        </span>
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white">
          {t(`cat_${post.category}`)}
        </span>
        {/* 멤버 하트 스택 — 이 카드의 훈장 (W2) */}
        {hearts.length > 0 && (
          <span className="absolute bottom-2 left-2">
            <MemberHeartStack hearts={hearts} />
          </span>
        )}
      </button>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="truncate text-[13.5px] font-bold text-fg">{post.title}</div>
          <div className="truncate text-[11.5px] text-fg/50">@{post.handle}</div>
        </button>
        <button
          onClick={onToggleLike}
          aria-label={t("stage_upload_cta")}
          className={`flex min-h-11 shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-bold transition-colors ${
            liked ? "bg-primary/20 text-primary-400" : "bg-white/8 text-fg/70"
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          <span className="tabular-nums">{post.like_count}</span>
        </button>
      </div>
    </div>
  );
}
