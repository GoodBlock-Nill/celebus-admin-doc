'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

// zustand persist(localStorage) 복원 전 SSR 마크업과의 불일치를 막기 위한 공통 가드
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
