import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash, hashWithSalt, getClientIp } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { voteThrottled } from "@/lib/ratelimit";
import { readVoterId, signAnonId, VID_COOKIE, VID_COOKIE_OPTS } from "@/lib/anon-identity";

const ISSUE_CAP = Number(process.env.VOTE_ISSUE_CAP) || 5;
const ISSUE_WINDOW_SECS = Number(process.env.VOTE_ISSUE_WINDOW_SECS) || 60 * 60 * 24;

const drawSchema = z.object({ event_id: z.string().uuid(), count: z.union([z.literal(1), z.literal(10)]) });

// 가챠 뽑기 — 이용권 차감·추첨·보상 지급은 서버 RPC가 원자적으로 처리 (결과는 서버 단독 결정).
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });

  const parsed = drawSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });

  const ip = getClientIp(req);
  if (voteThrottled(ip)) return NextResponse.json({ status: "limit" });

  const { id: anonId, isNew } = readVoterId(req);
  if (isNew) {
    const { data: granted } = await admin().rpc("claim_anon_id", {
      p_ip_hash: hashWithSalt(ip),
      p_anon_id: anonId,
      p_cap: ISSUE_CAP,
      p_window_secs: ISSUE_WINDOW_SECS,
    });
    if (!granted) return NextResponse.json({ status: "limit" });
  }

  const { data: result, error } = await admin().rpc("game_gacha_draw_exec", {
    p_player_hash: playerHash(anonId),
    p_event_id: parsed.data.event_id,
    p_count: parsed.data.count,
  });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (result?.error) return NextResponse.json({ status: "rejected", reason: result.error }, { status: 400 });

  const res = NextResponse.json({ status: "ok", ...result });
  if (isNew) res.cookies.set(VID_COOKIE, signAnonId(anonId), VID_COOKIE_OPTS);
  return res;
}
