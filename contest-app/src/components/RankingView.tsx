"use client";

// 랭킹 탭 — ① 토너먼트별 랭킹 ② D10V 크리에이터 랭킹(최다업로드·팬영상) ③ D10V Pick(최다우승·팬영상)
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, ChevronRight, Play } from "lucide-react";
import { sb } from "@/lib/supabase-browser";
import type { CreatorRankPublic, D10vPickPublic, StageEventPublic } from "@/lib/types";
import { useLang } from "./LangProvider";
import { SectionHeader } from "./HomeAtoms";

function RankBadge({ i }: { i: number }) {
  const c = i === 0 ? "bg-gold text-black" : i === 1 ? "bg-silver text-black" : i === 2 ? "bg-bronze text-white" : "bg-card-2 text-muted";
  return <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-black ${c}`}>{i + 1}</span>;
}

export default function RankingView() {
  const { t } = useLang();
  const [events, setEvents] = useState<StageEventPublic[]>([]);
  const [creators, setCreators] = useState<CreatorRankPublic[]>([]);
  const [picks, setPicks] = useState<D10vPickPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [evRes, crRes, pkRes] = await Promise.all([
        sb.from("stage_events_public").select("*").order("created_at", { ascending: false }),
        sb.from("creator_ranking_public").select("*").order("uploads", { ascending: false }).limit(10),
        sb.from("d10v_pick_public").select("*").order("total_wins", { ascending: false }).limit(10),
      ]);
      setEvents((evRes.data ?? []) as StageEventPublic[]);
      setCreators((crRes.data ?? []) as CreatorRankPublic[]);
      setPicks((pkRes.data ?? []) as D10vPickPublic[]);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl border border-border bg-card-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* ① 토너먼트별 랭킹 */}
      <section>
        <SectionHeader title={t("rank_by_tournament")} sub={t("rank_by_tournament_sub")} />
        {events.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-3 py-4 text-center text-[12.5px] text-muted">{t("rank_empty_soon")}</p>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <Link key={e.id} href={`/event/${e.id}`} className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm active:scale-[0.99]">
                <Trophy className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-fg">{e.title}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                    <span className={`rounded-full px-1.5 py-0.5 font-extrabold ${e.stage_is_official ? "bg-primary-soft text-primary-strong" : "bg-[#eaf7f0] text-[#21845f]"}`}>
                      {t(e.stage_is_official ? "ev_source_official" : "ev_source_fan")}
                      {e.stage_is_official && e.category ? ` · ${t(`cat_${e.category}`)}` : ""}
                    </span>
                    <span className="text-subtle">{t(e.status === "open" ? "ev_status_open" : "ev_status_announced")}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-subtle" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ② D10V 크리에이터 랭킹 — 최다업로드(팬영상) */}
      <section>
        <SectionHeader title={t("rank_creators")} sub={t("rank_creators_sub")} />
        {creators.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-3 py-4 text-center text-[12.5px] text-muted">{t("rank_empty_soon")}</p>
        ) : (
          <div className="space-y-1.5">
            {creators.map((c, i) => {
              const name = c.nickname || t("rank_anon");
              return (
                <div key={c.owner_id} className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm">
                  <RankBadge i={i} />
                  {/* 크리에이터 아바타 (없으면 브랜드 기본) */}
                  {c.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full brand-gradient text-[13px] font-black text-white">{name.slice(0, 1)}</span>
                  )}
                  <div className="min-w-0 flex-1 truncate text-[13px] font-bold text-fg">{name}</div>
                  <span className="shrink-0 text-[12px] font-bold text-primary-strong">{t("rank_uploads_n").replace("{n}", String(c.uploads))}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ③ D10V Pick — 최다우승(팬영상) */}
      <section>
        <SectionHeader title={t("rank_d10v_pick")} sub={t("rank_d10v_pick_sub")} />
        {picks.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-3 py-4 text-center text-[12.5px] text-muted">{t("rank_empty_soon")}</p>
        ) : (
          <div className="space-y-1.5">
            {picks.map((p, i) => (
              <Link key={p.post_id} href={`/video/${p.post_id}?list=stage:${p.stage_id}`} className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 shadow-sm active:scale-[0.99]">
                <RankBadge i={i} />
                <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg">
                  {p.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary-soft to-card-2" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90">
                      <Play className="h-2.5 w-2.5 fill-primary text-primary" />
                    </span>
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-bold text-fg">{p.title}</div>
                  <div className="truncate text-[10.5px] text-subtle">@{p.handle}</div>
                </div>
                <span className="shrink-0 text-[12px] font-bold text-primary-strong">{t("rank_wins_n").replace("{n}", String(p.total_wins))}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
