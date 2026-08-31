'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { CheckIcon } from './icons';

const TOAST_DURATION_MS = 3000;
const MAX_TOASTS = 3;

type ToastKind = 'success' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

export interface AppToastApi {
  /** 처리 완료 알림 */
  success: (message: string) => void;
  /** 참고 안내 알림 */
  info: (message: string) => void;
}

const AppToastContext = createContext<AppToastApi | null>(null);

const TOAST_STYLE: Record<ToastKind, string> = {
  success: 'border-[#E5E8EB] bg-white text-[#067647]',
  info: 'border-[#E5E8EB] bg-white text-[#191F28]',
};

/** 회원 앱 공통 알림 — 화면 상단 중앙, 3초 뒤 자동 닫힘 */
export function AppToastProvider({ children }: { children: React.ReactNode }) {
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

  const api = useMemo<AppToastApi>(
    () => ({
      success: (message) => push('success', message),
      info: (message) => push('info', message),
    }),
    [push],
  );

  return (
    <AppToastContext.Provider value={api}>
      {children}
      <ToastStack items={items} onClose={remove} />
    </AppToastContext.Provider>
  );
}

function ToastStack({ items, onClose }: { items: ToastItem[]; onClose: (id: number) => void }) {
  if (items.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-5 z-[9999] flex w-full max-w-[420px] -translate-x-1/2 flex-col gap-2 px-4"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-3.5 py-3 text-[13.5px] leading-relaxed shadow-[0_4px_16px_rgba(25,31,40,0.12)] ${TOAST_STYLE[item.kind]}`}
        >
          {item.kind === 'success' ? <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" /> : null}
          <span className="flex-1 break-words">{item.message}</span>
          <button
            type="button"
            aria-label="알림 닫기"
            onClick={() => onClose(item.id)}
            className="shrink-0 px-1 opacity-70"
          >
            <CloseMark />
          </button>
        </div>
      ))}
    </div>
  );
}

/** 알림 닫기 표시 — 이모지 대신 선 아이콘을 사용한다. */
function CloseMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function useAppToast(): AppToastApi {
  const context = useContext(AppToastContext);
  if (!context) throw new Error('알림은 회원 앱 화면 안에서만 사용할 수 있습니다.');
  return context;
}
