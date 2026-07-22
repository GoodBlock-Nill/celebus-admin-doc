import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash, hashWithSalt, getClientIp } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { voteThrottled } from "@/lib/ratelimit";
import { readVoterId, signAnonId, VID_COOKIE, VID_COOKIE_OPTS } from "@/lib/anon-identity";

// ⚠️ 파일럿 "테스트 충전" — 실제 결제 게이트웨이 없음. 프리셋 금액만 허용 + IP 스로틀로 남용 억제.
//    실결제(CELB 전환/IAP)는 후속. 프리셋 외 금액·과다 호출은 거부.
const CHARGE_PRESETS = [100, 500, 1000] as const;
const ISSUE_CAP = Number(process.env.VOTE_ISSUE_CAP) || 5;
const ISSUE_WINDOW_SECS = Number(process.env.VOTE_ISSUE_WINDOW_SECS) || 60 * 60 * 24;

const chargeSchema = z.object({ amount: z.number().int() });

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });

  const parsed = chargeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !CHARGE_PRESETS.includes(parsed.data.amount as (typeof CHARGE_PRESETS)[number])) {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }
  const { amount } = parsed.data;

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

  const { data: result, error } = await admin().rpc("game_charge_point", {
    p_player_hash: playerHash(anonId),
    p_amount: amount,
  });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (result?.error) return NextResponse.json({ status: "rejected", reason: result.error }, { status: 400 });

  const res = NextResponse.json({ status: "ok", ...result });
  if (isNew) res.cookies.set(VID_COOKIE, signAnonId(anonId), VID_COOKIE_OPTS);
  return res;
}
