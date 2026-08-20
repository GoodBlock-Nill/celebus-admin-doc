import { NextResponse, type NextRequest } from "next/server";

// CELEB SKETCH는 독립 앱(../sketch-app)으로 분리됨 (2026-08-20 사용자 결정).
// 과거 /sketch 링크·북마크는 전용 도메인으로 보낸다. 신원(쿠키·HASH_SALT)·DB는 계속 공유.
const SKETCH_URL = process.env.NEXT_PUBLIC_SKETCH_URL || "https://celeb-sketch.vercel.app";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (process.env.NODE_ENV === "production" && (pathname === "/sketch" || pathname.startsWith("/sketch/"))) {
    return NextResponse.redirect(`${SKETCH_URL}${pathname.replace(/^\/sketch/, "") || "/"}`, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/sketch/:path*", "/sketch"],
};
