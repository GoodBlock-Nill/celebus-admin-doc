'use client';

import type { ReactNode } from 'react';
import { useExpireOverdueOrders } from './_components/hooks';
import { Sidebar } from './_components/sidebar';
import { ToastProvider } from './_components/toast';

/** 백오피스 셸 — 좌측 고정 메뉴 + 본문 (라이트 어드민 톤) */
export default function BackofficeLayout({ children }: { children: ReactNode }) {
  useExpireOverdueOrders();

  return (
    <ToastProvider>
      <div className="flex min-h-dvh bg-[#F5F6F8] text-[#1B1D22]">
        <Sidebar />
        <main className="min-w-0 flex-1 px-6 py-6">
          <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
