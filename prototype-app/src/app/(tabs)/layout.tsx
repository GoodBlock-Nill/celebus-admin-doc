'use client';

import BottomTabBar from '@/components/layout/BottomTabBar';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <main className="pb-tab-bar">
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
