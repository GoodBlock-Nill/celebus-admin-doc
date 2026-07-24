import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { getClientIp } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { tooManyAttempts, resetAttempts } from "@/lib/ratelimit";
import { signAnonId, VID_COOKIE, VID_COOKIE_OPTS } from "@/lib/anon-identity";

const schema = z.object({
  nickname: z.string().trim().min(3).max(20),
  password: z.string().min(1).max(72),
});

// 로그인 — 성공 시 저장된 원 신원(anon_id)으로 쿠키 재발급 → 이 기기가 해당 계정을 이어받음
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });

  const ip = getClientIp(req);
  if (tooManyAttempts(`login:${ip}`)) return NextResponse.json({ status: "rejected", reason: "limit" }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ status: "rejected", reason: "invalid_credentials" }, { status: 400 });

  const { data: result, error } = await admin().rpc("game_login", {
    p_nickname: parsed.data.nickname,
    p_password: parsed.data.password,
  });
  if (error) return NextResponse.json({ status: "rejected", reason: "error" }, { status: 500 });
  if (result?.error) return NextResponse.json({ status: "rejected", reason: result.error }, { status: 400 });

  resetAttempts(`login:${ip}`);
  const res = NextResponse.json({ status: "ok", nickname: result.nickname, avatar: result.avatar ?? null });
  res.cookies.set(VID_COOKIE, signAnonId(String(result.anon_id)), VID_COOKIE_OPTS);
  return res;
}
