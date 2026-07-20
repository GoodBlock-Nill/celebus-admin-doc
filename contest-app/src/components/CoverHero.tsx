"use client";

// 커버 이미지 풀블리드 히어로 — 이미지가 주인공(선명 유지, 전면 어둠 제거).
// 메타(아티스트·유형·마감 D-day·통계)는 이미지 아래 하단 바에 정리. 제목만 하단 약스크림 위.
import Link from "next/link";
import { Trophy, Users, Heart, Film, ImageIcon } from "lucide-react";
import type { ContestPublic } from "@/lib/types";
import { contestVisual } from "@/lib/contest-visual";
import { ddayTarget, remaining, STATUS_LABELS } from "@/lib/contest-status";
import { localizeContest } from "@/lib/localize";
import { useLang } from "./LangProvider";

// 하단 바용 마감 D-day 뱃지 (라이브 펄스 유지)
function DdayBadge({ contest }: { contest: ContestPublic }) {
  const { t } = useLang();
  const target = ddayTarget(contest);
  if (!target) return null;
  const r = remaining(target.at);
  if (r.over) return null;
  const label = r.days > 0 ? `D-${r.days}` : `${r.hours}${t("dday_hour")} ${r.mins}${t("dday_min")}`;
  return (
    <span className="pulse-chip inline-flex items-center gap-1 rounded-full bg-live px-2.5 py-1 text-[11px] font-black text-white">
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
  const { t, lang } = useLang();
  const v = contestVisual(contest.contest_type);
  const isLive = contest.status !== "closed";
  const loc = localizeContest(contest, lang);

  const inner = (
    <div className={`relative overflow-hidden rounded-[22px] ring-1 ring-hairline ${isLive ? v.glowClass : ""}`}>
      {/* 커버 — 이미지 선명 유지, 제목만 하단 약스크림 위 */}
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
        {/* 하단 한정 약스크림 — 상단 절반 이상은 원본 선명, 제목 가독만 확보 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.30) 30%, rgba(0,0,0,0) 55%)",
          }}
        />

        {/* 하단 제목 + 상금 */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          {!isLive && (
            <span className="mb-1.5 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white/80">
              {t("status_closed") ?? STATUS_LABELS[contest.status]}
            </span>
          )}
          <h1 className="text-[22px] font-black leading-tight text-white drop-shadow sm:text-[26px]">{loc.title}</h1>
          {loc.prize_summary && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-bold text-gold drop-shadow">
              <Trophy className="h-4 w-4" /> {loc.prize_summary}
            </p>
          )}
        </div>
      </div>

      {/* 커버 하단 바: 아티스트·유형·마감 뱃지 + 통계 (버튼 자리 대체) */}
      <div className="flex flex-wrap items-center gap-2 bg-surface-1 px-4 py-3">
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-black text-fg">{contest.artist}</span>
        <span
          className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-black"
          style={{ color: v.accentHex }}
        >
          {contest.contest_type === "video" ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
          {t(`type_${contest.contest_type}`)}
        </span>
        <DdayBadge contest={contest} />
        <div className="ml-auto flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted">
            <Users className="h-3.5 w-3.5" /> {entryCount.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted">
            <Heart className="h-3.5 w-3.5" /> {voteCount.toLocaleString()}
          </span>
          {href && <span className="text-[12px] font-bold text-primary-400">{t("view_contest")} →</span>}
        </div>
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
