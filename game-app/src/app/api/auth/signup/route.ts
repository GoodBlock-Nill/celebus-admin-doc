import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash, hashWithSalt, getClientIp } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { tooManyAttempts, resetAttempts } from "@/lib/ratelimit";
import { readVoterId, signAnonId, VID_COOKIE, VID_COOKIE_OPTS } from "@/lib/anon-identity";

// IP당 신규 익명 식별자 발급 캡 (scores 라우트와 동일 정책)
const ISSUE_CAP = Number(process.env.VOTE_ISSUE_CAP) || 5;
const ISSUE_WINDOW_SECS = Number(process.env.VOTE_ISSUE_WINDOW_SECS) || 60 * 60 * 24;

const schema = z.object({
  nickname: z.string().regex(/^[a-z0-9._-]{3,20}$/),
  phone_cc: z.string().regex(/^\+\d{1,4}$/),
  phone: z.string().regex(/^\d{5,15}$/),
  password: z.string().min(8).max(72),
  avatar: z.string().trim().max(200).optional(),
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });

  const ip = getClientIp(req);
  if (tooManyAttempts(`signup:${ip}`)) return NextResponse.json({ status: "rejected", reason: "limit" }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ status: "rejected", reason: "bad_input" }, { status: 400 });
  const { nickname, phone_cc, phone, password, avatar } = parsed.data;

  // 현재 기기 신원 확보(없으면 발급) — 프로필은 이 신원에 결합
  const { id: anonId, isNew } = readVoterId(req);
  if (isNew) {
    const { data: granted } = await admin().rpc("claim_anon_id", {
      p_ip_hash: hashWithSalt(ip),
      p_anon_id: anonId,
      p_cap: ISSUE_CAP,
      p_window_secs: ISSUE_WINDOW_SECS,
    });
    if (!granted) return NextResponse.json({ status: "rejected", reason: "limit" }, { status: 429 });
  }

  const { data: result, error } = await admin().rpc("game_signup", {
    p_player_hash: playerHash(anonId),
    p_anon_id: anonId,
    p_nickname: nickname,
    p_phone_cc: phone_cc,
    p_phone: phone,
    p_password: password,
    p_avatar: avatar ?? null,
  });
  if (error) return NextResponse.json({ status: "rejected", reason: "error" }, { status: 500 });
  if (result?.error) return NextResponse.json({ status: "rejected", reason: result.error }, { status: 400 });

  resetAttempts(`signup:${ip}`); // 성공 시 카운터 리셋 — 공유 IP(가족·행사장) 연속 정상 가입 허용
  await admin().rpc("game_track_funnel", { p_step: "signup_done" }); // 퍼널: 가입 완료 (서버 정확 카운트 — supabase 빌더는 await 필수)
  const res = NextResponse.json({ status: "ok", nickname: result.nickname, avatar: result.avatar ?? null });
  if (isNew) res.cookies.set(VID_COOKIE, signAnonId(anonId), VID_COOKIE_OPTS);
  return res;
}
