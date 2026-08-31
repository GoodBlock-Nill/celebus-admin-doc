'use client';

import { useEffect, useMemo, useState } from 'react';

import { MS_PER_SECOND } from '@/lib/constants';
import { useTicketStore } from '@/lib/store';

/** 마감 자동 취소 점검 주기 — 30초 */
const ORDER_EXPIRY_INTERVAL_MS = 30 * MS_PER_SECOND;

/**
 * 데모 시간 이동을 반영한 현재 시각.
 * 지정한 주기마다 갱신되므로 카운트다운 표시에 사용한다.
 */
export function useAppClock(intervalMs: number = MS_PER_SECOND): Date {
  const demoOffsetMs = useTicketStore((state) => state.demoOffsetMs);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return useMemo(() => new Date(Date.now() + demoOffsetMs), [demoOffsetMs, tick]);
}

/** 입금 마감이 지난 주문을 자동 취소 반영 — 진입 시 1회 + 30초 주기 */
export function useOrderExpiry(): void {
  const expireOverdueOrders = useTicketStore((state) => state.expireOverdueOrders);

  useEffect(() => {
    expireOverdueOrders();
    const timer = window.setInterval(expireOverdueOrders, ORDER_EXPIRY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [expireOverdueOrders]);
}
