import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash, hashWithSalt, getClientIp } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { readVoterId, signAnonId, VID_COOKIE, VID_COOKIE_OPTS } from "@/lib/anon-identity";

// 게임 시작 — 서버가 matchId+seed 발급(1회용). 점수 위조 방어 Phase 1.
//   클라이언트는 이 seed로 보드를 만들고, 게임오버 시 matchId와 함께 점수를 제출한다.
const ISSUE_CAP = Number(process.env.VOTE_ISSUE_CAP) || 5;
const ISSUE_WINDOW_SECS = Number(process.env.VOTE_ISSUE_WINDOW_SECS) || 60 * 60 * 24;

const schema = z.object({ mode: z.enum(["daily", "free"]) });

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });

  const { id: anonId, isNew } = readVoterId(req);
  if (isNew) {
    const { data: granted } = await admin().rpc("claim_anon_id", {
      p_ip_hash: hashWithSalt(getClientIp(req)),
      p_anon_id: anonId,
      p_cap: ISSUE_CAP,
      p_window_secs: ISSUE_WINDOW_SECS,
    });
    if (!granted) return NextResponse.json({ error: "limit" }, { status: 429 });
  }

  const { data, error } = await admin().rpc("game_start_match", {
    p_player_hash: playerHash(anonId),
    p_mode: parsed.data.mode,
  });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (data?.error) return NextResponse.json({ error: data.error }, { status: 400 });

  const res = NextResponse.json({
    match_id: data.match_id,
    seed: Number(data.seed),
    // 순항 보너스(Wave D) — 서버 판정값 그대로 전달(구 RPC엔 키가 없어 0으로 폴백)
    warmup_sec: Number(data.warmup_sec) || 0,
    streak_sec: Number(data.streak_sec) || 0,
    streak_days: Number(data.streak_days) || 0,
  });
  if (isNew) res.cookies.set(VID_COOKIE, signAnonId(anonId), VID_COOKIE_OPTS);
  return res;
}
