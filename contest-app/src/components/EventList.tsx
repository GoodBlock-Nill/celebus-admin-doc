"use client";

// 이벤트 탭 — 두 영역 분리(GPT EVT-01): ① 월드컵 이벤트(투표) ② V01D Pick(멤버 하트 영상).
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, CalendarDays, Heart } from "lucide-react";
import { sb } from "@/lib/supabase-browser";
import type { MemberHeartPublic, StageEventPublic, StagePostPublic } from "@/lib/types";
import { useLang } from "./LangProvider";

export default function EventList() {
  const { t } = useLang();
  const [events, setEvents] = useState<StageEventPublic[]>([]);
  const [pick, setPick] = useState<{ post: StagePostPublic; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [evRes, heartsRes] = await Promise.all([
        sb.from("stage_events_public").select("*").order("created_at", { ascending: false }),
        sb.from("member_hearts_public").select("*"),
      ]);
      setEvents((evRes.data ?? []) as StageEventPublic[]);
      const counts = new Map<string, number>();
      for (const h of (heartsRes.data ?? []) as MemberHeartPublic[]) counts.set(h.post_id, (counts.get(h.post_id) ?? 0) + 1);
      const ids = [...counts.keys()];
      if (ids.length) {
        const { data: ps } = await sb.from("stage_posts_public").select("*").in("id", ids);
        setPick(
          ((ps ?? []) as StagePostPublic[])
            .map((p) => ({ post: p, count: counts.get(p.id) ?? 0 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6),
        );
      }
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
          <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center text-[13px] text-muted">{t("ev_list_empty")}</div>
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
                <p className="mt-1 text-[12px] text-muted">{e.stage_title}</p>
                {e.description && <p className="mt-1 line-clamp-2 text-[12.5px] text-muted">{e.description}</p>}
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

      {/* ② V01D Pick (멤버 하트 영상) — 실제 하트가 있을 때만 */}
      {pick.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-fg">{t("hall_title")}</h2>
              <p className="mt-0.5 text-[12px] text-muted">{t("hall_sub")}</p>
            </div>
            <Link href="/hearts" className="text-[12.5px] font-bold text-primary">
              {t("home_see_all")}
            </Link>
          </div>
          <div className="-mx-0.5 flex gap-2.5 overflow-x-auto px-0.5 pb-1">
            {pick.map(({ post, count }) => (
              <Link key={post.id} href={`/video/${post.id}?list=hearts`} className="w-[132px] shrink-0 active:scale-[0.98]">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border">
                  {post.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary-soft to-card-2" />
                  )}
                  <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    <Heart className="h-3 w-3 fill-primary-soft text-primary-soft" /> {count}
                  </span>
                </div>
                <strong className="mt-1.5 line-clamp-2 block text-[12px] font-bold leading-snug text-fg">{post.title}</strong>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
