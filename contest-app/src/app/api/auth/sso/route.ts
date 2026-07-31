import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { signAnonId, VID_COOKIE, VID_COOKIE_OPTS } from "@/lib/anon-identity";
import { celebusIdentityId, mockIdentity } from "@/lib/celebus-sso";
import { assertSameOrigin } from "@/lib/origin";
import { getClientIp } from "@/lib/hash";
import { tooManyAttempts, resetAttempts } from "@/lib/ratelimit";
import { checkProfanity } from "@/lib/profanity";

// FanStage 세션 발급 (W4) — 신원 쿠키의 유일한 발급 지점(익명 발급 폐지).
// 본앱 세션 확인은 클라이언트가 본앱 API 직접 호출(게임앱과 동일 아키텍처) 후 신원을 전달한다.
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
  if (!parsed.success) return NextResponse.json({ signed_in: false, reason: "no_celebus_session" }, { status: 401 });

  const userId = celebusIdentityId(parsed.data.uid);
  // 닉네임 금칙어 검사 — 부적절 시 공란 처리(로그인은 막지 않음)
  const nickname = parsed.data.nickname && (await checkProfanity(parsed.data.nickname)) ? "" : parsed.data.nickname;
  const { data, error } = await admin().rpc("stage_sso_login", {
    p_user: userId,
    p_uid: parsed.data.uid,
    p_nickname: nickname,
    p_avatar: parsed.data.avatar,
  });
  if (error || !data?.ok) return NextResponse.json({ signed_in: false, reason: "sso_error" }, { status: 500 });

  resetAttempts(`sso:${getClientIp(req)}`);
  const res = NextResponse.json({ signed_in: true, nickname: data.nickname ?? "", is_member: data.is_member ?? false });
  res.cookies.set(VID_COOKIE, signAnonId(userId), VID_COOKIE_OPTS);
  return res;
}
