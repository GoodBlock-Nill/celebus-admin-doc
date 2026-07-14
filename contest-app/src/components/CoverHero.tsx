"use client";

// 커버 이미지 풀블리드 히어로 — 커버가 주인공(opacity 배경화 폐지).
// 제목·D-day·CTA를 커버 위 스크림에 올린다. 칩은 아티스트+유형 2개로 제한.
import Link from "next/link";
import { Trophy, Users, Heart, Film, ImageIcon } from "lucide-react";
import type { ContestPublic } from "@/lib/types";
import { contestVisual } from "@/lib/contest-visual";
import { ddayTarget, remaining, canSubmit, STATUS_LABELS } from "@/lib/contest-status";
import { useLang } from "./LangProvider";

function Dday({ contest }: { contest: ContestPublic }) {
  const { t } = useLang();
  const target = ddayTarget(contest);
  if (!target) return null;
  const r = remaining(target.at);
  if (r.over) return null;
  const label = r.days > 0 ? `D-${r.days}` : `${r.hours}${t("dday_hour")} ${r.mins}${t("dday_min")}`;
  return (
    <span className="pulse-chip inline-flex items-center gap-1 rounded-full bg-live px-2.5 py-1 text-[12px] font-black text-white">
      {t(target.labelKey)} {label}
    </span>
  );
}

export default function CoverHero({
  contest,
  entryCount,
  voteCount,
  href,
}: {
  contest: ContestPublic;
  entryCount: number;
  voteCount: number;
  href?: string; // 홈에서 카드로 쓸 때 링크
}) {
  const { t } = useLang();
  const v = contestVisual(contest.contest_type);
  const isLive = contest.status !== "closed";

  const inner = (
    <div className={`relative overflow-hidden rounded-[22px] ring-1 ring-hairline ${isLive ? v.glowClass : ""}`}>
      {/* 커버 */}
      <div className="relative aspect-[16/10] w-full bg-surface-2">
        {contest.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={contest.cover_image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: `radial-gradient(120% 100% at 50% 0%, ${v.accentHex}22, transparent 60%), #141417` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/35 to-black/10" />

        {/* 상단 칩 2개 + D-day */}
        <div className="absolute inset-x-0 top-0 flex items-center gap-1.5 p-3">
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-black text-white backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            {contest.artist}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.5)", color: v.accentHex }}
          >
            {contest.contest_type === "video" ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
            {t(`type_${contest.contest_type}`)}
          </span>
          <span className="ml-auto">
            <Dday contest={contest} />
          </span>
        </div>

        {/* 하단 제목 + 상금 */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          {!isLive && (
            <span className="mb-1.5 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white/80">
              {t("status_closed") ?? STATUS_LABELS[contest.status]}
            </span>
          )}
          <h1 className="text-[22px] font-black leading-tight text-white drop-shadow sm:text-[26px]">{contest.title}</h1>
          {contest.prize_summary && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-bold text-gold drop-shadow">
              <Trophy className="h-4 w-4" /> {contest.prize_summary}
            </p>
          )}
        </div>
      </div>

      {/* 커버 하단 바: 통계 + CTA */}
      <div className="flex items-center gap-4 bg-surface-1 px-4 py-3">
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted">
          <Users className="h-3.5 w-3.5" /> {entryCount.toLocaleString()}
        </span>
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted">
          <Heart className="h-3.5 w-3.5" /> {voteCount.toLocaleString()}
        </span>
        {canSubmit(contest) && !href && (
          <Link
            href={`/contest/${contest.slug}/submit`}
            className="ml-auto rounded-full bg-primary px-5 py-2 text-[13px] font-black text-white transition-colors hover:bg-primary-strong"
          >
            {t("submit_cta")}
          </Link>
        )}
        {href && <span className="ml-auto text-[12px] font-bold text-primary-400">{t("view_contest")} →</span>}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="lift block">
      {inner}
    </Link>
  ) : (
    inner
  );
}
