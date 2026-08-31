'use client';

import type { ReactNode } from 'react';

import { Sidebar } from './sidebar';
import { ToastProvider } from './toast';

/** 관리자 셸 — 좌측 고정 메뉴 + 본문 (라이트 어드민 톤) */
export function AdminShell({ adminName, children }: { adminName: string; children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-dvh bg-[#F5F6F8] text-[#1B1D22]">
        <Sidebar adminName={adminName} />
        <main className="min-w-0 flex-1 px-6 py-6">
          <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
