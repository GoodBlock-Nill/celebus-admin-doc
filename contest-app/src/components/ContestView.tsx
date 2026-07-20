"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { sb } from "@/lib/supabase-browser";
import type { AwardPublic, ContestPublic, EntryPublic } from "@/lib/types";
import { canVote, canSubmit } from "@/lib/contest-status";
import { contestVisual } from "@/lib/contest-visual";
import { localizeContest } from "@/lib/localize";
import Shell from "./Shell";
import CoverHero from "./CoverHero";
import PrizeShowcase from "./PrizeShowcase";
import Leaderboard from "./Leaderboard";
import MediaTile from "./MediaTile";
import ErrorState from "./ErrorState";
import { useLang } from "./LangProvider";

type Tab = "leaderboard" | "latest" | "awards";

function ContestBody({ slug }: { slug: string }) {
  const { t, lang } = useLang();
  const [contest, setContest] = useState<ContestPublic | null>(null);
  const [entries, setEntries] = useState<EntryPublic[]>([]);
  const [latest, setLatest] = useState<EntryPublic[]>([]);
  const [awards, setAwards] = useState<AwardPublic[]>([]);
  const [stats, setStats] = useState({ entryCount: 0, voteSum: 0 });
  const [tab, setTab] = useState<Tab>("latest");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: c } = await sb.from("contests_public").select("*").eq("slug", slug).maybeSingle();
    if (!c) {
      setLoading(false);
      return;
    }
    const contest = c as ContestPublic;
    setContest(contest);

    const [{ data: lb }, { data: recent }, { data: aw }, { data: countRows, count: entryCount }] = await Promise.all([
      sb
        .from("contest_entries_public")
        .select("*")
        .eq("contest_id", contest.id)
        .order("vote_count", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(100),
      sb
        .from("contest_entries_public")
        .select("*")
        .eq("contest_id", contest.id)
        .order("created_at", { ascending: false })
        .limit(50),
      sb
        .from("contest_awards_public")
        .select("*")
        .eq("contest_id", contest.id)
        .order("award_type", { ascending: true })
        .order("rank", { ascending: true }),
      // 히어로 통계 — 100건 슬라이스와 무관하게 전체 참여수·투표수 집계
      sb.from("contest_entries_public").select("vote_count", { count: "exact" }).eq("contest_id", contest.id),
    ]);
    setEntries((lb as EntryPublic[]) ?? []);
    setLatest((recent as EntryPublic[]) ?? []);
    setAwards((aw as AwardPublic[]) ?? []);
    const voteSumAll = ((countRows as { vote_count: number }[]) ?? []).reduce((s, r) => s + (r.vote_count ?? 0), 0);
    setStats({ entryCount: entryCount ?? 0, voteSum: voteSumAll });
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-56 animate-pulse rounded-3xl bg-card" />
        <div className="h-40 animate-pulse rounded-2xl bg-card" />
      </div>
    );
  }
  if (!contest) {
    return <ErrorState onRetry={() => void load()} />;
  }

  const votable = canVote(contest);
  const v = contestVisual(contest.contest_type);
  const loc = localizeContest(contest, lang);
  const showAwardsTab = contest.status === "announced" || contest.status === "closed" || contest.status === "judging";

  const tabs: { key: Tab; label: string }[] = [
    { key: "latest", label: t("tab_latest") },
    { key: "leaderboard", label: t("tab_leaderboard") },
    ...(showAwardsTab ? [{ key: "awards" as Tab, label: t("tab_awards") }] : []),
  ];

  const isMasonry = v.galleryClass === "masonry";
  const Gallery = ({ list }: { list: EntryPublic[] }) =>
    list.length ? (
      <div className={v.galleryClass}>
        {list.map((e) => (
          <MediaTile key={e.id} entry={e} contestType={contest.contest_type} canVote={votable} natural={isMasonry} />
        ))}
      </div>
    ) : (
      <p className="rounded-[16px] border border-dashed border-line py-10 text-center text-sm text-muted">
        {t("lb_empty")}
      </p>
    );

  return (
    <div className="space-y-6">
      <CoverHero contest={contest} entryCount={stats.entryCount} voteCount={stats.voteSum} />

      {/* 소개 */}
      {loc.description && (
        <p className="whitespace-pre-wrap rounded-[16px] bg-surface-1 p-4 text-[13.5px] leading-relaxed text-fg/90 ring-1 ring-hairline">
          {loc.description}
        </p>
      )}

      <PrizeShowcase contest={contest} />

      {/* 탭 */}
      <div>
        <div className="mb-3 flex gap-1.5">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
                tab === tb.key ? "bg-fg text-surface-0" : "bg-surface-1 text-muted hover:text-fg"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 — key로 전환 시 짧은 크로스페이드 */}
        <div key={tab} className="anim-fade-up">
        {tab === "leaderboard" && (
          <Leaderboard contest={contest} entries={entries.filter((e) => e.vote_count >= 1 && !e.disqualified)} />
        )}
        {tab === "latest" && <Gallery list={latest} />}

        {tab === "awards" &&
          (awards.length ? (
            <div className="space-y-2">
              {awards.map((a) => {
                const entry = entries.find((e) => e.id === a.entry_id);
                return (
                  <Link
                    key={a.id}
                    href={a.entry_id ? `/entry/${a.entry_id}` : "#"}
                    className="lift flex items-center gap-3 overflow-hidden rounded-[16px] bg-surface-1 ring-1 ring-gold/30"
                  >
                    <div className="h-16 w-16 shrink-0 bg-surface-2">
                      {entry?.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={entry.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl">🏆</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 py-2 pr-3">
                      <p className="text-[11px] font-black text-gold">
                        {a.award_name}
                        <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-px text-[10px] text-muted">
                          {t(a.award_type === "popular" ? "award_popular" : "award_judge")}
                        </span>
                      </p>
                      <p className="truncate text-[14px] font-bold">{entry?.title ?? `@${a.handle}`}</p>
                      <p className="truncate text-[11px] text-muted">
                        @{a.handle}
                        {a.prize ? ` · ${a.prize}` : ""}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="rounded-[16px] border border-dashed border-line py-10 text-center text-sm text-muted">
              {contest.status === "judging" ? t("awards_pending") : t("awards_empty")}
            </p>
          ))}
        </div>
      </div>

      {/* 규정 — 접이식 */}
      {loc.rules && (
        <details className="group rounded-[16px] bg-surface-1 ring-1 ring-hairline">
          <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-[14px] font-black">
            📋 {t("rules_title")}
            <span className="text-muted transition-transform group-open:rotate-90">›</span>
          </summary>
          <p className="whitespace-pre-wrap px-4 pb-4 text-[13px] leading-relaxed text-muted">{loc.rules}</p>
        </details>
      )}

      {/* 하단 고정 CTA — 전 화면 항상 표시(참여 유도) */}
      {canSubmit(contest) && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-surface-0/90 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
          <div className="mx-auto max-w-2xl px-3">
            <Link
              href={`/contest/${contest.slug}/submit`}
              className="flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-center text-[15px] font-black text-white transition-colors hover:bg-primary-strong"
            >
              <Upload className="h-4 w-4" /> {t(contest.contest_type === "video" ? "upload_video" : "upload_photo")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContestView({ slug }: { slug: string }) {
  return (
    <Shell>
      <ContestBody slug={slug} />
    </Shell>
  );
}
