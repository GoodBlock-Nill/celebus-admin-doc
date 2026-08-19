import { NextResponse, type NextRequest } from "next/server";

// CELEB SKETCH 전용 배포 — 같은 코드베이스를 별도 Vercel 프로젝트로 분리 배포한다 (2026-08-19 사용자 결정).
// SKETCH_ONLY=1 환경변수가 설정된 배포(스케치 프로젝트)는 모든 경로를 /sketch 하위로 리라이트해
// 루트가 곧 스케치 홈이 된다. 신원(쿠키·HASH_SALT)·DB는 본 게임과 공유 — 코드가 아닌 배포만 분리.
// /sketch·/api·/_next·정적 파일은 그대로 통과 (내부 링크·자산 동작 유지).
const SKETCH_ONLY = process.env.SKETCH_ONLY === "1";
// 본 게임 배포에서 /sketch 접근 시 전용 도메인으로 보낸다 (2026-08-19 사용자 결정 — 스케치는 전용 도메인 단일 운영)
const SKETCH_URL = process.env.NEXT_PUBLIC_SKETCH_URL || "https://celeb-sketch.vercel.app";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!SKETCH_ONLY) {
    // 로컬 개발은 제외 — dev에서는 /sketch를 그대로 띄워 작업한다
    if (process.env.NODE_ENV === "production" && (pathname === "/sketch" || pathname.startsWith("/sketch/"))) {
      return NextResponse.redirect(`${SKETCH_URL}${pathname.replace(/^\/sketch/, "") || "/"}`, 308);
    }
    return NextResponse.next();
  }
  if (
    pathname.startsWith("/sketch") ||
    pathname.startsWith("/admin") || // 스케치 전용 관리자 (별도 ADMIN_KEY)
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") // 정적 파일 (아이콘·이미지·sw.js 등)
  ) {
    return NextResponse.next();
  }
  const url = req.nextUrl.clone();
  url.pathname = `/sketch${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
