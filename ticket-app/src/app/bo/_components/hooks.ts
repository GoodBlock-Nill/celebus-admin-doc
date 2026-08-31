'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MS_PER_SECOND } from '@/lib/constants';
import { useTicketStore } from '@/lib/store';
import type { ConfirmRequest } from './confirm-dialog';

/** 입금 마감 자동 취소 점검 주기 */
const EXPIRE_INTERVAL_MS = 30 * MS_PER_SECOND;

/**
 * 데모 시각을 주기적으로 갱신해 돌려준다.
 * 시간 이동(demoOffsetMs) 변화에도 즉시 반응한다.
 */
export function useNow(intervalMs: number = MS_PER_SECOND): Date {
  const now = useTicketStore((state) => state.now);
  const demoOffsetMs = useTicketStore((state) => state.demoOffsetMs);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return useMemo(() => now(), [now, demoOffsetMs, tick]);
}

/** 화면 진입 시 + 30초마다 입금 마감 주문을 자동 취소 처리한다. */
export function useExpireOverdueOrders(): void {
  const expireOverdueOrders = useTicketStore((state) => state.expireOverdueOrders);

  useEffect(() => {
    expireOverdueOrders();
    const timer = window.setInterval(() => expireOverdueOrders(), EXPIRE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [expireOverdueOrders]);
}

export interface QueueCounts {
  depositPending: number;
  refundPending: number;
  reportPending: number;
}

/** 사이드바 뱃지·대시보드에서 함께 쓰는 처리 대기 건수 */
export function useQueueCounts(): QueueCounts {
  const deposits = useTicketStore((state) => state.deposits);
  const orders = useTicketStore((state) => state.orders);
  const reports = useTicketStore((state) => state.reports);

  return useMemo(
    () => ({
      // 입금 확인 대기 + 티켓 지급 대기를 함께 센다 (두 단계 모두 운영자 처리가 필요)
      depositPending:
        deposits.filter(
          (deposit) =>
            deposit.status === 'AUTO_MATCHED' ||
            deposit.status === 'UNMATCHED' ||
            deposit.status === 'HELD',
        ).length + orders.filter((order) => order.status === 'DEPOSIT_CONFIRMED').length,
      refundPending: orders.filter((order) => order.status === 'CANCEL_REQUESTED').length,
      reportPending: reports.filter((report) => report.status === 'RECEIVED').length,
    }),
    [deposits, orders, reports],
  );
}

/** 확인 모달 상태 관리 */
export function useConfirm() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const close = useCallback(() => setRequest(null), []);
  const ask = useCallback((next: ConfirmRequest) => setRequest(next), []);
  return { request, ask, close };
}
