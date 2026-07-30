"use client";

// 이벤트 탭 — 두 영역 분리(GPT EVT-01): ① 월드컵 이벤트(투표) ② V01D Pick(멤버 하트 영상).
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, CalendarDays, Gift } from "lucide-react";
import { CharmIcon } from "./CharmIcon";
import { sb } from "@/lib/supabase-browser";
import type { StageEventPublic } from "@/lib/types";
import { useLang } from "./LangProvider";
import { isLaunchPreview } from "@/lib/launchPreview";

export default function EventList() {
  const { t } = useLang();
  const [events, setEvents] = useState<StageEventPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // 배포초기 프리뷰: 오픈 첫날엔 이벤트 없음(팬 활동 전)
      const preview = isLaunchPreview();
      const evRes = preview
        ? { data: [] }
        : await sb.from("stage_events_public").select("*").order("created_at", { ascending: false });
      setEvents((evRes.data ?? []) as StageEventPublic[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-7">
      {/* ① 월드컵 이벤트 (투표) */}
      <section>
        <div className="mb-3">
          <h2 className="text-[16px] font-bold text-fg">{t("ev_list_title")}</h2>
          <p className="mt-0.5 text-[12px] text-muted">{t("ev_list_sub")}</p>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card-2" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-12 text-center text-[13px] text-muted">
            <CharmIcon name="trophy" size={52} />
            {t("ev_list_empty")}
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((e) => (
              <Link key={e.id} href={`/event/${e.id}`} className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition-transform active:scale-[0.99]">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 shrink-0 text-primary" />
                  <h3 className="min-w-0 flex-1 truncate text-[15px] font-bold text-fg">{e.title}</h3>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${e.status === "open" ? "bg-primary-soft text-primary-strong" : "bg-amber-50 text-amber-700"}`}>
                    {t(e.status === "open" ? "ev_status_open" : "ev_status_announced")}
                  </span>
                </div>
                {/* 유형 배지 — 보상형(골드) / 인기투표형(뉴트럴) */}
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-extrabold ${
                      e.reward_type === "reward" ? "bg-amber-100 text-amber-700" : "bg-card-2 text-muted"
                    }`}
                  >
                    {e.reward_type === "reward" && <Gift className="h-3 w-3" />}
                    {t(e.reward_type === "reward" ? "ev_type_reward" : "ev_type_popularity")}
                  </span>
                  <span className="truncate text-[12px] text-muted">{e.stage_title}</span>
                </div>
                {e.description && <p className="mt-1 line-clamp-2 text-[12.5px] text-muted">{e.description}</p>}
                {e.reward_type === "reward" && e.reward && (
                  <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11.5px] font-semibold text-amber-800">
                    <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span><b>{t("ev_reward_label")}</b> · {e.reward}</span>
                  </p>
                )}
                {e.ends_at && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-subtle">
                    <CalendarDays className="h-3.5 w-3.5" /> ~{e.ends_at.slice(0, 10)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
