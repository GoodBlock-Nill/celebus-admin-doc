import type { Metadata } from 'next';
import './globals.css';
import AdminLayout from '@/components/layout/AdminLayout';
import { ToastViewport } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'Celebus Backoffice',
  description: 'CELEBUS 운영 백오피스 클론 (prototype)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased bg-gray-50">
        <AdminLayout>{children}</AdminLayout>
        {/* 공용 Toast Viewport — 모든 영역에서 toast.success/error/info 호출 시 자동 노출 */}
        <ToastViewport />
      </body>
    </html>
  );
}
