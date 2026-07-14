"use client";

// 시상대 — 1위를 풀폭 대형으로 강조, 2·3위를 나란히. 정렬 흐트러짐 방지.
import Link from "next/link";
import { Crown, Play } from "lucide-react";
import type { ContestType, EntryPublic } from "@/lib/types";
import PlatformGlyph from "./PlatformGlyph";
import VoteButton from "./VoteButton";

function Tile({
  entry,
  rank,
  contestType,
  canVote,
  big = false,
}: {
  entry: EntryPublic;
  rank: 1 | 2 | 3;
  contestType: ContestType;
  canVote: boolean;
  big?: boolean;
}) {
  const isVideo = contestType === "video";
  const ring =
    rank === 1 ? "ring-2 ring-gold" : rank === 2 ? "ring-1 ring-silver/50" : "ring-1 ring-bronze/50";
  const medalBg = rank === 1 ? "bg-gold text-black" : rank === 2 ? "bg-silver text-black" : "bg-bronze text-white";
  const aspect = big ? "aspect-[16/10]" : "aspect-square";
  const playSize = big ? "h-12 w-12" : "h-9 w-9";

  return (
    <Link href={`/entry/${entry.id}`} className={`group relative block overflow-hidden rounded-[16px] bg-surface-1 ${ring}`}>
      <div className={`relative w-full overflow-hidden bg-surface-2 ${aspect}`}>
        {entry.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.thumbnail_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PlatformGlyph platform={entry.platform} size={big ? 48 : 32} />
          </div>
        )}
        {isVideo && entry.thumbnail_url && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className={`flex items-center justify-center rounded-full bg-black/55 ring-1 ring-white/25 ${playSize}`}>
              <Play className={`translate-x-[1px] fill-white text-white ${big ? "h-5 w-5" : "h-4 w-4"}`} />
            </span>
          </span>
        )}

        {/* 순위 메달 */}
        <span
          className={`absolute left-2 top-2 flex items-center justify-center rounded-full font-black ${medalBg} ${
            big ? "h-9 w-9 text-[16px]" : "h-7 w-7 text-[13px]"
          }`}
        >
          {rank === 1 ? <Crown className={big ? "h-5 w-5" : "h-4 w-4"} /> : rank}
        </span>

        {/* 하단 스크림: 제목·핸들(좌) + 투표(우) 한 줄 정렬 */}
        <div className="media-scrim absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5">
          <div className="min-w-0">
            <p className={`line-clamp-1 font-bold text-white drop-shadow ${big ? "text-[15px]" : "text-[12px]"}`}>
              {entry.title}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/70">
              <PlatformGlyph platform={entry.platform} size={12} />
              <span className="truncate">@{entry.handle}</span>
            </p>
          </div>
          <span className="shrink-0" onClick={(e) => e.preventDefault()}>
            <VoteButton entryId={entry.id} count={entry.vote_count} canVote={canVote && !entry.disqualified} size="sm" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Podium({
  entries,
  contestType,
  canVote,
}: {
  entries: EntryPublic[]; // 상위 정렬 전제
  contestType: ContestType;
  canVote: boolean;
}) {
  const [first, second, third] = entries;
  if (!first) return null;
  return (
    <div className="space-y-2.5">
      {/* 1위 풀폭 */}
      <Tile entry={first} rank={1} contestType={contestType} canVote={canVote} big />
      {/* 2·3위 나란히 */}
      {(second || third) && (
        <div className="grid grid-cols-2 gap-2.5">
          {second && <Tile entry={second} rank={2} contestType={contestType} canVote={canVote} />}
          {third && <Tile entry={third} rank={3} contestType={contestType} canVote={canVote} />}
        </div>
      )}
    </div>
  );
}
