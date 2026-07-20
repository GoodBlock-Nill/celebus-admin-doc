"use client";

// 홈 — 미디어 우선 미니멀. 저마찰 업로드 CTA + 콘테스트 커버 + 출품작 갤러리가 주인공.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { sb } from "@/lib/supabase-browser";
import type { ContestPublic, EntryPublic } from "@/lib/types";
import { canSubmit, canVote, ddayTarget, remaining } from "@/lib/contest-status";
import { contestVisual } from "@/lib/contest-visual";
import { localizeContest } from "@/lib/localize";
import Shell from "./Shell";
import CoverHero from "./CoverHero";
import HeroCarousel from "./HeroCarousel";
import ContestGridCard from "./ContestGridCard";
import MediaTile from "./MediaTile";
import HomeHowItWorks from "./HomeIntro";
import { useLang } from "./LangProvider";

interface ContestWithStats extends ContestPublic {
  entryCount: number;
  voteCount: number;
}

function pickPrimary(live: ContestWithStats[]): ContestWithStats | null {
  const featured = live
    .filter((c) => c.is_featured)
    .sort((a, b) => (a.banner_order ?? 999) - (b.banner_order ?? 999));
  return featured[0] ?? live[0] ?? null;
}

function HomeBody() {
  const { t, lang } = useLang();
  const [live, setLive] = useState<ContestWithStats[]>([]);
  const [past, setPast] = useState<ContestPublic[]>([]);
  const [entries, setEntries] = useState<EntryPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("contests_public").select("*").order("created_at", { ascending: false });
      const contests = (data as ContestPublic[]) ?? [];
      const liveOnes = contests.filter((c) => c.status !== "closed");
      const pastOnes = contests.filter((c) => c.status === "closed");

      const withStats = await Promise.all(
        liveOnes.map(async (c) => {
          const { data: rows, count } = await sb
            .from("contest_entries_public")
            .select("vote_count", { count: "exact" })
            .eq("contest_id", c.id);
          const voteCount = (rows ?? []).reduce((s, r) => s + (r.vote_count ?? 0), 0);
          return { ...c, entryCount: count ?? 0, voteCount };
        }),
      );
      setLive(withStats);
      setPast(pastOnes);

      // 대표 콘테스트의 최근 출품작 (미디어 우선 갤러리)
      const primary = pickPrimary(withStats);
      if (primary) {
        const { data: ent } = await sb
          .from("contest_entries_public")
          .select("*")
          .eq("contest_id", primary.id)
          .order("created_at", { ascending: false })
          .limit(6);
        setEntries((ent as EntryPublic[]) ?? []);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-14 animate-pulse rounded-[16px] bg-surface-1" />
        <div className="aspect-[16/10] animate-pulse rounded-[22px] bg-surface-1" />
        <div className="grid grid-cols-2 gap-3">
          <div className="aspect-square animate-pulse rounded-[16px] bg-surface-1" />
          <div className="aspect-square animate-pulse rounded-[16px] bg-surface-1" />
        </div>
      </div>
    );
  }

  const featured = live
    .filter((c) => c.is_featured)
    .sort((a, b) => (a.banner_order ?? 999) - (b.banner_order ?? 999))
    .slice(0, 6);
  const featuredIds = new Set(featured.map((c) => c.id));
  const heroMode = featured.length > 0;
  const main = heroMode ? null : live[0];
  const others = heroMode ? live.filter((c) => !featuredIds.has(c.id)) : live.slice(1);

  const primary = pickPrimary(live);
  const gallery = primary ? contestVisual(primary.contest_type) : null;

  // 훅: 마감 임박(D-day) + 참여 열기 + 보상 + 업로드 CTA
  const target = primary ? ddayTarget(primary) : null;
  const r = target ? remaining(target.at) : null;
  const dday = r && !r.over ? (r.days > 0 ? `D-${r.days}` : `${r.hours}:${String(r.mins).padStart(2, "0")}`) : null;
  const prizeHook = primary
    ? localizeContest(primary, lang).prize_summary || primary.prizes[0]?.name || ""
    : "";

  return (
    <div className="space-y-6">
      {/* 훅 블록 — 진행중·D-day·참여 + 보상 + 업로드 CTA */}
      {primary && canSubmit(primary) && (
        <div className="overflow-hidden rounded-[18px] bg-surface-1 ring-1 ring-hairline">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 pt-3.5 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1 rounded-full bg-live/15 px-2 py-0.5 text-live">
              <span className="h-1.5 w-1.5 rounded-full bg-live" /> {t("home_ongoing")}
            </span>
            {dday && <span className="text-fg">{dday}</span>}
            {primary.entryCount > 0 && (
              <span className="ml-auto text-muted">🔥 {primary.entryCount.toLocaleString()}{t("home_joined")}</span>
            )}
          </div>
          {prizeHook && (
            <p className="line-clamp-1 px-4 pt-2 text-[17px] font-black leading-snug text-gold">🏆 {prizeHook}</p>
          )}
          <div className="px-3 pb-3 pt-2.5">
            <Link
              href={`/contest/${primary.slug}/submit`}
              className="flex items-center justify-center gap-2 rounded-[14px] bg-primary py-3.5 text-[15px] font-black text-white transition-transform active:scale-[0.99]"
            >
              <Upload className="h-4 w-4" /> {t("home_upload_cta")}
            </Link>
          </div>
        </div>
      )}

      {/* 콘테스트 커버 히어로 */}
      {heroMode ? (
        <HeroCarousel slides={featured} />
      ) : main ? (
        <CoverHero contest={main} entryCount={main.entryCount} voteCount={main.voteCount} href={`/contest/${main.slug}`} />
      ) : (
        <p className="rounded-[22px] border border-dashed border-line py-16 text-center text-sm text-muted">{t("home_empty")}</p>
      )}

      {/* 출품작 갤러리 (대표 콘테스트) — 미디어 우선 핵심 */}
      {primary && gallery && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-black">{t("home_entries")}</h2>
            {entries.length > 0 && (
              <Link href={`/contest/${primary.slug}`} className="text-[12px] font-bold text-primary-400">
                {t("home_see_all")} →
              </Link>
            )}
          </div>
          {entries.length > 0 ? (
            <div className={gallery.galleryClass}>
              {entries.map((e) => (
                <MediaTile
                  key={e.id}
                  entry={e}
                  contestType={primary.contest_type}
                  canVote={canVote(primary)}
                  natural={gallery.galleryClass === "masonry"}
                />
              ))}
            </div>
          ) : (
            <Link
              href={canSubmit(primary) ? `/contest/${primary.slug}/submit` : `/contest/${primary.slug}`}
              className="block rounded-[16px] border border-dashed border-line py-10 text-center text-sm text-muted transition-colors hover:text-fg"
            >
              {t("home_entries_empty")}
            </Link>
          )}
        </section>
      )}

      {/* 진행중 콘테스트 */}
      {others.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-black">{t("home_live")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {others.map((c) => (
              <ContestGridCard key={c.id} contest={c} />
            ))}
          </div>
        </section>
      )}

      {/* 지난 콘테스트 */}
      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-black text-muted">{t("home_past")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {past.map((c) => (
              <ContestGridCard key={c.id} contest={c} dimmed />
            ))}
          </div>
        </section>
      )}

      {/* 참여 방법 — 슬림 스트립 (보조) */}
      <HomeHowItWorks />
    </div>
  );
}

export default function HomeShell() {
  return (
    <Shell>
      <HomeBody />
    </Shell>
  );
}
