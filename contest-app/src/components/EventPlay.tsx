"use client";

// 월드컵 이벤트 — 이상형월드컵 형식: 무작위 개인 대진 → 1:1 대결 → 나의 우승작 → 집계 반영.
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ChevronLeft, Play, Check, Gift } from "lucide-react";
import { CharmIcon, PlayBadge } from "./CharmIcon";
import { sb } from "@/lib/supabase-browser";
import type { StageEventPublic, StagePostPublic } from "@/lib/types";
import { stagePostAsEntry } from "@/lib/types";
import EntryEmbed from "./EntryEmbed";
import WorldcupStandings from "./WorldcupStandings";
import { useLang } from "./LangProvider";
import { useSession } from "./SessionProvider";

type Pick = { w: string; l: string };
type Phase = "intro" | "playing" | "done";

function bracketSize(n: number): number {
  if (n >= 16) return 16;
  if (n >= 8) return 8;
  if (n >= 4) return 4;
  return n >= 2 ? 2 : 0;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 대결 카드 한 쪽 — ▶로 영상을 재생해 본 뒤(재생 ≠ 투표), '이 영상 선택'으로 투표
function MatchTile({ post, onPick, pickLabel }: { post: StagePostPublic; onPick: () => void; pickLabel: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative overflow-hidden bg-black">
        {playing ? (
          <EntryEmbed entry={stagePostAsEntry(post)} />
        ) : (
          <button onClick={() => setPlaying(true)} aria-label={post.title} className="relative block w-full active:opacity-95">
            {post.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.thumbnail_url} alt="" className="aspect-video w-full object-cover" />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-primary-soft to-card-2 text-subtle">🎬</div>
            )}
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
              <PlayBadge size="lg" />
            </span>
          </button>
        )}
      </div>
      <div className="px-3 pt-2 text-left">
        <div className="truncate text-[13px] font-bold text-fg">{post.title}</div>
        <div className="truncate text-[11px] text-subtle">@{post.handle}</div>
      </div>
      <button
        onClick={onPick}
        className="m-3 mt-2 flex w-[calc(100%-1.5rem)] items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-[13px] font-bold text-white active:scale-[0.99]"
      >
        <Check className="h-4 w-4" /> {pickLabel}
      </button>
    </div>
  );
}

