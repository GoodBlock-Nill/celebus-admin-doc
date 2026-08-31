import type { Metadata, Viewport } from "next";
import "./globals.css";

/** 본문 서체 — 한국어 UI 가독성을 위해 Pretendard를 사용한다. */
const PRETENDARD_CSS_URL =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css";

export const metadata: Metadata = {
  title: "CELEBUS TICKET (MVP)",
  description: "콘서트 티켓 예매 MVP 프로토타입",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="stylesheet" href={PRETENDARD_CSS_URL} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
