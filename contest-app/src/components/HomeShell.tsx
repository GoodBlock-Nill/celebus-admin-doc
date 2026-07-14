"use client";

import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase-browser";
import type { ContestPublic } from "@/lib/types";
import Shell from "./Shell";
import CoverHero from "./CoverHero";
import ContestGridCard from "./ContestGridCard";
import { useLang } from "./LangProvider";

interface ContestWithStats extends ContestPublic {
  entryCount: number;
  voteCount: number;
}

function HomeBody() {
  const { t } = useLang();
  const [live, setLive] = useState<ContestWithStats[]>([]);
  const [past, setPast] = useState<ContestPublic[]>([]);
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
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="aspect-[16/10] animate-pulse rounded-[22px] bg-surface-1" />
        <div className="grid grid-cols-2 gap-3">
          <div className="aspect-square animate-pulse rounded-[16px] bg-surface-1" />
          <div className="aspect-square animate-pulse rounded-[16px] bg-surface-1" />
        </div>
      </div>
    );
  }

  const [main, ...others] = live;

  return (
    <div className="space-y-8">
      <p className="eyebrow text-center">{t("home_hero_kicker")}</p>

      {main ? (
        <CoverHero
          contest={main}
          entryCount={main.entryCount}
          voteCount={main.voteCount}
          href={`/contest/${main.slug}`}
        />
      ) : (
        <p className="rounded-[22px] border border-dashed border-line py-16 text-center text-sm text-muted">
          {t("home_empty")}
        </p>
      )}

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
