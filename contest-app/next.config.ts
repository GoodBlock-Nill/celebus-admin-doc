import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

// frame-src만 제한하는 CSP — 임베드 가능한 iframe 출처를 5개 플랫폼으로 한정
const FRAME_SRC = [
  "'self'",
  "https://www.youtube-nocookie.com",
  "https://www.youtube.com",
  "https://www.tiktok.com",
  "https://www.instagram.com",
  "https://www.threads.com",
  "https://www.threads.net",
  "https://platform.twitter.com",
].join(" ");

export default withSerwist({
  reactStrictMode: true,
  // dev 모드 좌하단 인디케이터 숨김 — 리뷰 캡처에서 UI 요소로 오인되던 검은 원 제거(프로덕션 무관)
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: `frame-src ${FRAME_SRC};` },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
});
