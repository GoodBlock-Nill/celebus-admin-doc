"use client";

// CELEB SKETCH 파티룸 (기획 §5.5) — 초대 링크 실시간: 로비 → 출제 로테이션 90초 라운드 → 최종 스코어.
// 상태 권위 = 서버(3초 폴링), Realtime 채널 = 스트로크 라이브 중계·정답·동기화 신호 (유실 허용).
// 알려진 한계(파일럿): 라운드 중간 재입장 시 이미 그려진 획은 다음 획부터 보인다.
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, Copy, Crown, Palette } from "lucide-react";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";
import PartyCanvas from "@/components/sketch/PartyCanvas";
import { SKETCH_PAPER, renderDrawing, type SketchStroke } from "@/lib/sketch";
import { getNick } from "@/lib/game-api";
import { fetchPartyState, joinPartyChannel, partyApi, sendPartyEvent, type PartyEvent, type PartyRoomState } from "@/lib/sketch-party";

function ViewerCanvas({ strokes, live }: { strokes: SketchStroke[]; live: SketchStroke | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !wrap || !ctx) return;
    const size = Math.floor(wrap.clientWidth);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== size * dpr) {
      cv.width = size * dpr;
      cv.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    renderDrawing(ctx, live ? [...strokes, live] : strokes, size);
  }, [strokes, live]);
  return (
    <div ref={wrapRef} className="relative aspect-square w-full overflow-hidden rounded-[16px] ring-1 ring-hairline">
      <canvas ref={canvasRef} className="h-full w-full" style={{ background: SKETCH_PAPER }} />
    </div>
  );
}

