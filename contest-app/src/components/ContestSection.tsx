"use client";

// 콘테스트 1개 = 자기완결 섹션. 커버(훅 정보)+유형맞춤 업로드 CTA+자기 출품작 스트립.
// 다중 콘테스트 홈에서 동등하게 스택된다. 대표/전역 CTA 개념 없음.
import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { ContestPublic, EntryPublic } from "@/lib/types";
import { canSubmit, canVote } from "@/lib/contest-status";
import { syncVotedStatus } from "@/lib/voted-store";
import CoverHero from "./CoverHero";
import MediaTile from "./MediaTile";
import { useLang } from "./LangProvider";

interface ContestWithStats extends ContestPublic {
  entryCount: number;
  voteCount: number;
}

// 스트립에 최대 7개까지만 노출, 마지막은 전체 보기 타일
const STRIP_MAX = 7;

export default function ContestSection({
  contest,
  entries,
  index = 0,
}: {
  contest: ContestWithStats;
  entries: EntryPublic[];
  index?: number;
}) {
  const { t } = useLang();
  const open = canSubmit(contest);
  const shown = entries.slice(0, STRIP_MAX);

  // 하트 버튼 상태를 서버(쿠키 신원) 기준으로 동기화
  useEffect(() => {
    void syncVotedStatus(shown.map((e) => e.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contest.id, entries]);

  return (
    <section
      className="anim-fade-up space-y-4"
      style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}
    >
      {/* 커버 — 상세로 링크. D-day·보상·통계는 커버 위에 집약 */}
      <CoverHero
        contest={contest}
        entryCount={contest.entryCount}
        voteCount={contest.voteCount}
        href={`/contest/${contest.slug}`}
      />

      {/* CTA (풀폭) — 토널 미니멀. 콘테스트 상세로 이동 (업로드는 상세의 상시 CTA에서) */}
      <Link
        href={`/contest/${contest.slug}`}
        className="group flex items-center justify-center gap-1.5 rounded-full bg-primary/12 py-3 text-[14px] font-black text-primary-400 ring-1 ring-primary/20 transition-colors hover:bg-primary/20 active:scale-[0.99]"
      >
        {t("view_contest")}
        <ChevronRight
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
          strokeWidth={2}
        />
      </Link>

      {/* 최신 업로드 스트립 (미디어 우선) — 최대 7개 + 마지막 전체 보기 타일 */}
      <div>
        <h3 className="mb-2.5 text-[13px] font-black text-muted">{t("home_entries")}</h3>
        {shown.length > 0 ? (
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {shown.map((e) => (
              <div key={e.id} className="w-44 shrink-0 snap-start">
                <MediaTile entry={e} contestType={contest.contest_type} canVote={canVote(contest)} />
              </div>
            ))}
            {/* 전체 보기 타일 (스트립 마지막, 항상 노출) */}
            <Link
              href={`/contest/${contest.slug}`}
              className="flex w-44 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-[16px] bg-surface-1 text-muted ring-1 ring-hairline transition-colors hover:text-fg"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2">
                <ArrowRight className="h-5 w-5" />
              </span>
              <span className="text-[13px] font-black">{t("home_see_all")}</span>
            </Link>
          </div>
        ) : (
          <Link
            href={open ? `/contest/${contest.slug}/submit` : `/contest/${contest.slug}`}
            className="block rounded-[16px] border border-dashed border-line py-8 text-center text-[13px] text-muted transition-colors hover:text-fg"
          >
            {t("home_entries_empty")}
          </Link>
        )}
      </div>
    </section>
  );
}
