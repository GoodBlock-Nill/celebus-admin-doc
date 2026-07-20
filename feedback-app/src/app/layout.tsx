import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto",
  display: "swap",
});

const SITE_URL = "https://celebus-fanvoice.vercel.app";
const SITE_DESC = "CELEBUS FanVoice — 팬 아이디어가 굿즈·이벤트로 실현되는 제안 보드";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CELEBUS FanVoice",
  description: SITE_DESC,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CELEBUS FanVoice",
  },
  icons: { icon: "/symbol.svg", shortcut: "/symbol.svg", apple: "/icons/icon-192.png" },
  openGraph: {
    type: "website",
    siteName: "CELEBUS FanVoice",
    title: "CELEBUS FanVoice",
    description: SITE_DESC,
    url: "/",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "CELEBUS FanVoice",
    description: SITE_DESC,
  },
};

export const viewport: Viewport = {
  themeColor: "#7C3AED",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={noto.variable}>
      <body className="font-sans">
        {children}
        <Toaster position="top-center" theme="dark" richColors />
      </body>
    </html>
  );
}
