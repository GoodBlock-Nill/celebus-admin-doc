"use client";

// 홈 — 다중 콘테스트 동등 섹션 스택. 각 open 콘테스트가 자기완결 섹션(커버+유형맞춤 CTA+자기 출품작).
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase-browser";
import type { ContestPublic, EntryPublic } from "@/lib/types";
import Shell from "./Shell";
import ContestSection from "./ContestSection";
import ContestGridCard from "./ContestGridCard";
import HomeHowItWorks from "./HomeIntro";
import { useLang } from "./LangProvider";

interface ContestWithStats extends ContestPublic {
  entryCount: number;
  voteCount: number;
}

// 홈 노출 순서: featured 우선 → banner_order 오름 → 접수 마감 임박 순
function homeOrder(a: ContestWithStats, b: ContestWithStats): number {
  if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
  const ao = a.banner_order ?? 999;
  const bo = b.banner_order ?? 999;
  if (ao !== bo) return ao - bo;
  const ae = a.submit_end_at ? Date.parse(a.submit_end_at) : Infinity;
  const be = b.submit_end_at ? Date.parse(b.submit_end_at) : Infinity;
  return ae - be;
}

export function HomeBody() {
  const { t } = useLang();
  const [open, setOpen] = useState<ContestWithStats[]>([]);
  const [past, setPast] = useState<ContestPublic[]>([]);
  const [entriesById, setEntriesById] = useState<Record<string, EntryPublic[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("contests_public").select("*").order("created_at", { ascending: false });
      const contests = (data as ContestPublic[]) ?? [];
      const openOnes = contests.filter((c) => c.status !== "closed");
      const pastOnes = contests.filter((c) => c.status === "closed");

      const withStats = await Promise.all(
        openOnes.map(async (c) => {
          const { data: rows, count } = await sb
            .from("contest_entries_public")
            .select("vote_count", { count: "exact" })
            .eq("contest_id", c.id);
          const voteCount = (rows ?? []).reduce((s, r) => s + (r.vote_count ?? 0), 0);
          return { ...c, entryCount: count ?? 0, voteCount };
        }),
      );
      withStats.sort(homeOrder);
      setOpen(withStats);
      setPast(pastOnes);

      // open 콘테스트마다 최근 출품작 (미디어 우선 스트립)
      const pairs = await Promise.all(
        withStats.map(async (c) => {
          const { data: ent } = await sb
            .from("contest_entries_public")
            .select("*")
            .eq("contest_id", c.id)
            .order("created_at", { ascending: false })
            .limit(7);
          return [c.id, (ent as EntryPublic[]) ?? []] as const;
        }),
      );
      setEntriesById(Object.fromEntries(pairs));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="aspect-[16/10] animate-pulse rounded-[22px] bg-surface-1" />
        <div className="h-12 animate-pulse rounded-[14px] bg-surface-1" />
        <div className="flex gap-3">
          <div className="h-40 w-44 shrink-0 animate-pulse rounded-[16px] bg-surface-1" />
          <div className="h-40 w-44 shrink-0 animate-pulse rounded-[16px] bg-surface-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* open 콘테스트 — 동등 섹션 스택 (마운트 시 스태거 등장) */}
      {open.length > 0
        ? open.map((c, i) => <ContestSection key={c.id} contest={c} entries={entriesById[c.id] ?? []} index={i} />)
        : past.length === 0 && (
            <p className="rounded-[22px] border border-dashed border-line py-16 text-center text-sm text-muted">
              {t("home_empty")}
            </p>
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
