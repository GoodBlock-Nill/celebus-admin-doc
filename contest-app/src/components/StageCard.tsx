"use client";

// 스테이지 피드 카드 — 썸네일 + 플랫폼 + 카테고리 + 팬 하트. 탭하면 상세(임베드) 열림.
import { Heart, ImageOff, Play } from "lucide-react";
import type { MemberHeartPublic, StagePostPublic } from "@/lib/types";
import { useLang } from "./LangProvider";

// 카드 전용 컴팩트 멤버 반응 라인 — 작은 아바타 + 인디고 텍스트 (은은하게, 광택/컨페티 없음)
function CardMemberSeenLine({ hearts }: { hearts: MemberHeartPublic[] }) {
  const { t } = useLang();
  if (hearts.length === 0) return null;
  const sorted = [...hearts].sort((a, b) => a.sort_order - b.sort_order);
  const text =
    sorted.length === 1
      ? t("mh_likes_one").replace("{name}", sorted[0].display_name)
      : t("mh_likes_many").replace("{name}", sorted[0].display_name).replace("{n}", String(sorted.length - 1));
  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <span className="flex shrink-0 -space-x-1">
        {sorted.slice(0, 5).map((h) =>
          h.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={h.member_id}
              src={h.avatar_url}
              alt={h.display_name}
              className="h-4 w-4 rounded-full object-cover ring-2 ring-card"
            />
          ) : (
            <span
              key={h.member_id}
              className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-soft text-[7px] font-bold text-primary-strong ring-2 ring-card"
            >
              {h.display_name.slice(0, 1)}
            </span>
          ),
        )}
      </span>
      <span className="min-w-0 truncate text-[10.5px] font-bold text-primary-strong">{text}</span>
    </div>
  );
}

export default function StageCard({
  post,
  liked,
  hearts = [],
  grandSlam = false,
  onOpen,
  onToggleLike,
}: {
  post: StagePostPublic;
  liked: boolean;
  hearts?: MemberHeartPublic[];
  grandSlam?: boolean;
  onOpen: () => void;
  onToggleLike: () => void;
}) {
  const { t } = useLang();
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-card shadow-sm ${
        grandSlam ? "border-2 border-gold" : "border border-border"
      }`}
    >
      <button onClick={onOpen} className="relative block w-full text-left" aria-label={post.title}>
        {post.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.thumbnail_url} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />
        ) : (
          <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-1.5 bg-card-2 text-subtle">
            <ImageOff className="h-8 w-8" />
            <span className="text-[10px] font-semibold">{t("thumb_no_image")}</span>
          </div>
        )}
        {/* 하단 비네트 — 배지·재생 아이콘 가독성 보조 */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/45" />
        <span className="absolute left-2 top-2 rounded-lg bg-black/45 px-2 py-1 text-[9.5px] font-extrabold text-white backdrop-blur-sm">
          {t(`cat_${post.category}`)}
        </span>
        <span className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-primary shadow-sm">
          <Play className="h-3 w-3 fill-current" />
        </span>
      </button>
      <div className="px-2.5 pb-2.5 pt-2">
        <button onClick={onOpen} className="block w-full text-left">
          <div className="line-clamp-2 text-[12.5px] font-bold leading-snug text-fg">{post.title}</div>
        </button>
        <div className="mt-1 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[11px] text-muted">@{post.handle}</span>
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
        <CardMemberSeenLine hearts={hearts} />
      </div>
    </div>
  );
}
