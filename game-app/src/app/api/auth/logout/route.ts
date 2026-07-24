import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/origin";
import { VID_COOKIE, VID_COOKIE_OPTS } from "@/lib/anon-identity";

// 로그아웃 — 신원 쿠키 제거. 다음 실행 시 가입/로그인 게이트로 복귀.
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const res = NextResponse.json({ status: "ok" });
  res.cookies.set(VID_COOKIE, "", { ...VID_COOKIE_OPTS, maxAge: 0 });
  return res;
}
