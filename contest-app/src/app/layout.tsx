import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Gothic_A1 } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto",
  display: "swap",
});

// 헤드라인용 디스플레이 서체 (헤비 고딕 — 대담하되 정갈, V01D 가독성)
const display = Gothic_A1({
  subsets: ["latin"],
  weight: ["800", "900"],
  variable: "--font-black-han",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://celebus-fanstage.vercel.app";
const SITE_DESC = "V01D 팬 콘테스트 — 내 영상·사진을 올리고 팬들과 좋아요로 함께 즐겨요";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CELEBUS FanStage",
  description: SITE_DESC,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CELEBUS FanStage",
  },
  icons: { icon: "/symbol.svg", shortcut: "/symbol.svg", apple: "/icons/icon-192.png" },
  openGraph: {
    type: "website",
    siteName: "CELEBUS FanStage",
    title: "CELEBUS FanStage",
    description: SITE_DESC,
    url: "/",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "CELEBUS FanStage",
    description: SITE_DESC,
  },
};

export const viewport: Viewport = {
  themeColor: "#7C3AED",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${noto.variable} ${display.variable}`}>
      <body className="font-sans">
        {children}
        <Toaster position="top-center" theme="dark" richColors />
      </body>
    </html>
  );
}
