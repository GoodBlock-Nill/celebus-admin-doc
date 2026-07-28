import { NextResponse } from "next/server";
import { VID_COOKIE } from "@/lib/anon-identity";
import { assertSameOrigin } from "@/lib/origin";

// 로그아웃 — 신원 쿠키 만료. 이후 열람은 계속 가능(익명), 상호작용만 재로그인 필요.
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(VID_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
