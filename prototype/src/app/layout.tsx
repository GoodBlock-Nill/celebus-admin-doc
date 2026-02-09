import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CELEBUS ADMIN',
  description: 'CELEBUS Admin - Game Zone Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
