'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ApiResult } from '@/lib/api-client';

export type ResourceState<T> =
  | { status: 'LOADING' }
  | { status: 'ERROR'; reason: string }
  | { status: 'READY'; data: T };

/**
 * 서버 조회 공통 훅 — 로딩·오류·완료 3상태를 화면에 그대로 전달한다.
 * loader는 useCallback으로 감싸 전달해야 불필요한 재조회가 발생하지 않는다.
 */
export function useApiResource<T>(loader: () => Promise<ApiResult<T>>) {
  const [state, setState] = useState<ResourceState<T>>({ status: 'LOADING' });

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
