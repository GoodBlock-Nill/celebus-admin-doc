"use client";

// 월드컵 랭킹 — 우승 비율(1순위)·1:1 승률(2순위). 멤버는 여기서 아티스트 픽 선택(비공개, 발표 시 공개).
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { sb } from "@/lib/supabase-browser";
import type { StagePostPublic, WorldcupStatPublic } from "@/lib/types";
import { useLang } from "./LangProvider";

export default function WorldcupStandings({
  eventId,
  eventStatus,
  pool,
}: {
  eventId: string;
  eventStatus: "open" | "announced";
  pool: StagePostPublic[];
}) {
  const { t } = useLang();
  const [stats, setStats] = useState<WorldcupStatPublic[]>([]);
  const [memberPicks, setMemberPicks] = useState<Map<string, number>>(new Map());
  const [isMemberMe, setIsMemberMe] = useState(false);
  const [myPick, setMyPick] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await sb.from("worldcup_stats_public").select("*").eq("event_id", eventId);
    const rows = ((data ?? []) as WorldcupStatPublic[]).sort((x, y) => y.win_rate - x.win_rate || y.match_rate - x.match_rate);
    setStats(rows);
    if (eventStatus === "announced") {
      const { data: picks } = await sb.from("member_event_picks_public").select("post_id").eq("event_id", eventId);
      const m = new Map<string, number>();
      for (const p of picks ?? []) m.set(p.post_id as string, (m.get(p.post_id as string) ?? 0) + 1);
      setMemberPicks(m);
    }
  }, [eventId, eventStatus]);

  useEffect(() => {
    void load();
    fetch("/api/stage/me").then((r) => r.json()).then((j) => setIsMemberMe(!!j.member)).catch(() => {});
    fetch(`/api/stage/events/${eventId}/pick`).then((r) => r.json()).then((j) => setMyPick(j.pick ?? null)).catch(() => {});
  }, [load, eventId]);

  async function setPick(postId: string) {
    const res = await fetch(`/api/stage/events/${eventId}/pick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId }),
    }).catch(() => null);
    if (res?.ok) setMyPick(postId);
    else toast(t("err_server"));
  }

  const posts = new Map(pool.map((p) => [p.id, p]));
  const rows = stats.filter((s) => posts.has(s.post_id));

  if (rows.length === 0) {
    return <p className="rounded-xl bg-white/5 px-3 py-4 text-center text-[12.5px] text-fg/50">{t("ev_list_empty")}</p>;
  }

  return (
    <div className="space-y-1.5">
      {rows.map((s, i) => {
        const p = posts.get(s.post_id)!;
        const picks = memberPicks.get(s.post_id) ?? 0;
        return (
          <div key={s.post_id} className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/10">
            <span className={`w-6 shrink-0 text-center text-[14px] font-black ${i < 3 ? "text-primary-400" : "text-fg/40"}`}>{i + 1}</span>
            {p.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.thumbnail_url} alt="" className="h-10 w-16 shrink-0 rounded-lg object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-bold text-fg">{p.title}</div>
              <div className="text-[10.5px] text-fg/45">
                {t("ev_win_rate")} {(s.win_rate * 100).toFixed(0)}% · {t("ev_match_rate")} {(s.match_rate * 100).toFixed(0)}%
                {picks > 0 && <span className="ml-1 text-primary-400">· {t("ev_picks_n").replace("{n}", String(picks))}</span>}
              </div>
            </div>
            {isMemberMe && eventStatus === "open" && (
              <button
                onClick={() => void setPick(s.post_id)}
                className={`shrink-0 rounded-full px-2.5 py-1.5 text-[10.5px] font-bold ${
                  myPick === s.post_id ? "bg-primary text-white" : "bg-white/8 text-fg/60"
                }`}
              >
                {t(myPick === s.post_id ? "ev_member_picked" : "ev_member_pick")}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
