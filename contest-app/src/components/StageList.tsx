"use client";

// 홈 스테이지 탭 — 관리자가 연 공연 스테이지 목록. 탭하면 해당 스테이지(공연별 영상 아카이브)로 이동.
import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clapperboard, Trophy } from "lucide-react";
import { sb } from "@/lib/supabase-browser";
import type { StagePublic } from "@/lib/types";
import { useLang } from "./LangProvider";

function StageCardItem({ stage }: { stage: StagePublic }) {
  const { t } = useLang();
  return (
    <Link
      href={`/stage/${stage.id}`}
      className="block overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10 transition-transform active:scale-[0.99]"
    >
      {stage.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={stage.cover_url} alt="" loading="lazy" className="aspect-[21/9] w-full object-cover" />
      ) : (
        <div className="flex aspect-[21/9] w-full items-center justify-center bg-gradient-to-br from-primary/30 via-primary/10 to-transparent">
          <Clapperboard className="h-8 w-8 text-primary-400/70" />
        </div>
      )}
      <div className="p-3.5">
        <div className="flex items-center gap-2">
          <h3 className="min-w-0 flex-1 truncate text-[15px] font-bold text-fg">{stage.title}</h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
              stage.status === "open" ? "bg-primary/20 text-primary-400" : "bg-white/8 text-fg/50"
            }`}
          >
            {t(stage.status === "open" ? "stage_open" : "stage_archived")}
          </span>
        </div>
        {stage.description && <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-fg/55">{stage.description}</p>}
        <div className="mt-2 flex items-center gap-3 text-[11.5px] text-fg/45">
          {stage.event_date && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> {stage.event_date}
            </span>
          )}
          <span>{t("stage_posts_n").replace("{n}", String(stage.post_count))}</span>
        </div>
      </div>
    </Link>
  );
}

export default function StageList() {
  const { t } = useLang();
  const [stages, setStages] = useState<StagePublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await sb
        .from("stages_public")
        .select("*")
        .order("sort_order")
        .order("created_at", { ascending: false });
      setStages((data ?? []) as StagePublic[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="mb-3">
        <h1 className="text-[19px] font-bold text-fg">{t("stage_heading")}</h1>
        <p className="mt-0.5 text-[12.5px] text-fg/50">{t("stage_sub")}</p>
      </div>
      <Link href="/hearts" className="mb-4 flex items-center gap-2 rounded-xl bg-primary/10 px-3.5 py-3 ring-1 ring-primary/25 active:scale-[0.99]">
        <Trophy className="h-4 w-4 text-primary-400" />
        <span className="text-[13.5px] font-bold text-primary-400">{t("hall_entry")}</span>
      </Link>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[21/12] animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : stages.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.04] px-4 py-14 text-center text-[13.5px] text-fg/50 ring-1 ring-white/10">
          {t("stage_list_empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {stages.map((s) => (
            <StageCardItem key={s.id} stage={s} />
          ))}
        </div>
      )}
    </div>
  );
}
