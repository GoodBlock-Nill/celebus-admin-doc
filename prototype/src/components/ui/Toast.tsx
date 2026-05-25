'use client';

import { useEffect, useState } from 'react';

// 공용 Toast — 모든 영역에서 동일 패턴으로 사용
// [CEB-BO-000] §공통 토스트 규격 정합 (상단 중앙, 3초 자동 닫힘, 최대 3개 스택)
//
// 사용:
//   import { toast } from '@/components/ui/Toast';
//   toast.success('저장되었습니다');
//   toast.error('오류가 발생했습니다');
//   toast.info('변경 사항이 없습니다');
//
// Viewport는 RootLayout에 1회만 마운트 — 자동으로 모든 페이지에서 노출.

export type ToastKind = 'success' | 'error' | 'info';
export interface ToastMsg {
  id: number;
  kind: ToastKind;
  message: string;
}

let toastId = 0;
let setToastListener: ((items: ToastMsg[]) => void) | null = null;
let toastItems: ToastMsg[] = [];

function emit(kind: ToastKind, message: string) {
  toastId += 1;
  const next = { id: toastId, kind, message };
  toastItems = [...toastItems.slice(-2), next]; // 최대 3개 스택
  setToastListener?.(toastItems);
  window.setTimeout(() => {
    toastItems = toastItems.filter((t) => t.id !== next.id);
    setToastListener?.(toastItems);
  }, 3000);
}

export const toast = {
  success: (msg: string) => emit('success', msg),
  error: (msg: string) => emit('error', msg),
  info: (msg: string) => emit('info', msg),
};

export function ToastViewport() {
  const [items, setItems] = useState<ToastMsg[]>([]);
  useEffect(() => {
    setToastListener = setItems;
    return () => { setToastListener = null; };
  }, []);
  if (items.length === 0) return null;
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-[fadeIn_0.2s_ease-out] ${
            t.kind === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            t.kind === 'error'   ? 'bg-red-50 text-red-700 border border-red-200' :
                                   'bg-gray-50 text-gray-700 border border-gray-200'
          }`}
        >
          {t.kind === 'success' && '✓ '}
          {t.kind === 'error' && '✕ '}
          {t.kind === 'info' && 'ℹ '}
          {t.message}
        </div>
      ))}
    </div>
  );
}
