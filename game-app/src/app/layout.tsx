import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Gothic_A1 } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const noto = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "500", "700", "900"], variable: "--font-noto", display: "swap" });
const display = Gothic_A1({ subsets: ["latin"], weight: ["800", "900"], variable: "--font-black-han", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://celebus-game.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "V01D POP",
  description: "V01D 팬 미니게임 — 타일을 맞춰 최고 점수에 도전하세요",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "V01D POP" },
  icons: { icon: "/symbol.svg", shortcut: "/symbol.svg", apple: "/icons/icon-192.png" },
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
    <html lang="ko" className={`${noto.variable} ${display.variable}`}>
      <body className="font-sans overscroll-none">
        {children}
        <Toaster position="top-center" theme="dark" richColors />
      </body>
    </html>
  );
}
