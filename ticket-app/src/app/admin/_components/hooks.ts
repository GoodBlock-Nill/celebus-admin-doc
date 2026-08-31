'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ConfirmRequest } from './confirm-dialog';
import { adminApi } from '@/lib/admin-client';
import type { AdminSummaryView } from '@/lib/admin-types';
import type { ApiResult } from '@/lib/api-client';
import { MS_PER_SECOND } from '@/lib/constants';

/** 처리 대기 건수 재조회 주기 */
const QUEUE_REFRESH_MS = 30 * MS_PER_SECOND;

/** 현재 시각 — 지정 주기로 갱신되며 처리 기한 카운트다운 표시에 사용한다. */
export function useNow(intervalMs: number = MS_PER_SECOND): Date {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return useMemo(() => new Date(), [tick]);
}

export type AdminResourceState<T> =
  | { status: 'LOADING' }
  | { status: 'ERROR'; reason: string }
  | { status: 'READY'; data: T };

/**
 * 관리자 화면 조회 공통 훅 — 로딩·오류·완료 3상태를 그대로 화면에 전달한다.
 * loader는 useCallback으로 감싸 전달해야 불필요한 재조회가 발생하지 않는다.
 */
export function useAdminResource<T>(loader: () => Promise<ApiResult<T>>) {
  const [state, setState] = useState<AdminResourceState<T>>({ status: 'LOADING' });

  const reload = useCallback(async () => {
    const result = await loader();
    setState(result.ok ? { status: 'READY', data: result.data } : { status: 'ERROR', reason: result.reason });
  }, [loader]);

  useEffect(() => {
    let isActive = true;
    void loader().then((result) => {
      if (!isActive) return;
      setState(result.ok ? { status: 'READY', data: result.data } : { status: 'ERROR', reason: result.reason });
    });
    return () => {
      isActive = false;
    };
  }, [loader]);

  return { state, reload };
}

/** 사이드바 뱃지용 처리 대기 건수 — 주기적으로 갱신한다. */
export function useQueueCounts(): AdminSummaryView | null {
  const [summary, setSummary] = useState<AdminSummaryView | null>(null);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      const result = await adminApi.summary();
      if (isActive && result.ok) setSummary(result.data.summary);
    };

    void load();
    const timer = window.setInterval(() => void load(), QUEUE_REFRESH_MS);
    return () => {
      isActive = false;
      window.clearInterval(timer);
    };
  }, []);

  return summary;
}

/** 확인 모달 상태 관리 */
export function useConfirm() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const close = useCallback(() => setRequest(null), []);
  const ask = useCallback((next: ConfirmRequest) => setRequest(next), []);
  return { request, ask, close };
}
