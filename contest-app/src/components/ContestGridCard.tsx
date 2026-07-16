"use client";

// 홈 콘테스트 목록 타일 — 커버 썸네일 지배, 칩 1개(아티스트), 상태는 라이브 도트.
import Link from "next/link";
import { Film, ImageIcon } from "lucide-react";
import type { ContestPublic } from "@/lib/types";
import { contestVisual } from "@/lib/contest-visual";
import { ddayTarget, remaining } from "@/lib/contest-status";
import { localizeContest } from "@/lib/localize";
import { useLang } from "./LangProvider";

export default function ContestGridCard({ contest, dimmed = false }: { contest: ContestPublic; dimmed?: boolean }) {
  const { t, lang } = useLang();
  const v = contestVisual(contest.contest_type);
  const target = ddayTarget(contest);
  const r = target ? remaining(target.at) : null;
  const dday = r && !r.over && r.days > 0 ? `D-${r.days}` : null;

  return (
    <Link href={`/contest/${contest.slug}`} className="lift group relative block overflow-hidden rounded-[16px] ring-1 ring-hairline">
      <div className={`relative aspect-square w-full overflow-hidden bg-surface-2 ${dimmed ? "grayscale" : ""}`}>
        {contest.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={contest.cover_image_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: `radial-gradient(120% 100% at 50% 0%, ${v.accentHex}22, transparent 60%), #141417` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* 상단: 아티스트 칩 + 유형 아이콘 + D-day */}
        <div className="absolute inset-x-0 top-0 flex items-center gap-1 p-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            {contest.contest_type === "video" ? (
              <Film className="h-2.5 w-2.5" style={{ color: v.accentHex }} />
            ) : (
              <ImageIcon className="h-2.5 w-2.5" style={{ color: v.accentHex }} />
            )}
            {contest.artist}
          </span>
          {dday && (
            <span className="ml-auto rounded-full bg-live px-1.5 py-0.5 text-[10px] font-black text-white">{dday}</span>
          )}
          {contest.status === "closed" && (
            <span className="ml-auto rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-black uppercase text-white/70">
              {t("status_closed")}
            </span>
          )}
        </div>

        {/* 하단 제목 */}
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <p className="line-clamp-2 text-[13px] font-black leading-snug text-white drop-shadow">{localizeContest(contest, lang).title}</p>
        </div>
      </div>
    </Link>
  );
}
