import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

// 도트(픽셀) 폰트 — Galmuri11: 한글 전체·가나·라틴·한자 지원 → ko/en/ja 동일 감성 (사용자 결정 2026-07-24)
const galmuri = localFont({
  src: [
    { path: "../fonts/Galmuri11.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Galmuri11-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-galmuri",
  display: "swap",
});
// 폴백(미지원 글리프·이모지 옆 텍스트) — Noto Sans KR
const noto = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-noto", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://game-app-rho-pearl.vercel.app";
const TITLE = "CELEB MATCH";
const DESCRIPTION = "최애와 함께하는 매치3 퍼즐! 타일을 맞춰 콤보를 터뜨리고 주간 랭킹에 도전하세요 💜";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: TITLE },
  icons: { icon: "/icons/icon-192.png", shortcut: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
  openGraph: {
    type: "website",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "ko_KR",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "CELEB MATCH — Match your favorite stars!" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#7C3AED",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // 게임 — 확대/스크롤 바운스 억제
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${galmuri.variable} ${noto.variable}`}>
      <body className="font-sans overscroll-none">
        {children}
        <Toaster position="top-center" theme="dark" richColors />
      </body>
    </html>
  );
}
