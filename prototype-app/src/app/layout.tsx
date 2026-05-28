import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const noto = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CELEBUS',
  description: 'CELEBUS - K-pop Fan Entertainment Platform',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'CELEBUS' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#121212',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={noto.variable}>
      <body className="bg-black">
        {/* 375px mobile shell, centered on larger screens */}
        <div className="relative mx-auto flex min-h-dvh w-full max-w-shell flex-col bg-background text-foreground">
          {children}
        </div>
        <Toaster position="top-center" theme="dark" richColors closeButton />
      </body>
    </html>
  );
}
