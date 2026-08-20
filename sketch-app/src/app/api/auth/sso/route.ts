import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash, getClientIp } from "@/lib/hash";
import { signAnonId, VID_COOKIE, VID_COOKIE_OPTS } from "@/lib/anon-identity";
import { celebusAnonId, mockIdentity } from "@/lib/celebus-sso";
import { assertSameOrigin } from "@/lib/origin";
import { tooManyAttempts, resetAttempts } from "@/lib/ratelimit";

// 게임 세션 발급 — 본앱 세션 확인은 "브라우저 → 본앱 API 직접 호출"(개발팀 확정 방식).
// 본앱 인증 쿠키가 api 호스트 전용(HttpOnly)이라 이 서버에서는 재검증이 불가하며,
// 클라이언트가 확인한 신원(uid·닉네임·아바타)을 형식 검증 후 수용한다.
// ⚠️ 서버 재검증 부재는 개발팀 아키텍처 결정 — 본앱이 검증 API를 제공하면 복원 권장.
const schema = z.object({
  uid: z.string().min(1).max(64).regex(/^[\w.:@-]+$/),
  nickname: z.string().max(60).optional().default(""),
  avatar: z.union([z.literal(""), z.string().url().max(500)]).optional().default(""),
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (tooManyAttempts(`sso:${getClientIp(req)}`)) return NextResponse.json({ error: "limit" }, { status: 429 });

  let body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  // 로컬 개발 전용 mock — 운영 빌드에서는 완전 비활성
  if (process.env.NODE_ENV !== "production" && process.env.SSO_DEV_MOCK && !body?.uid) body = mockIdentity();

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ signed_up: false, reason: "no_celebus_session" }, { status: 401 });

  const anonId = celebusAnonId(parsed.data.uid);
  const { data, error } = await admin().rpc("game_sso_login", {
    p_player_hash: playerHash(anonId),
    p_anon_id: anonId,
    p_uid: parsed.data.uid,
    p_nickname: parsed.data.nickname,
    p_avatar: parsed.data.avatar,
  });
  if (error || data?.error) return NextResponse.json({ signed_up: false, reason: "sso_error" }, { status: 500 });

  resetAttempts(`sso:${getClientIp(req)}`); // 성공 시 리셋 — 공유 IP(캐리어 NAT) 다수 유저 보호
  const res = NextResponse.json({
    signed_up: true,
    nickname: data.nickname,
    avatar: data.avatar ?? null,
    is_member: data.is_member ?? false,
  });
  res.cookies.set(VID_COOKIE, signAnonId(anonId), VID_COOKIE_OPTS);
  return res;
}
