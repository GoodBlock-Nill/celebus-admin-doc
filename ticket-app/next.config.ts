import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 내 티켓 메뉴 폐지 — 외부에 남아 있는 기존 링크는 예매내역으로 보낸다(임시 이동).
  async redirects() {
    return [
      { source: "/app/tickets", destination: "/app/orders", permanent: false },
      { source: "/app/tickets/:path*", destination: "/app/orders", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
