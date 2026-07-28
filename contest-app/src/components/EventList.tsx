"use client";

// 이벤트 탭 — 진행 중·발표된 월드컵 이벤트 목록.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, CalendarDays } from "lucide-react";
import { sb } from "@/lib/supabase-browser";
import type { StageEventPublic } from "@/lib/types";
import { useLang } from "./LangProvider";

export default function EventList() {
  const { t } = useLang();
  const [events, setEvents] = useState<StageEventPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("stage_events_public").select("*").order("created_at", { ascending: false });
      setEvents((data ?? []) as StageEventPublic[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-[19px] font-bold text-fg">{t("ev_list_title")}</h1>
        <p className="mt-0.5 text-[12.5px] text-fg/50">{t("ev_list_sub")}</p>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.04] px-4 py-14 text-center text-[13.5px] text-fg/50 ring-1 ring-white/10">
          {t("ev_list_empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <Link
              key={e.id}
              href={`/event/${e.id}`}
              className="block rounded-2xl bg-gradient-to-br from-primary/15 via-white/[0.04] to-transparent p-4 ring-1 ring-primary/25 transition-transform active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 shrink-0 text-primary-400" />
                <h3 className="min-w-0 flex-1 truncate text-[15px] font-bold text-fg">{e.title}</h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                    e.status === "open" ? "bg-primary/20 text-primary-400" : "bg-[#f5c451]/20 text-[#f5c451]"
                  }`}
                >
                  {t(e.status === "open" ? "ev_status_open" : "ev_status_announced")}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-fg/50">{e.stage_title}</p>
              {e.description && <p className="mt-1 line-clamp-2 text-[12.5px] text-fg/60">{e.description}</p>}
              {e.ends_at && (
                <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-fg/45">
                  <CalendarDays className="h-3.5 w-3.5" /> ~{e.ends_at.slice(0, 10)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
