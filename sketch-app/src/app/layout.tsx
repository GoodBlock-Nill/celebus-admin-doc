import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import ShellBoundary from "@/components/ShellBoundary";
import "./globals.css";

// 도트(픽셀) 폰트 — Galmuri11: 한글 전체·가나·라틴·한자 지원 → ko/en/ja 동일 감성
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://celeb-sketch.vercel.app";
const TITLE = "CELEB SKETCH (Beta)"; // 정식 전환 시 "(Beta)" 제거
const DESCRIPTION = "그림으로 통하는 팬들의 퀴즈! 제시어를 그려 올리면 다른 팬들이 그려지는 과정을 보며 맞혀요 💜";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "CELEB SKETCH" },
  icons: { icon: "/icons/icon-192.png", shortcut: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
  openGraph: {
    type: "website",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "ko_KR",
  },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#7C5CF0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${galmuri.variable} ${noto.variable}`}>
      <body className="font-sans overscroll-none">
        <ShellBoundary>{children}</ShellBoundary>
        <Toaster position="top-center" theme="dark" richColors />
      </body>
    </html>
  );
}
