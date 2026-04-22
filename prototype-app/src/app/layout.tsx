import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import QueryProvider from '@/components/providers/QueryProvider';
import { Toaster } from '@/components/ui/sonner';
import OfflineIndicator from '@/components/pwa/OfflineIndicator';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import './globals.css';
import { Geist } from 'next/font/google';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin', 'latin-ext'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'CELEBUS',
  description: 'CELEBUS - K-pop Fan Entertainment Platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CELEBUS',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#7C3AED',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={cn('font-sans', geist.variable)}>
      <body className="antialiased">
        <QueryProvider>
          <Suspense fallback={<div className="min-h-dvh bg-white" />}>
            {children}
          </Suspense>
          <OfflineIndicator />
          <InstallPrompt />
          <Toaster position="top-center" richColors closeButton />
        </QueryProvider>
      </body>
    </html>
  );
}
