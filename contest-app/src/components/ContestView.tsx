"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";
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
  const [trendingIds, setTrendingIds] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>("leaderboard");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: c } = await sb.from("contests_public").select("*").eq("slug", slug).maybeSingle();
    if (!c) {
      setLoading(false);
      return;
    }
    const contest = c as ContestPublic;
    setContest(contest);

    const [{ data: lb }, { data: recent }, { data: aw }] = await Promise.all([
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
    ]);
    setEntries((lb as EntryPublic[]) ?? []);
    setLatest((recent as EntryPublic[]) ?? []);
    setAwards((aw as AwardPublic[]) ?? []);

    try {
      const res = await fetch(`/api/contests/${contest.id}/trending`);
      const data = await res.json();
      setTrendingIds(((data.trending ?? []) as { entry_id: string }[]).map((x) => x.entry_id));
    } catch {
      /* 트렌딩은 부가 정보 — 실패 무시 */
    }
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

  const voteSum = entries.reduce((s, e) => s + e.vote_count, 0);
  const votable = canVote(contest);
  const v = contestVisual(contest.contest_type);
  const loc = localizeContest(contest, lang);
  const trendingEntries = trendingIds
    .map((id) => entries.find((e) => e.id === id))
    .filter((e): e is EntryPublic => !!e)
    .slice(0, 3);
  const showAwardsTab = contest.status === "announced" || contest.status === "closed" || contest.status === "judging";

  const tabs: { key: Tab; label: string }[] = [
    { key: "leaderboard", label: t("tab_leaderboard") },
    { key: "latest", label: t("tab_latest") },
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
      <CoverHero contest={contest} entryCount={entries.length} voteCount={voteSum} />

      {/* 소개 */}
      {loc.description && (
        <p className="whitespace-pre-wrap rounded-[16px] bg-surface-1 p-4 text-[13.5px] leading-relaxed text-fg/90 ring-1 ring-hairline">
          {loc.description}
        </p>
      )}

      <PrizeShowcase contest={contest} />

      {/* 지금 뜨는 — 가로 미디어 캐러셀 */}
      {trendingEntries.length > 0 && tab === "leaderboard" && (
        <section>
          <h2 className="mb-2 inline-flex items-center gap-1.5 text-[15px] font-black">
            <Flame className="h-4 w-4 text-live" /> {t("lb_trending")}
          </h2>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {trendingEntries.map((e) => (
              <div key={e.id} className="w-40 shrink-0 snap-start">
                <MediaTile entry={e} contestType={contest.contest_type} canVote={votable} />
              </div>
            ))}
          </div>
        </section>
      )}

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

        {tab === "leaderboard" && <Leaderboard contest={contest} entries={entries} />}
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

      {/* 모바일 하단 고정 CTA */}
      {canSubmit(contest) && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-surface-0/90 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:hidden">
          <Link
            href={`/contest/${contest.slug}/submit`}
            className="block rounded-full bg-primary py-3 text-center text-[15px] font-black text-white"
          >
            {t("submit_cta")}
          </Link>
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
