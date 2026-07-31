"use client";

// 독립 랭킹 화면 — 특정 토너먼트의 순위(포디움 + 지표)를 대회 상세/플레이와 분리해 단독 표시.
// 랭킹 탭 → 대회 클릭 시 진입. 플레이·시작 CTA 없이 순위 확인에만 집중.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CharmIcon } from "./CharmIcon";
import { sb } from "@/lib/supabase-browser";
import type { StageEventPublic, StagePostPublic } from "@/lib/types";
import { localizeStageText, localizeTitle } from "@/lib/localize";
import WorldcupStandings from "./WorldcupStandings";
import { useLang } from "./LangProvider";

export default function TournamentRanking({ eventId }: { eventId: string }) {
  const { t, lang } = useLang();
  const [event, setEvent] = useState<StageEventPublic | null>(null);
  const [pool, setPool] = useState<StagePostPublic[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: ev } = await sb.from("stage_events_public").select("*").eq("id", eventId).maybeSingle();
      if (!ev) {
        setNotFound(true);
        return;
      }
      const e = ev as StageEventPublic;
      setEvent(e);
      let q = sb.from("stage_posts_public").select("*").eq("stage_id", e.stage_id).limit(200);
      if (e.category) q = q.eq("category", e.category);
      const { data: ps } = await q;
      setPool((ps ?? []) as StagePostPublic[]);
    })();
  }, [eventId]);

  if (notFound) {
    return <p className="rounded-2xl border border-border bg-card px-4 py-14 text-center text-[13.5px] text-muted">{t("stage_not_found")}</p>;
  }
  if (!event) return <div className="h-40 animate-pulse rounded-2xl border border-border bg-card-2" />;

  const { title } = localizeStageText(event, lang);
  const stageTitle = localizeTitle(event.stage_title, event.stage_i18n, lang);

  return (
    <div>
      <Link href="/events?tab=ranking" className="mb-2 inline-flex min-h-11 items-center gap-1 text-[13px] font-bold text-muted">
        <ChevronLeft className="h-4 w-4" /> {t("rank_tab_ranking")}
      </Link>

      {/* 헤더 */}
      <div className="mb-1 flex items-center gap-2">
        <CharmIcon name="trophy" size={26} className="shrink-0" />
        <h1 className="min-w-0 flex-1 text-[19px] font-bold leading-tight text-fg">{title}</h1>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-extrabold ${event.stage_is_official ? "bg-primary-soft text-primary-strong" : "bg-[#eaf7f0] text-[#21845f]"}`}>
          {t(event.stage_is_official ? "ev_source_official" : "ev_source_fan")}
          {event.stage_is_official && event.category ? ` · ${t(`cat_${event.category}`)}` : ""}
        </span>
        <span className="rounded-full bg-card-2 px-2 py-0.5 text-[10.5px] font-bold text-muted">
          {t(event.status === "open" ? "ev_status_open" : "ev_status_announced")}
        </span>
        <span className="text-[12px] text-muted">{stageTitle}</span>
      </div>

      {/* 순위 (포디움 + 지표) */}
      <WorldcupStandings eventId={eventId} eventStatus={event.status} pool={pool} />

      {/* 대회 상세/플레이로 이동 */}
      <Link href={`/event/${eventId}`} className="mt-4 block w-full rounded-full border border-border bg-card-2 py-3 text-center text-[13.5px] font-bold text-fg active:scale-[0.99]">
        {event.status === "open" ? t("ev_cta_join") : t("ev_cta_result")}
      </Link>
    </div>
  );
}
