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
      className="block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-transform active:scale-[0.99]"
    >
      <div className="relative h-[140px] w-full overflow-hidden">
        {stage.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stage.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-soft via-primary-soft/60 to-transparent">
            <Clapperboard className="h-8 w-8 text-primary-400" />
          </div>
        )}
        <div className="media-scrim pointer-events-none absolute inset-0" />
      </div>
      <div className="p-3.5">
        <h3 className="truncate text-[15px] font-bold text-fg">{stage.title}</h3>
        {stage.description && (
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted">{stage.description}</p>
        )}
        <div className="mt-1.5 flex items-center gap-1 text-[11.5px] text-subtle">
          {stage.event_date && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> {stage.event_date}
            </span>
          )}
          {stage.event_date && <span>·</span>}
          <span className="tabular-nums">{t("stage_posts_n").replace("{n}", String(stage.post_count))}</span>
        </div>
        <div className="mt-3 flex items-center">
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
              stage.status === "open" ? "bg-[#eaf7f0] text-[#21845f]" : "bg-card-2 text-muted"
            }`}
          >
            {t(stage.status === "open" ? "stage_open" : "stage_archived")}
          </span>
          <span className="ml-auto text-[11px] font-bold text-primary-strong">열어보기 ›</span>
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
        <p className="mt-0.5 text-[12.5px] text-muted">{t("stage_sub")}</p>
      </div>
      <Link
        href="/hearts"
        className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-primary-soft px-3.5 py-3 active:scale-[0.99]"
      >
        <Trophy className="h-4 w-4 text-primary-strong" />
        <span className="text-[13.5px] font-bold text-primary-strong">{t("hall_entry")}</span>
      </Link>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[21/12] animate-pulse rounded-2xl border border-border bg-black/[0.05]" />
          ))}
        </div>
      ) : stages.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-14 text-center text-[13.5px] text-muted">
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