export default function PartyRoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [state, setState] = useState<PartyRoomState | null>(null);
  const [strokes, setStrokes] = useState<SketchStroke[]>([]);
  const [live, setLive] = useState<SketchStroke | null>(null);
  const [tiles, setTiles] = useState<string[]>([]);
  const [tilesRound, setTilesRound] = useState(0);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [used, setUsed] = useState<Set<number>>(new Set());
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [online, setOnline] = useState(1);
  const [copied, setCopied] = useState(false);
  const chRef = useRef<RealtimeChannel | null>(null);
  const roundRef = useRef(0);
  const advancing = useRef(false);

  const refresh = useCallback(async () => {
    const s = await fetchPartyState(code);
    if (!s) return;
    setState(s);
    if (s.room.round !== roundRef.current) {
      // 라운드 전환 — 캔버스·타일 초기화
      roundRef.current = s.room.round;
      setStrokes([]);
      setLive(null);
      setTiles([]);
      setTilesRound(0);
    }
    if (s.tiles && s.room.round !== tilesRound) {
      // 타일은 라운드당 1회만 고정 (폴링마다 셔플되지 않게)
      setTiles(s.tiles);
      setTilesRound(s.room.round);
      setSlots(Array(s.answer_len).fill(null));
      setUsed(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, tilesRound]);

  // 입장 → 채널 구독 → 폴링
  useEffect(() => {
    let poll: ReturnType<typeof setInterval> | null = null;
    let mounted = true;
    (async () => {
      const joined = await partyApi({ action: "join", code, nick: getNick() });
      if (!joined || joined.error) {
        toast.error(joined?.error === "full" ? "방이 가득 찼어요 (최대 8명)." : joined?.error === "in_progress" ? "이미 시작된 방이에요." : "방을 찾을 수 없어요.");
        router.replace("/sketch");
        return;
      }
      if (!mounted) return;
      const roomId = joined.id as string;
      chRef.current = joinPartyChannel(
        roomId,
        Math.random().toString(36).slice(2),
        (e: PartyEvent) => {
          if (e.type === "stroke") {
            setLive(null);
            setStrokes((s) => [...s, e.stroke]);
          } else if (e.type === "live") setLive(e.stroke);
          else if (e.type === "clear") {
            setStrokes([]);
            setLive(null);
          } else if (e.type === "correct") toast.success(`${e.nick} 님 정답! 🎉`);
          else if (e.type === "sync") void refresh();
        },
        setOnline
      );
      await refresh();
      poll = setInterval(() => void refresh(), 3000);
    })();
    return () => {
      mounted = false;
      if (poll) clearInterval(poll);
      void chRef.current?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // 라운드 타이머 — 서버 마감 시각 기준. 출제자가 종료 시 진행 호출 (게스트도 폴백 호출 — 서버가 중복 무시)
  useEffect(() => {
    if (state?.room.status !== "playing" || !state.room.deadline) return;
    const iv = setInterval(() => {
      const left = Math.max(0, Math.ceil((new Date(state.room.deadline!).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0 && !advancing.current) {
        advancing.current = true;
        void partyApi({ action: "advance", id: state.room.id }).then(() => {
          advancing.current = false;
          if (chRef.current) sendPartyEvent(chRef.current, { type: "sync" });
          void refresh();
        });
      }
    }, 300);
    return () => clearInterval(iv);
  }, [state?.room.status, state?.room.deadline, state?.room.id, refresh]);

  if (!state)
    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md items-center justify-center">
        <div className="h-24 w-full animate-pulse rounded-[16px] bg-surface-1" />
      </div>
    );

  const { room, members } = state;
  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/sketch/room/${room.code}` : "";
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("복사에 실패했어요 — 주소를 직접 공유해 주세요.");
    }
  };

  const placeTile = (i: number) => {
    if (used.has(i)) return;
    const si = slots.findIndex((s) => s === null);
    if (si < 0) return;
    setSlots((s) => s.map((v, j) => (j === si ? tiles[i] : v)));
    setUsed((u) => new Set(u).add(i));
  };
  const removeSlot = (si: number) => {
    const ch = slots[si];
    if (ch == null) return;
    const ti = [...used].find((x) => tiles[x] === ch);
    setSlots((s) => s.map((v, j) => (j === si ? null : v)));
    if (ti != null) setUsed((u) => { const n = new Set(u); n.delete(ti); return n; });
  };
  const submitGuess = async () => {
    const res = await partyApi({ action: "guess", id: room.id, answer: slots.join("") });
    if (!res) return;
    if (res.correct) {
      toast.success(`정답! +${res.points}점`);
      if (chRef.current) sendPartyEvent(chRef.current, { type: "correct", nick: getNick() || "익명 팬" });
      if (res.all_done && chRef.current) {
        await partyApi({ action: "advance", id: room.id });
        sendPartyEvent(chRef.current, { type: "sync" });
      }
      void refresh();
    } else if (res.error === "round_over") toast.error("라운드가 끝났어요.");
    else {
      toast.error("아쉬워요! 다시 시도해 보세요.");
      setSlots(Array(state.answer_len).fill(null));
      setUsed(new Set());
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-3 px-5 pb-8 pt-6 px-safe pb-safe pt-safe">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-1.5 text-[17px] font-black text-fg">
          <Palette className="h-5 w-5 text-primary-400" /> 파티룸 <span className="text-primary-400">{room.code}</span>
        </h1>
        {room.status === "playing" ? (
          <span className="text-[13px] font-black tabular-nums text-muted">
            {room.round}/{room.total_rounds} 라운드 · <span className={secondsLeft <= 10 ? "text-danger" : ""}>{secondsLeft}초</span>
          </span>
        ) : (
          <span className="text-[12px] font-bold text-subtle">접속 {online}명</span>
        )}
      </div>

      {/* 멤버 스코어 줄 */}
      <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
        {members.map((m, i) => (
          <span key={i} className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold ring-1 ${m.is_me ? "bg-primary/20 text-primary-400 ring-primary/40" : "bg-surface-1 text-muted ring-hairline"}`}>
            {m.is_host && <Crown className="h-3 w-3 text-gold" />}
            {m.nick}
            {m.is_drawer && room.status === "playing" && " ✏️"}
            {m.correct && <Check className="h-3 w-3 text-verified" strokeWidth={3} />}
            <b className="tabular-nums">{m.score}</b>
          </span>
        ))}
      </div>

      {room.status === "lobby" && (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] leading-relaxed text-muted break-keep">
            친구를 초대하고 시작하세요 (2~8명). 돌아가며 한 명이 그리고, 나머지가 글자 타일로 먼저 맞히면 점수를 얻어요 —
            라운드는 인원×2번.
          </p>
          <button onClick={() => void copyInvite()} className="flex items-center justify-center gap-2 rounded-[14px] bg-surface-1 px-4 py-3.5 text-[13.5px] font-bold text-fg ring-1 ring-hairline active:scale-[0.99]">
            {copied ? <Check className="h-4 w-4 text-verified" /> : <Copy className="h-4 w-4" />} 초대 링크 복사
          </button>
          {room.is_host ? (
            <button
              onClick={async () => {
                const r = await partyApi({ action: "start", id: room.id });
                if (r?.error === "need_more") return toast.error("2명 이상 모여야 시작할 수 있어요.");
                if (chRef.current) sendPartyEvent(chRef.current, { type: "sync" });
                void refresh();
              }}
              className="w-full rounded-full bg-primary py-3.5 text-[15px] font-black text-white active:scale-[0.99]"
            >
              시작하기 ({members.length}명)
            </button>
          ) : (
            <p className="text-center text-[12.5px] font-bold text-subtle">방장이 시작하길 기다리는 중…</p>
          )}
        </div>
      )}

      {room.status === "playing" &&
        (room.is_drawer ? (
          <div className="flex flex-col gap-2">
            <p className="text-center text-[14px] font-black text-fg">
              제시어 <span className="text-primary-400">{state.word}</span> — 그려서 맞히게 하세요!
            </p>
            <PartyCanvas
              disabled={secondsLeft <= 0}
              onStroke={(s) => chRef.current && sendPartyEvent(chRef.current, { type: "stroke", stroke: s })}
              onLive={(s) => chRef.current && sendPartyEvent(chRef.current, { type: "live", stroke: s })}
              onClear={() => chRef.current && sendPartyEvent(chRef.current, { type: "clear" })}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <ViewerCanvas strokes={strokes} live={live} />
            {state.my_correct ? (
              <p className="text-center text-[13.5px] font-black text-verified">정답! 다른 친구들을 기다리는 중…</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {slots.map((s, i) => (
                    <button key={i} onClick={() => removeSlot(i)} className={`flex h-11 w-11 items-center justify-center rounded-[10px] text-[17px] font-black ${s != null ? "bg-primary/25 text-fg ring-2 ring-primary-400" : "bg-surface-1 ring-1 ring-hairline"}`}>
                      {s ?? ""}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {tiles.map((t, i) => (
                    <button key={i} onClick={() => placeTile(i)} disabled={used.has(i)} className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-surface-2 text-[17px] font-black text-fg ring-1 ring-hairline active:scale-95 disabled:opacity-25">
                      {t}
                    </button>
                  ))}
                </div>
                <button onClick={() => void submitGuess()} disabled={slots.some((s) => s === null)} className="w-full rounded-full bg-primary py-3 text-[14px] font-black text-white active:scale-[0.99] disabled:opacity-40">
                  확인
                </button>
              </>
            )}
            {room.is_host && (
              <button onClick={async () => { await partyApi({ action: "advance", id: room.id, force: true }); if (chRef.current) sendPartyEvent(chRef.current, { type: "sync" }); void refresh(); }} className="text-[11.5px] font-bold text-subtle">
                라운드 건너뛰기 (방장)
              </button>
            )}
          </div>
        ))}

      {room.status === "ended" && (
        <div className="flex flex-col gap-3">
          <p className="text-center text-[17px] font-black text-gold">게임 종료! 🏆</p>
          <div className="flex flex-col gap-1.5">
            {[...members].sort((a, b) => b.score - a.score).map((m, i) => (
              <div key={i} className={`flex items-center gap-2.5 rounded-[12px] px-3.5 py-2.5 ring-1 ${i === 0 ? "bg-gold/15 ring-gold/50" : "bg-surface-1 ring-hairline"}`}>
                <span className="w-6 text-[14px] font-black tabular-nums text-muted">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-fg">{m.nick}{m.is_me && " (나)"}</span>
                <span className="text-[14px] font-black tabular-nums text-gold">{m.score}점</span>
              </div>
            ))}
          </div>
          <button onClick={() => router.push("/sketch")} className="w-full rounded-full bg-primary py-3.5 text-[15px] font-black text-white active:scale-[0.99]">
            스케치 홈으로
          </button>
        </div>
      )}
    </div>
  );
}
