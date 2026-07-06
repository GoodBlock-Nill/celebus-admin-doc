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

export const metadata: Metadata = {
  title: "CELEBUS FanVoice",
  description: "V01D 팬보이스 — 여러분의 목소리가 다음을 만듭니다",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CELEBUS FanVoice",
  },
  icons: { icon: "/symbol.svg", shortcut: "/symbol.svg", apple: "/icons/icon-192.png" },
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
