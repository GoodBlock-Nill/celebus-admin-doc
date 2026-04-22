'use client';

import { Suspense } from 'react';
import BottomTabBar from '@/components/layout/BottomTabBar';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <main className="pb-tab-bar">
        <Suspense fallback={<div className="min-h-dvh bg-white pb-20" />}>
          {children}
        </Suspense>
      </main>
      <BottomTabBar />
    </div>
  );
}
