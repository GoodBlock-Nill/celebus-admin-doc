"use client";

// 홈 스테이지 탭 — 관리자가 연 공연 스테이지 목록. 탭하면 해당 스테이지(공연별 영상 아카이브)로 이동.
import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Trophy, BadgeCheck } from "lucide-react";
import { CharmIcon } from "./CharmIcon";
import { sb } from "@/lib/supabase-browser";
import type { StagePublic } from "@/lib/types";
import { useLang } from "./LangProvider";
import StageView from "./StageView";

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
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-primary-soft via-primary-soft/60 to-transparent">
            <CharmIcon name="clapperboard" size={44} />
            <span className="text-[10.5px] font-semibold text-primary-strong/70">{t("thumb_no_image")}</span>
          </div>
        )}
        <div className="media-scrim pointer-events-none absolute inset-0" />
      </div>
      <div className="p-3.5">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-fg">{stage.title}</h3>
        {stage.description && (
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted">{stage.description}</p>
        )}
        <div className="mt-1.5 flex items-center gap-1 text-[11.5px] text-muted">
          {stage.event_date && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> {stage.event_date}
            </span>
          )}
          {stage.event_date && <span>·</span>}
          <span className="tabular-nums">{t("stage_posts_n").replace("{n}", String(stage.post_count))}</span>
        </div>
        <div className="mt-3 flex items-center">
          {stage.is_official ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold text-primary-strong">
              <BadgeCheck className="h-3 w-3" /> {t("archive_official")} · {t("archive_view_only")}
            </span>
          ) : (
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                stage.status === "open" ? "bg-[#eaf7f0] text-[#21845f]" : "bg-card-2 text-muted"
              }`}
            >
              {t(stage.status === "open" ? "stage_open" : "stage_archived")}
            </span>
          )}
          <span className="ml-auto text-[11px] font-bold text-primary-strong">{t("stage_open_cta")} ›</span>
        </div>
      </div>
    </Link>
  );
}

type ArchiveTab = "d10v" | "v01d";

export default function StageList() {
  const { t } = useLang();
  const [stages, setStages] = useState<StagePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ArchiveTab>("d10v");

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

  // D10V = 팬 업로드 아카이브(카드 목록) / V01D = 공식 아카이브(영상 직접 노출)
  const fanStages = stages.filter((s) => !s.is_official);
  const officialStage = stages.find((s) => s.is_official);
  const TABS: { key: ArchiveTab; label: string }[] = [
    { key: "d10v", label: t("home_archive_title") },
    { key: "v01d", label: t("home_official_title") },
  ];

  return (
    <div>
      <h1 className="mb-3 text-[19px] font-bold text-fg">{t("stage_tab")}</h1>

      {/* D10V · V01D 탭 — 폴더 참(선택=열림/비선택=닫힘) + 브랜드 톤 */}
      <div className="mb-3 flex gap-2">
        {TABS.map((tb) => {
          const on = tab === tb.key;
          return (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-[13.5px] font-extrabold transition-all active:scale-[0.98] ${
                on
                  ? "border-transparent bg-primary-soft text-primary-strong shadow-[0_3px_12px_-3px_rgba(108,77,230,0.45)]"
                  : "border-border bg-card text-muted"
              }`}
            >
              <CharmIcon
                name={on ? "folder-active" : "folder-inactive"}
                size={28}
                className={on ? "" : "opacity-60 grayscale"}
              />
              {tb.label}
            </button>
          );
        })}
      </div>
      <p className="mb-4 px-0.5 text-[12.5px] text-muted">{t(tab === "v01d" ? "home_official_sub" : "home_archive_sub")}</p>

      {/* 명예의 전당 — 팬 하트 기반이라 D10V 탭에만 */}
      {tab === "d10v" && (
        <Link
          href="/hearts"
          className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-primary-soft px-3.5 py-3 active:scale-[0.99]"
        >
          <Trophy className="h-4 w-4 text-primary-strong" />
          <span className="text-[13.5px] font-bold text-primary-strong">{t("hall_entry")}</span>
        </Link>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[21/12] animate-pulse rounded-2xl border border-border bg-black/[0.05]" />
          ))}
        </div>
      ) : tab === "v01d" ? (
        // V01D 탭 — 공식 아카이브 안의 영상들을 카테고리 필터와 함께 바로 노출
        officialStage ? (
          <StageView stageId={officialStage.id} hideHeader />
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-14 text-center text-[13.5px] text-muted">
            <CharmIcon name="clapperboard" size={52} />
            {t("stage_list_empty")}
          </div>
        )
      ) : fanStages.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-14 text-center text-[13.5px] text-muted">
          <CharmIcon name="clapperboard" size={52} />
          {t("stage_list_empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {fanStages.map((s) => (
            <StageCardItem key={s.id} stage={s} />
          ))}
        </div>
      )}
    </div>
  );
}
