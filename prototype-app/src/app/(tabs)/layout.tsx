'use client';

import BottomTabBar from '@/components/layout/BottomTabBar';
import Toast from '@/components/ui/Toast';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Toast />
      <main className="pb-tab-bar">
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
