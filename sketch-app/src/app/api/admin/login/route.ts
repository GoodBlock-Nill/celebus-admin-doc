import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/origin";
import { getClientIp } from "@/lib/hash";
import { tooManyAttempts, resetAttempts } from "@/lib/ratelimit";
import { adminKeyValid, adminSessionValue, ADM_COOKIE, ADM_COOKIE_OPTS } from "@/lib/admin-auth";

// 관리자 로그인 — ADMIN_KEY 일치 시 세션 쿠키(12h)
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ip = getClientIp(req);
  if (tooManyAttempts(`adm:${ip}`)) return NextResponse.json({ status: "limit" }, { status: 429 });

  const body = (await req.json().catch(() => null)) as { key?: string } | null;
  if (!body?.key || !adminKeyValid(body.key)) return NextResponse.json({ status: "invalid" }, { status: 401 });

  resetAttempts(`adm:${ip}`);
  const res = NextResponse.json({ status: "ok" });
  res.cookies.set(ADM_COOKIE, adminSessionValue(), ADM_COOKIE_OPTS);
  return res;
}
