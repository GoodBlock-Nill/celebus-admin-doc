"use client";

// 콘테스트 1개 = 자기완결 섹션. 커버(훅 정보)+유형맞춤 업로드 CTA+자기 출품작 스트립.
// 다중 콘테스트 홈에서 동등하게 스택된다. 대표/전역 CTA 개념 없음.
import Link from "next/link";
import { Upload } from "lucide-react";
import type { ContestPublic, EntryPublic } from "@/lib/types";
import { canSubmit, canVote } from "@/lib/contest-status";
import CoverHero from "./CoverHero";
import MediaTile from "./MediaTile";
import { useLang } from "./LangProvider";

interface ContestWithStats extends ContestPublic {
  entryCount: number;
  voteCount: number;
}

export default function ContestSection({ contest, entries }: { contest: ContestWithStats; entries: EntryPublic[] }) {
  const { t } = useLang();
  const uploadKey = contest.contest_type === "video" ? "upload_video" : "upload_photo";
  const open = canSubmit(contest);

  return (
    <section className="space-y-3">
      {/* 커버 — 상세로 링크. D-day·보상·통계는 커버 위에 집약 */}
      <CoverHero
        contest={contest}
        entryCount={contest.entryCount}
        voteCount={contest.voteCount}
        href={`/contest/${contest.slug}`}
      />

      {/* 유형맞춤 업로드 CTA (풀폭) — 이 콘테스트로만 정확히 이동 */}
      {open ? (
        <Link
          href={`/contest/${contest.slug}/submit`}
          className="flex items-center justify-center gap-2 rounded-[14px] bg-primary py-3.5 text-[15px] font-black text-white transition-transform active:scale-[0.99]"
        >
          <Upload className="h-4 w-4" /> {t(uploadKey)}
        </Link>
      ) : (
        <p className="rounded-[14px] bg-surface-1 py-3 text-center text-[13px] font-bold text-muted ring-1 ring-hairline">
          {t("submit_closed")}
        </p>
      )}

      {/* 최근 출품작 스트립 (미디어 우선) */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-[13px] font-black text-muted">{t("home_entries")}</h3>
          {entries.length > 0 && (
            <Link href={`/contest/${contest.slug}`} className="text-[12px] font-bold text-primary-400">
              {t("home_see_all")} →
            </Link>
          )}
        </div>
        {entries.length > 0 ? (
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {entries.map((e) => (
              <div key={e.id} className="w-44 shrink-0 snap-start">
                <MediaTile entry={e} contestType={contest.contest_type} canVote={canVote(contest)} />
              </div>
            ))}
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
