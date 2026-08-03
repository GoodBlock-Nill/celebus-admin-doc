"use client";

// 월드컵 랭킹 — 우승 비율(1순위)·1:1 승률(2순위). 멤버는 여기서 아티스트 픽 선택.
// 멤버 픽은 항상 비공개 — 팬에게 영상별 멤버 픽 수를 노출하지 않는다(ix 편애 논란 차단).
// 아티스트인기상 수상작(단일)만 발표 결과에 익명으로 표시된다.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
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
  const [isMemberMe, setIsMemberMe] = useState(false);
  const [myPick, setMyPick] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await sb.from("worldcup_stats_public").select("*").eq("event_id", eventId);
    const rows = ((data ?? []) as WorldcupStatPublic[]).sort((x, y) => y.win_rate - x.win_rate || y.match_rate - x.match_rate);
    setStats(rows);
  }, [eventId]);

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
  // 최대 100위까지만 표시 (stats는 win_rate 내림차순 정렬됨)
  const rows = stats.filter((s) => posts.has(s.post_id)).slice(0, 100);

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card px-3 py-4 text-center text-[12.5px] text-muted">
        {t("rank_empty_soon")}
      </p>
    );
  }

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const pickBtn = (postId: string) =>
    isMemberMe && eventStatus === "open" ? (
      <button
        onClick={() => void setPick(postId)}
        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${myPick === postId ? "bg-primary text-white" : "border border-border bg-card-2 text-muted"}`}
      >
        {t(myPick === postId ? "ev_member_picked" : "ev_member_pick")}
      </button>
    ) : null;

  // 포디움 순서: 2위·1위·3위 (1위 가운데·강조)
  const podiumOrder = [top3[1], top3[0], top3[2]].map((s, idx) => ({ s, place: [2, 1, 3][idx] })).filter((x) => x.s);

  return (
    <div className="space-y-3">
      <p className="px-1 text-[11px] leading-relaxed text-subtle">{t("ev_rate_help")}</p>

      {/* Top 3 포디움 */}
      <div className="grid grid-cols-3 items-end gap-2">
        {podiumOrder.map(({ s, place }) => {
          const p = posts.get(s.post_id)!;
          const top = place === 1;
          const medal = place === 1 ? "bg-gold text-black" : place === 2 ? "bg-silver text-black" : "bg-bronze text-white";
          return (
            <Link key={s.post_id} href={`/video/${p.id}?list=stage:${p.stage_id}`} className={`flex flex-col items-center rounded-2xl border bg-card p-2 shadow-sm active:scale-[0.98] ${top ? "border-primary ring-1 ring-primary/30" : "border-border"}`}>
              <span className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-black ${medal}`} aria-label={`${place}위`}>{place}</span>
              <div className={`relative w-full overflow-hidden rounded-lg ${top ? "aspect-square" : "aspect-video"}`}>
                {p.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnail_url} alt={`${p.title} @${p.handle}`} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary-soft to-card-2" />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90"><Play className="h-2.5 w-2.5 fill-primary text-primary" /></span>
                </span>
              </div>
              <div className={`mt-1.5 w-full truncate text-center font-bold text-fg ${top ? "text-[12px]" : "text-[11px]"}`}>{p.title}</div>
              <div className="mt-0.5 text-[11px] font-black text-primary-strong tabular-nums">{t("ev_win_rate")} {(s.win_rate * 100).toFixed(0)}%</div>
              <div className="mt-1">{pickBtn(s.post_id)}</div>
            </Link>
          );
        })}
      </div>

      {/* 4위 이하 — 두 지표 MetricBar */}
      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((s, i) => {
            const p = posts.get(s.post_id)!;
            const matches = s.match_wins + s.match_losses;
            return (
              <div key={s.post_id} className="flex items-start gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm">
                <span className="mt-0.5 w-5 shrink-0 text-center text-[13px] font-black text-subtle tabular-nums">{i + 4}</span>
                <Link href={`/video/${p.id}?list=stage:${p.stage_id}`} className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg active:opacity-90">
                  {p.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail_url} alt={`${p.title} @${p.handle}`} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary-soft to-card-2" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90"><Play className="h-2.5 w-2.5 fill-primary text-primary" /></span></span>
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-[12.5px] font-bold text-fg">{p.title}</div>
                    {pickBtn(s.post_id)}
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-2.5">
                    <MetricBar label={t("ev_win_rate")} pct={s.win_rate} sample={`${s.final_wins}/${s.runs_appeared}`} bar="bg-primary" />
                    <MetricBar label={t("ev_match_rate")} pct={s.match_rate} sample={`${s.match_wins}/${matches || 0}`} bar="bg-[#A855E8]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 지표 막대 — 시각 막대 + 텍스트 수치 + 표본(막대만으로 전달하지 않음)
function MetricBar({ label, pct, sample, bar }: { label: string; pct: number; sample: string; bar: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[9.5px] font-bold text-subtle">{label}</span>
        <span className="text-[11px] font-black text-fg tabular-nums">{(pct * 100).toFixed(0)}%</span>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-card-2">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(3, pct * 100)}%` }} />
      </div>
      <div className="mt-0.5 text-[9px] text-subtle tabular-nums">{sample}</div>
    </div>
  );
}
