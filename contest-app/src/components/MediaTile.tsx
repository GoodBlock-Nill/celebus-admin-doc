"use client";

// 미디어 지배 갤러리 타일 — 썸네일이 주인공, 텍스트는 하단 스크림 위 최소 2요소.
// 영상=16:9+재생 오버레이, 이미지=정방형(마소니 시 자연 높이).
import Link from "next/link";
import { Play, Crown, ShieldCheck, ArrowUp, ArrowDown, Heart } from "lucide-react";
import type { ContestType, EntryPublic } from "@/lib/types";
import { contestVisual } from "@/lib/contest-visual";
import PlatformGlyph from "./PlatformGlyph";
import VoteButton from "./VoteButton";
import { useLang } from "./LangProvider";

export type RankDelta = "up" | "down" | "new" | null;

export default function MediaTile({
  entry,
  contestType,
  canVote,
  rank,
  rankDelta,
  natural = false, // 마소니: 썸네일 원본 비율 유지
}: {
  entry: EntryPublic;
  contestType: ContestType;
  canVote: boolean;
  rank?: number;
  rankDelta?: RankDelta;
  natural?: boolean;
}) {
  const { t } = useLang();
  const v = contestVisual(contestType);
  const isVideo = contestType === "video";
  const medal = rank === 1 ? "text-gold" : rank === 2 ? "text-silver" : rank === 3 ? "text-bronze" : "";

  return (
    <Link
      href={`/entry/${entry.id}`}
      className="group relative block overflow-hidden rounded-[16px] bg-surface-1 ring-1 ring-hairline"
    >
      {/* 썸네일 */}
      <div className={`relative w-full overflow-hidden bg-surface-2 ${natural ? "" : v.tileAspect}`}>
        {entry.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.thumbnail_url}
            alt=""
            loading="lazy"
            className={`w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] ${
              natural ? "h-auto" : "h-full"
            }`}
          />
        ) : (
          <div className={`flex items-center justify-center ${natural ? "aspect-square" : "h-full"}`}>
            <PlatformGlyph platform={entry.platform} size={40} />
          </div>
        )}

        {/* 영상 재생 오버레이 */}
        {isVideo && entry.thumbnail_url && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 ring-1 ring-white/25 backdrop-blur-sm transition-transform group-hover:scale-110">
              <Play className="h-5 w-5 translate-x-[1px] fill-white text-white" />
            </span>
          </span>
        )}

        {/* 순위 배지 (리더보드) */}
        {typeof rank === "number" && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[12px] font-black text-white backdrop-blur-sm">
            {rank === 1 ? <Crown className="h-3.5 w-3.5 fill-gold text-gold" /> : <span className={medal}>{rank}</span>}
            {rankDelta === "up" && <ArrowUp className="h-3 w-3 text-verified" />}
            {rankDelta === "down" && <ArrowDown className="h-3 w-3 text-danger" />}
            {rankDelta === "new" && <span className="text-[10px] font-black text-primary-400">{t("rank_new")}</span>}
          </span>
        )}

        {/* 실격 */}
        {entry.disqualified && (
          <span className="absolute right-2 top-2 rounded-full bg-danger/90 px-2 py-0.5 text-[10px] font-black text-white">
            {t("disqualified_badge")}
          </span>
        )}

        {/* 하단 스크림: 제목·핸들(좌) + 투표(우) 한 줄 정렬 */}
        <div className="media-scrim absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5">
          <div className="min-w-0">
            <p className="line-clamp-1 text-[13px] font-bold text-white drop-shadow">{entry.title}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/70">
              <PlatformGlyph platform={entry.platform} size={14} />
              <span className="truncate">@{entry.handle}</span>
              {entry.handle_verified && <ShieldCheck className="h-3 w-3 shrink-0 text-verified" />}
            </p>
          </div>
          {entry.disqualified ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-white/70">
              <Heart className="h-3 w-3" /> {entry.vote_count.toLocaleString()}
            </span>
          ) : (
            <span className="shrink-0" onClick={(e) => e.preventDefault()}>
              <VoteButton entryId={entry.id} count={entry.vote_count} canVote={canVote} size="sm" />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
