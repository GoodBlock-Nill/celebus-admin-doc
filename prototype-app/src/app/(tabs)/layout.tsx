'use client';

import type { ReactNode } from 'react';
import BottomTabBar from '@/components/layout/BottomTabBar';
import ToastContainer from '@/components/ui/Toast';

export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main className="pb-tab-bar">
        {children}
      </main>
      <BottomTabBar />
      <ToastContainer />
    </>
  );
}
