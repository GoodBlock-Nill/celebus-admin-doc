"use client";

// CELEB SKETCH 파티룸 — 클라이언트 API + Realtime 채널 (기획 §5.5).
// DB(RPC)가 상태 권위, Realtime은 휘발성 중계: 스트로크 라이브·정답·라운드 전환 신호·프레즌스.
// 신호 유실 대비 클라이언트는 3초 주기 상태 폴링을 병행한다 (중계와 권위 분리).
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import type { SketchStroke } from "./sketch";

export type PartyRoomState = {
  room: {
    id: string;
    code: string;
    status: "lobby" | "playing" | "ended";
    round: number;
    total_rounds: number;
    deadline: string | null;
    is_host: boolean;
    is_drawer: boolean;
    is_member: boolean;
  };
  members: { nick: string; score: number; is_drawer: boolean; is_host: boolean; is_me: boolean; correct: boolean }[];
  word: string | null;
  tiles: string[] | null;
  answer_len: number;
  my_correct: boolean;
};

export type PartyEvent =
  | { type: "stroke"; stroke: SketchStroke } // 확정 획
  | { type: "live"; stroke: SketchStroke } // 그리는 중 부분 획 (스로틀)
  | { type: "clear" }
  | { type: "correct"; nick: string }
  | { type: "sync" }; // 라운드 전환·시작 등 — 수신 측은 상태 재조회

export async function partyApi(body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch("/api/sketch/room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchPartyState(code: string): Promise<PartyRoomState | null> {
  try {
    const res = await fetch(`/api/sketch/room?code=${encodeURIComponent(code)}`);
    if (!res.ok) return null;
    return (await res.json()) as PartyRoomState;
  } catch {
    return null;
  }
}

let client: ReturnType<typeof createClient> | null = null;
function supabase() {
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
  }
  return client;
}

export function joinPartyChannel(
  roomId: string,
  presenceKey: string,
  onEvent: (e: PartyEvent) => void,
  onPresence: (count: number) => void
): RealtimeChannel {
  const ch = supabase().channel(`sketch-room:${roomId}`, { config: { presence: { key: presenceKey }, broadcast: { self: false } } });
  ch.on("broadcast", { event: "party" }, (msg) => onEvent(msg.payload as PartyEvent));
  ch.on("presence", { event: "sync" }, () => onPresence(Object.keys(ch.presenceState()).length));
  ch.subscribe((status) => {
    if (status === "SUBSCRIBED") void ch.track({ at: Date.now() });
  });
  return ch;
}

export function sendPartyEvent(ch: RealtimeChannel, e: PartyEvent): void {
  void ch.send({ type: "broadcast", event: "party", payload: e });
}
