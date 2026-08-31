'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '@/lib/api-client';
import { MS_PER_SECOND } from '@/lib/constants';

/** 토큰 재발급 주기 — 서버 유효시간(60초)보다 짧게 잡아 만료 공백을 없앤다. */
const REFRESH_INTERVAL_MS = 55 * MS_PER_SECOND;

export type QrTokenState =
  | { status: 'LOADING' }
  | { status: 'ERROR'; reason: string }
  | { status: 'READY'; token: string; expiresAt: string };

/**
 * 입장 QR 서명 토큰 상태 — 화면 진입 시 발급받고 만료 전에 자동으로 다시 받는다.
 * 입장 가능 시간 판정은 서버가 하므로, 시간 밖이면 실패 사유를 그대로 화면에 노출한다.
 */
export function useQrToken(ticketId: string, enabled: boolean): QrTokenState {
  const [state, setState] = useState<QrTokenState>({ status: 'LOADING' });
  const activeRef = useRef(true);

  const load = useCallback(async () => {
    const result = await api.ticketQr(ticketId);
    if (!activeRef.current) return;
    setState(
      result.ok
        ? { status: 'READY', token: result.data.token, expiresAt: result.data.expiresAt }
        : { status: 'ERROR', reason: result.reason },
    );
  }, [ticketId]);

  useEffect(() => {
    if (!enabled) return;

    activeRef.current = true;
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_INTERVAL_MS);

    return () => {
      activeRef.current = false;
      window.clearInterval(timer);
    };
  }, [enabled, load]);

  return state;
}
