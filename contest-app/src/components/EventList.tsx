"use client";

// 토너먼트 목록 — 대회를 "콘텐츠 이벤트"로 보이게: 참가작 콜라주 커버 + 상태 오버레이 + 정보 위계 + CTA.
// (배지 남발 대신 상태 pill 1 + 출처·유형·참여수 metadata + 보상 compact row)
import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, Users } from "lucide-react";
import { CharmIcon } from "./CharmIcon";
import { sb } from "@/lib/supabase-browser";
import type { StageEventPublic } from "@/lib/types";
import { useLang } from "./LangProvider";
import { isLaunchPreview } from "@/lib/launchPreview";

type Enriched = { event: StageEventPublic; thumbs: string[]; entryCount: number; participants: number };

function CoverCollage({ coverUrl, thumbs, official }: { coverUrl: string | null; thumbs: string[]; official: boolean }) {
  // 관리자 지정 대표 커버 우선
  if (coverUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />;
  }
  if (thumbs.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-soft to-primary-soft/30">
        <CharmIcon name="trophy" size={44} />
      </div>
    );
  }
  // 공식=대표 1장 Hero / 팬=2~3장 콜라주
  if (official || thumbs.length === 1) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={thumbs[0]} alt="" loading="lazy" className="h-full w-full object-cover" />;
  }
  const cols = thumbs.slice(0, 3);
  return (
    <div className={`grid h-full w-full gap-[2px] ${cols.length >= 3 ? "grid-cols-[1.4fr_1fr]" : "grid-cols-2"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cols[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
      {cols.length >= 3 ? (
        <div className="grid grid-rows-2 gap-[2px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cols[1]} alt="" loading="lazy" className="h-full w-full object-cover" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cols[2]} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cols[1]} alt="" loading="lazy" className="h-full w-full object-cover" />
      )}
    </div>
  );
}

export default function EventList() {
  const { t } = useLang();
  const [rows, setRows] = useState<Enriched[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const preview = isLaunchPreview();
      if (preview) {
        setRows([]);
        setLoading(false);
        return;
      }
      const { data: evs } = await sb.from("stage_events_public").select("*").order("created_at", { ascending: false });
      const events = (evs ?? []) as StageEventPublic[];
      const { data: parts } = await sb.from("event_participants_public").select("*");
      const partMap = new Map<string, number>();
      for (const p of parts ?? []) partMap.set(p.event_id as string, (p.participants as number) ?? 0);

      // 대회별 커버 썸네일(3) + 참가작 수 — 카테고리 지정 시 해당 카테고리만
      const enriched = await Promise.all(
        events.map(async (event) => {
          let q = sb
            .from("stage_posts_public")
            .select("thumbnail_url", { count: "exact" })
            .eq("stage_id", event.stage_id)
            .not("thumbnail_url", "is", null)
            .order("created_at", { ascending: false })
            .limit(3);
          if (event.category) q = q.eq("category", event.category);
          const { data: ps, count } = await q;
          return {
            event,
            thumbs: (ps ?? []).map((x) => x.thumbnail_url as string).filter(Boolean),
            entryCount: count ?? 0,
            participants: partMap.get(event.id) ?? 0,
          } as Enriched;
        }),
      );
      setRows(enriched);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-[16px] font-bold text-fg">{t("ev_list_title")}</h2>
        <p className="mt-0.5 text-[12px] text-muted">{t("ev_list_sub")}</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="aspect-[16/9] w-full animate-pulse bg-card-2" />
              <div className="h-16 animate-pulse bg-card" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-12 text-center text-[13px] text-muted">
          <CharmIcon name="trophy" size={52} />
          {t("ev_list_empty")}
        </div>
      ) : (
        <div className="space-y-3.5">
          {rows.map(({ event: e, thumbs, entryCount, participants }) => {
            const announced = e.status === "announced";
            const meta = [
              t(e.stage_is_official ? "ev_source_official" : "ev_source_fan") + (e.stage_is_official && e.category ? ` · ${t(`cat_${e.category}`)}` : ""),
              t(e.reward_type === "reward" ? "ev_type_reward" : "ev_type_popularity"),
            ];
            return (
              <Link key={e.id} href={`/event/${e.id}`} className="block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-transform active:scale-[0.99]">
                {/* 커버 + 상태 오버레이 */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-card-2">
                  <CoverCollage coverUrl={e.cover_url} thumbs={thumbs} official={e.stage_is_official} />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <span className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold shadow-sm ${announced ? "bg-amber-100 text-amber-800" : "bg-white/95 text-primary-strong"}`}>
                    {t(announced ? "ev_status_announced" : "ev_status_open")}
                  </span>
                  {participants > 0 && (
                    <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[10.5px] font-bold text-white backdrop-blur-sm">
                      <Users className="h-3 w-3" /> {t("ev_participants_n").replace("{n}", participants.toLocaleString())}
                    </span>
                  )}
                </div>
                {/* 본문 */}
                <div className="p-3.5">
                  <div className="text-[11.5px] font-bold text-muted">{meta.join(" · ")}</div>
                  <h3 className="mt-0.5 line-clamp-2 text-[15.5px] font-bold leading-snug text-fg">{e.title}</h3>
                  {e.description && <p className="mt-1 line-clamp-1 text-[12px] text-muted">{e.description}</p>}
                  {e.reward_type === "reward" && e.reward && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-semibold text-amber-700">
                      <Gift className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{e.reward}</span>
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11.5px] text-subtle">{t("ev_entries_n").replace("{n}", String(entryCount))}</span>
                    <span className={`rounded-full px-3.5 py-1.5 text-[12px] font-extrabold ${announced ? "bg-primary-soft text-primary-strong" : "brand-gradient text-white shadow-sm"}`}>
                      {t(announced ? "ev_cta_result" : "ev_cta_join")}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
