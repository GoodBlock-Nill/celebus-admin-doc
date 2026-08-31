'use client';

import { useEffect, useMemo, useState } from 'react';

import { MS_PER_SECOND } from '@/lib/constants';

/**
 * 현재 시각 — 지정한 주기마다 갱신되므로 카운트다운·입장 시간 게이팅 표시에 사용한다.
 * 마감·입장 판정의 기준값(마감 시각·공연 시작 시각)은 전부 서버가 내려준 값이다.
 */
export function useAppClock(intervalMs: number = MS_PER_SECOND): Date {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return useMemo(() => new Date(), [tick]);
}
