'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { ActionResult } from '@/lib/store-types';

const TOAST_DURATION_MS = 3000;
const MAX_TOASTS = 3;

export type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  /** 스토어 액션 결과를 그대로 알림으로 변환한다. */
  fromResult: (result: ActionResult, successMessage: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TOAST_STYLE: Record<ToastKind, string> = {
  success: 'border-[#188A5B] bg-[#EAF6F0] text-[#146B47]',
  error: 'border-[#C2402A] bg-[#FBEDEA] text-[#9B3320]',
  info: 'border-[#3056D3] bg-[#EDF1FD] text-[#2545A8]',
};

const TOAST_MARK: Record<ToastKind, string> = {
  success: '✓',
  error: '!',
  info: 'i',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seqRef = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      seqRef.current += 1;
      const id = seqRef.current;
      setItems((current) => [...current, { id, kind, message }].slice(-MAX_TOASTS));
      window.setTimeout(() => remove(id), TOAST_DURATION_MS);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
      fromResult: (result, successMessage) => {
        if (result.ok) push('success', successMessage);
        else push('error', result.reason);
      },
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-5 top-5 z-[9999] flex w-[320px] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[13px] leading-relaxed shadow-[0_6px_20px_rgba(27,29,34,0.12)] ${TOAST_STYLE[item.kind]}`}
          >
            <span className="mt-[1px] font-bold">{TOAST_MARK[item.kind]}</span>
            <span className="flex-1 break-words">{item.message}</span>
            <button
              type="button"
              aria-label="알림 닫기"
              onClick={() => remove(item.id)}
              className="shrink-0 px-1 opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast는 ToastProvider 내부에서만 사용할 수 있습니다.');
  return context;
}
