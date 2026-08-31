'use client';

import { useCallback, useEffect, useRef } from 'react';

/** 딥링크 실행 후 이 시간 안에 화면이 가려지지 않으면 토스 앱이 없는 환경으로 본다. */
const TOSS_FALLBACK_MS = 1500;

/** 숫자만 남긴다 — 계좌번호의 하이픈을 제거할 때 사용 */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** 토스 송금 화면 딥링크 — 은행·계좌번호·금액을 미리 채운다. */
export function buildTossSendUrl(bankName: string, account: string, amountKrw: number): string {
  const params = new URLSearchParams({
    amount: String(amountKrw),
    bank: bankName,
    accountNo: digitsOnly(account),
  });
  return `supertoss://send?${params.toString()}`;
}

/**
 * 토스 송금 딥링크 실행기.
 * 앱이 열리면 화면이 가려지므로(visibilitychange) 안내를 생략하고,
 * 화면이 그대로 남아 있으면 앱이 없는 환경으로 보고 안내를 호출한다.
 */
export function useTossTransfer(onUnavailable: () => void): (url: string) => void {
  const timerRef = useRef<number | null>(null);
  const handlerRef = useRef(onUnavailable);

  useEffect(() => {
    handlerRef.current = onUnavailable;
  }, [onUnavailable]);

  const clearTimer = useCallback(() => {
    if (timerRef.current === null) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') clearTimer();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', clearTimer);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', clearTimer);
      clearTimer();
    };
  }, [clearTimer]);

  return useCallback(
    (url: string) => {
      clearTimer();
      window.location.href = url;
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        handlerRef.current();
      }, TOSS_FALLBACK_MS);
    },
    [clearTimer],
  );
}
