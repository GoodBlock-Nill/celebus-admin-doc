"use client";

// 월드컵 이벤트 — 이상형월드컵 형식: 무작위 개인 대진 → 1:1 대결 → 나의 우승작 → 집계 반영.
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ChevronLeft, Play, Check, Gift, Share2 } from "lucide-react";
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
function MatchTile({ post, corner, onPick, pickLabel, playing, onPlay, pickState, selectedLabel, eliminatedLabel, locked }: {
  post: StagePostPublic; corner: "A" | "B"; onPick: () => void; pickLabel: string; playing: boolean; onPlay: () => void;
  pickState: "none" | "selected" | "eliminated"; selectedLabel: string; eliminatedLabel: string; locked: boolean;
}) {
  const selected = pickState === "selected";
  const eliminated = pickState === "eliminated";
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition-[transform,opacity,box-shadow] duration-200 will-change-transform ${
        selected ? "border-primary shadow-lg [transform:scale(1.02)]" : eliminated ? "border-border opacity-50 [transform:scale(0.96)]" : "border-border"
      } ${selected ? "ring-2 ring-primary" : ""}`}
      aria-label={selected ? selectedLabel : eliminated ? eliminatedLabel : undefined}
    >
      <div className="relative overflow-hidden bg-black">
        <span className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-[12px] font-black text-white backdrop-blur-sm">{corner}</span>
        {/* 선택/탈락 상태 라벨 (색상만이 아닌 텍스트+아이콘) */}
        {pickState !== "none" && (
          <span className={`absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${selected ? "bg-primary text-white" : "bg-black/60 text-white"}`}>
            {selected ? <><Check className="h-3 w-3" /> {selectedLabel}</> : eliminatedLabel}
          </span>
        )}
        {playing ? (
          <EntryEmbed entry={stagePostAsEntry(post)} />
        ) : (
          <button onClick={onPlay} disabled={locked} aria-label={post.title} className="relative block w-full active:opacity-95 disabled:opacity-100">
            {post.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.thumbnail_url} alt="" className="aspect-video w-full object-cover" />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-primary-soft to-card-2 text-subtle">🎬</div>
            )}
            {!eliminated && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
                <PlayBadge size="lg" />
              </span>
            )}
          </button>
        )}
      </div>
      <div className="px-3 pt-2 text-left">
        <div className="truncate text-[13px] font-bold text-fg">{post.title}</div>
        <div className="truncate text-[11px] text-subtle">@{post.handle}</div>
      </div>
      <button
        onClick={onPick}
        disabled={locked}
        className="m-3 mt-2 flex w-[calc(100%-1.5rem)] items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-[13px] font-bold text-white active:scale-[0.99] disabled:opacity-40"
      >
        <Check className="h-4 w-4" /> {pickLabel}
      </button>
    </div>
  );
}

// 나의 여정 — 무작위 대진이라 고정 브래킷이 아닌 "라운드 진행"을 표시
function JourneyTrack({ startSize, roundSize, t }: { startSize: number; roundSize: number; t: (k: string) => string }) {
  const rounds: number[] = [];
  for (let s = startSize; s >= 2; s = s / 2) rounds.push(s);
  const label = (s: number) => (s === 2 ? t("ev_final") : t("ev_round_of").replace("{n}", String(s)));
  const curIdx = rounds.indexOf(roundSize);
  return (
    <div>
      <div className="mb-1.5 text-[11.5px] font-bold text-subtle">{t("ev_journey")}</div>
      <div className="flex items-center gap-1">
        {rounds.map((s, i) => {
          const done = i < curIdx, cur = i === curIdx;
          return (
            <div key={s} className="flex flex-1 items-center gap-1">
              <div className="flex flex-col items-center gap-0.5">
                <span className={`h-2.5 w-2.5 rounded-full ${cur ? "bg-primary ring-2 ring-primary/30" : done ? "bg-primary-strong" : "bg-border"}`} />
                <span className={`text-[9.5px] font-bold ${cur ? "text-primary-strong" : done ? "text-primary-strong/70" : "text-subtle"}`}>{label(s)}</span>
              </div>
              {i < rounds.length - 1 && <span className={`h-[2px] flex-1 rounded ${done ? "bg-primary-strong" : "bg-border"}`} />}
            </div>
          );
        })}
      </div>
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
  const [whichPlaying, setWhichPlaying] = useState<0 | 1 | null>(null); // 현재 재생 중인 타일(한 번에 하나만)
  const [picking, setPicking] = useState<{ w: string; l: string } | null>(null); // 선택 전환 연출(승자/탈락) 중 잠금
  const [picks, setPicks] = useState<Pick[]>([]);
  const [winner, setWinner] = useState<StagePostPublic | null>(null);
  const [counted, setCounted] = useState<boolean | null>(null);
  const [votes, setVotes] = useState<{ used: number; cap: number } | null>(null); // 잔여 투표
  const [participants, setParticipants] = useState(0);

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
      // 후보 영상 — 아카이브 전체(카테고리 지정 시 해당 카테고리만)
      let poolQ = sb.from("stage_posts_public").select("*").eq("stage_id", e.stage_id).limit(200);
      if (e.category) poolQ = poolQ.eq("category", e.category);
      const { data: ps } = await poolQ;
      setPool((ps ?? []) as StagePostPublic[]);
      if (e.status === "announced") setShowStandings(true);
      const { data: pc } = await sb.from("event_participants_public").select("participants").eq("event_id", eventId).maybeSingle();
      setParticipants((pc?.participants as number) ?? 0);
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
    setWhichPlaying(null);
    setPicks([]);
    setWinner(null);
    setCounted(null);
    setPhase("playing");
  }

  // 선택 → 승자/탈락 연출(150~460ms) → 다음 대결. 연출 중 중복 입력 잠금.
  async function pick(winnerPost: StagePostPublic, loserPost: StagePostPublic) {
    if (picking) return; // 중복 탭 잠금
    setWhichPlaying(null); // 두 영상 동시 재생 방지
    setPicking({ w: winnerPost.id, l: loserPost.id });
    try { navigator.vibrate?.(10); } catch { /* 미지원 무시 */ }
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    await new Promise((r) => setTimeout(r, reduce ? 0 : 460));
    await advance(winnerPost, loserPost);
    setPicking(null);
  }

  async function advance(winnerPost: StagePostPublic, loserPost: StagePostPublic) {
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
      try { navigator.vibrate?.(25); } catch { /* 미지원 무시 */ }
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

  async function shareWinner() {
    if (!winner) return;
    const url = `${location.origin}/video/${winner.id}?list=stage:${winner.stage_id}`;
    try {
      if (navigator.share) await navigator.share({ title: winner.title, text: `${t("ev_my_winner")} — ${winner.title}`, url });
      else { await navigator.clipboard.writeText(url); toast(t("brag_saved")); }
    } catch { /* 취소·미지원 무시 */ }
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
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-extrabold ${event.stage_is_official ? "bg-primary-soft text-primary-strong" : "bg-[#eaf7f0] text-[#21845f]"}`}>
            {t(event.stage_is_official ? "ev_source_official" : "ev_source_fan")}
            {event.stage_is_official && event.category ? ` · ${t(`cat_${event.category}`)}` : ""}
          </span>
          <span className="text-[12px] text-muted">{event.stage_title}</span>
        </div>
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

      {/* 인트로 — 시작 직전 기대감(참여 규모·참가작 미리보기·규칙·시작 CTA) */}
      {phase === "intro" && (
        <div className="space-y-4">
          {event.description && <p className="text-[13.5px] leading-relaxed text-muted">{event.description}</p>}

          {/* 참여 규모 · 참가작 수 · 라운드 */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold text-muted">
            {participants > 0 && <span>{t("ev_participants_n").replace("{n}", participants.toLocaleString())}</span>}
            {participants > 0 && pool.length > 0 && <span className="text-subtle">·</span>}
            {pool.length > 0 && <span>{t("ev_entries_n").replace("{n}", String(pool.length))}</span>}
            {size >= 2 && <><span className="text-subtle">·</span><span>{size === 2 ? t("ev_final") : t("ev_round_of").replace("{n}", String(size))}</span></>}
          </div>

          {/* 참가 영상 미리보기 */}
          {pool.length > 0 && (
            <div>
              <div className="mb-1.5 text-[12px] font-bold text-fg">{t("ev_preview_entries")}</div>
              <div className="grid grid-cols-4 gap-1.5">
                {pool.slice(0, 4).map((p, i) => (
                  <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg bg-card-2">
                    {p.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary-soft to-card-2" />
                    )}
                    {i === 3 && pool.length > 4 && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[12px] font-black text-white">+{pool.length - 4}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 규칙 안내 (RuleStepper) */}
          <div className="rounded-2xl border border-[#e2d6ff] bg-primary-soft/50 p-3.5">
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-primary-strong">{t("ev_how_title")}</div>
            <div className="flex gap-2">
              {[t("ev_how_1"), t("ev_how_2"), t("ev_how_3")].map((s, i) => (
                <div key={i} className="min-w-0 flex-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-primary shadow-sm">{i + 1}</span>
                  <div className="mt-1 text-[11.5px] font-bold leading-tight text-fg">{s}</div>
                </div>
              ))}
            </div>
          </div>

          {event.status === "open" && votesLabel && (
            <div className="text-center">
              <p className="text-[11.5px] font-semibold text-muted">{votesLabel}</p>
              <p className="mt-0.5 text-[11px] text-muted">{t("ev_votes_help").replace("{cap}", String(votes?.cap ?? 3))}</p>
            </div>
          )}

          {/* 시작 CTA (하단 sticky, safe-area 포함) */}
          {event.status === "open" &&
            (size >= 2 ? (
              <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+76px)] z-10 -mx-4 border-t border-border bg-bg/90 px-4 py-3 backdrop-blur-md">
                <button onClick={start} className="flex w-full items-center justify-center gap-2 rounded-full brand-gradient py-3.5 text-[15px] font-extrabold text-white shadow-[0_6px_16px_-4px_rgba(108,77,230,0.5)] active:scale-[0.99]">
                  <Play className="h-4 w-4 fill-white" /> {t("ev_play")} · {size === 2 ? t("ev_final") : t("ev_round_of").replace("{n}", String(size))}
                </button>
              </div>
            ) : (
              <p className="rounded-xl border border-border bg-card-2 px-3 py-3 text-center text-[13px] text-muted">{t("ev_not_enough")}</p>
            ))}

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
          {/* 나의 여정 */}
          <div className="mb-3">
            <JourneyTrack startSize={size} roundSize={roundSize} t={t} />
          </div>
          {/* 현재 대결 진행 (3 / 4 단독 대신 의미 있는 문구) */}
          <p className="text-center text-[12px] font-bold text-muted">
            {t("ev_match_progress").replace("{i}", String(matchIdx + 1)).replace("{n}", String(Math.floor(roundSize / 2)))}
          </p>
          <p className="mt-1 text-center text-[15px] font-extrabold text-fg">{t("ev_pick_prompt")}</p>
          <p className="mb-3 text-center text-[11.5px] text-muted">{t("ev_watch_hint")}</p>
          <div className="space-y-2.5">
            <MatchTile post={a} corner="A" onPick={() => void pick(a, b)} pickLabel={t("ev_pick_this")}
              playing={whichPlaying === 0} onPlay={() => setWhichPlaying(0)} locked={picking !== null}
              pickState={picking ? (picking.w === a.id ? "selected" : "eliminated") : "none"}
              selectedLabel={t("ev_selected")} eliminatedLabel={t("ev_eliminated")} />
            <div className="text-center text-[13px] font-black text-subtle">VS</div>
            <MatchTile post={b} corner="B" onPick={() => void pick(b, a)} pickLabel={t("ev_pick_this")}
              playing={whichPlaying === 1} onPlay={() => setWhichPlaying(1)} locked={picking !== null}
              pickState={picking ? (picking.w === b.id ? "selected" : "eliminated") : "none"}
              selectedLabel={t("ev_selected")} eliminatedLabel={t("ev_eliminated")} />
          </div>
        </div>
      )}

      {/* 결과 — 나의 우승작 Hero */}
      {phase === "done" && winner && (
        <div className="space-y-3">
          <div className="anim-fade-up relative overflow-hidden rounded-3xl border border-[#e2d6ff] bg-gradient-to-b from-primary-soft to-white p-5 text-center shadow-sm">
            <div className="flex items-center justify-center">
              <CharmIcon name="trophy" size={44} className="drop-shadow" />
            </div>
            <div className="mt-1 text-[12.5px] font-extrabold uppercase tracking-wider text-primary-strong">✦ {t("ev_my_winner")} ✦</div>
            <div className="relative mx-auto mt-3 w-full max-w-[300px]">
              {winner.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={winner.thumbnail_url} alt="" className="aspect-video w-full rounded-2xl object-cover shadow-md ring-2 ring-primary/30" />
              ) : (
                <div className="aspect-video w-full rounded-2xl bg-gradient-to-br from-primary-soft to-card-2" />
              )}
            </div>
            <div className="mt-3 text-[16px] font-extrabold leading-snug text-fg">{winner.title}</div>
            <div className="text-[12px] text-subtle">@{winner.handle}</div>
            {participants > 0 && (
              <p className="mt-2 text-[12px] font-semibold text-primary-strong">{t("ev_winner_joined").replace("{n}", participants.toLocaleString())}</p>
            )}
            {counted != null && (
              <p className={`mt-1 text-[11.5px] font-bold ${counted ? "text-primary-strong" : "text-muted"}`}>
                {t(counted ? "ev_counted" : "ev_not_counted")}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setPhase("intro"); setShowStandings(true); }} className="flex-1 rounded-full bg-primary py-3 text-[14px] font-extrabold text-white active:scale-[0.99]">
              {t("ev_result_confirm")}
            </button>
            <button onClick={() => void shareWinner()} className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-card py-3 text-[14px] font-bold text-fg active:scale-[0.99]">
              <Share2 className="h-4 w-4" /> {t("ev_share")}
            </button>
          </div>
          <button onClick={start} className="w-full rounded-full border border-border bg-card-2 py-2.5 text-[13px] font-bold text-muted">{t("ev_play_again")}</button>
        </div>
      )}
    </div>
  );
}