export default function EventPlay({ eventId }: { eventId: string }) {
  const { t } = useLang();
  const { requireLogin } = useSession();
  const [event, setEvent] = useState<StageEventPublic | null>(null);
  const [pool, setPool] = useState<StagePostPublic[]>([]);
  const [phase, setPhase] = useState<Phase>("intro");
  const [showStandings, setShowStandings] = useState(false);
  // 대진 상태
  const [current, setCurrent] = useState<StagePostPublic[]>([]); // 현재 라운드 참가자
  const [next, setNext] = useState<StagePostPublic[]>([]);       // 다음 라운드 진출자
  const [matchIdx, setMatchIdx] = useState(0);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [winner, setWinner] = useState<StagePostPublic | null>(null);
  const [counted, setCounted] = useState<boolean | null>(null);
  const [votes, setVotes] = useState<{ used: number; cap: number } | null>(null); // 잔여 투표

  const loadVotes = useCallback(async () => {
    try {
      const j = await fetch(`/api/stage/events/${eventId}/run`).then((r) => r.json());
      setVotes({ used: j.counted_runs ?? 0, cap: j.cap ?? 3 });
    } catch {
      /* 잔여 투표는 보조 정보 */
    }
  }, [eventId]);

  useEffect(() => {
    (async () => {
      const { data: ev } = await sb.from("stage_events_public").select("*").eq("id", eventId).maybeSingle();
      if (!ev) return;
      const e = ev as StageEventPublic;
      setEvent(e);
      const { data: ps } = await sb.from("stage_posts_public").select("*").eq("stage_id", e.stage_id).limit(200);
      setPool((ps ?? []) as StagePostPublic[]);
      if (e.status === "announced") setShowStandings(true);
    })();
    void loadVotes();
  }, [eventId, loadVotes]);

  const votesLabel = votes
    ? votes.used >= votes.cap
      ? t("ev_votes_done").replace("{cap}", String(votes.cap))
      : t("ev_votes").replace("{n}", String(votes.used)).replace("{cap}", String(votes.cap))
    : "";

  const size = useMemo(() => bracketSize(pool.length), [pool.length]);

  function start() {
    if (size < 2) return;
    if (!requireLogin(() => start())) return; // 월드컵 투표는 집계에 영향 → 로그인 필수

    const entrants = shuffle(pool).slice(0, size);
    setCurrent(entrants);
    setNext([]);
    setMatchIdx(0);
    setPicks([]);
    setWinner(null);
    setCounted(null);
    setPhase("playing");
  }

  async function pick(winnerPost: StagePostPublic, loserPost: StagePostPublic) {
    const newPicks = [...picks, { w: winnerPost.id, l: loserPost.id }];
    const newNext = [...next, winnerPost];
    const nextMatch = matchIdx + 1;
    const matchesInRound = Math.floor(current.length / 2);

    if (nextMatch < matchesInRound) {
      setPicks(newPicks);
      setNext(newNext);
      setMatchIdx(nextMatch);
      return;
    }
    // 라운드 종료
    if (newNext.length === 1) {
      setPicks(newPicks);
      setWinner(winnerPost);
      setPhase("done");
      try {
        const res = await fetch(`/api/stage/events/${eventId}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ picks: newPicks, winner: winnerPost.id }),
        });
        const j = await res.json().catch(() => ({}));
        if (res.ok) {
          setCounted(!!j.counted);
          void loadVotes(); // 집계 후 잔여 투표 갱신
        } else toast(t("err_server"));
      } catch {
        toast(t("err_server"));
      }
      return;
    }
    setPicks(newPicks);
    setCurrent(newNext);
    setNext([]);
    setMatchIdx(0);
  }

  if (!event) return <div className="h-40 animate-pulse rounded-2xl border border-border bg-card-2" />;

  const a = current[matchIdx * 2];
  const b = current[matchIdx * 2 + 1];
  const roundSize = current.length;

  return (
    <div>
      <Link href="/events" className="mb-2 inline-flex min-h-11 items-center gap-1 text-[13px] font-bold text-muted">
        <ChevronLeft className="h-4 w-4" /> {t("event_tab")}
      </Link>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <CharmIcon name="trophy" size={26} className="shrink-0" />
          <h1 className="min-w-0 flex-1 text-[19px] font-bold text-fg">{event.title}</h1>
          <span
            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-extrabold ${
              event.reward_type === "reward" ? "bg-amber-100 text-amber-700" : "bg-card-2 text-muted"
            }`}
          >
            {event.reward_type === "reward" && <Gift className="h-3 w-3" />}
            {t(event.reward_type === "reward" ? "ev_type_reward" : "ev_type_popularity")}
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-muted">{event.stage_title}</p>
        {/* 보상형 — 우승 보상 안내 */}
        {event.reward_type === "reward" && event.reward && (
          <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <Gift className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[12.5px] leading-relaxed text-amber-800">
              <b>{t("ev_reward_label")}</b> · {event.reward}
            </p>
          </div>
        )}
      </div>

      {/* 결과 발표 배너 */}
      {event.status === "announced" && event.awards && (
        <div className="mb-4 space-y-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="text-[14px] font-bold text-amber-600">{t("ev_results")} 🏆</div>
          {event.awards.fan && (
            <div className="text-[13px] text-fg">
              <b className="text-primary-strong">{t("ev_award_fan")}</b> — {event.awards.fan.title} <span className="text-subtle">@{event.awards.fan.handle}</span>
            </div>
          )}
          {event.awards.artist && (
            <div className="text-[13px] text-fg">
              <b className="text-primary-strong">{t("ev_award_artist")}</b> — {event.awards.artist.title} <span className="text-subtle">@{event.awards.artist.handle}</span>
            </div>
          )}
          {event.awards.uploader && (
            <div className="text-[13px] text-fg">
              <b className="text-primary-strong">{t("ev_award_uploader")}</b> — @{event.awards.uploader.handle}{" "}
              <span className="text-subtle">({t("ev_award_uploader_days").replace("{n}", String(event.awards.uploader.days))})</span>
            </div>
          )}
        </div>
      )}

      {/* 인트로 */}
      {phase === "intro" && (
        <div className="space-y-3">
          {event.description && <p className="text-[13.5px] leading-relaxed text-muted">{event.description}</p>}
          {event.status === "open" &&
            (size >= 2 ? (
              <button onClick={start} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-[15px] font-bold text-white active:scale-[0.99]">
                <Play className="h-4 w-4" /> {t("ev_play")} ({t("ev_round_of").replace("{n}", String(size))})
              </button>
            ) : (
              <p className="rounded-xl border border-border bg-card-2 px-3 py-3 text-center text-[13px] text-muted">{t("ev_not_enough")}</p>
            ))}
          {event.status === "open" && votesLabel && (
            <div className="text-center">
              <p className="text-[11.5px] font-semibold text-muted">{votesLabel}</p>
              <p className="mt-0.5 text-[11px] text-muted">{t("ev_votes_help").replace("{cap}", String(votes?.cap ?? 3))}</p>
            </div>
          )}
          <button
            onClick={() => setShowStandings((s) => !s)}
            className="w-full rounded-full border border-border bg-card-2 py-3 text-[13.5px] font-bold text-fg"
          >
            {t("ev_standings")}
          </button>
          {showStandings && <WorldcupStandings eventId={eventId} eventStatus={event.status} pool={pool} />}
        </div>
      )}

      {/* 대결 */}
      {phase === "playing" && a && b && (
        <div>
          <div className="mb-1 flex items-center justify-between text-[12.5px] font-bold">
            <span className="rounded-full bg-primary-soft px-3 py-1 text-primary-strong">{t("ev_round_of").replace("{n}", String(roundSize))}</span>
            <span className="text-muted">{matchIdx + 1} / {Math.floor(roundSize / 2)}</span>
          </div>
          {votesLabel && <p className="mb-2 text-center text-[11px] font-semibold text-subtle">{votesLabel}</p>}
          <p className="text-center text-[14px] font-bold text-fg">{t("ev_pick_one")}</p>
          <p className="mb-3 text-center text-[11.5px] text-muted">{t("ev_watch_hint")}</p>
          <div className="space-y-3">
            <MatchTile post={a} onPick={() => void pick(a, b)} pickLabel={t("ev_pick_this")} />
            <div className="text-center text-[13px] font-black text-subtle">VS</div>
            <MatchTile post={b} onPick={() => void pick(b, a)} pickLabel={t("ev_pick_this")} />
          </div>
        </div>
      )}

      {/* 결과 */}
      {phase === "done" && winner && (
        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-primary bg-primary-soft p-4 text-center shadow-sm">
            <div className="text-[14px] font-bold text-primary-strong">{t("ev_my_winner")}</div>
            {winner.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={winner.thumbnail_url} alt="" className="mt-2 aspect-video w-full rounded-xl object-cover" />
            )}
            <div className="mt-2 text-[15px] font-bold text-fg">{winner.title}</div>
            <div className="text-[12px] text-subtle">@{winner.handle}</div>
            {counted != null && (
              <p className={`mt-2 text-[12px] font-bold ${counted ? "text-primary-strong" : "text-muted"}`}>
                {t(counted ? "ev_counted" : "ev_not_counted")}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={start} className="flex-1 rounded-full bg-primary py-3 text-[14px] font-bold text-white">{t("ev_play_again")}</button>
            <button
              onClick={() => { setPhase("intro"); setShowStandings(true); }}
              className="flex-1 rounded-full border border-border bg-card-2 py-3 text-[14px] font-bold text-fg"
            >
              {t("ev_standings")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
