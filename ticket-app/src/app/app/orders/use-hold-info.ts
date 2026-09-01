'use client';

import { useState } from 'react';

import { api, type HoldInfoInput, type HoldInfoResult } from '@/lib/api-client';

/**
 * 확인 보류 해결 정보 알리기 공통 처리.
 * 입금자명 블록과 환불 계좌 블록이 같은 방식으로 저장·오류 표시를 다룬다.
 */
export function useHoldInfoSubmit(orderId: string, onDone?: () => void) {
  const [isSubmitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const submit = async (input: HoldInfoInput): Promise<HoldInfoResult | null> => {
    if (isSubmitting) return null;

    setSubmitting(true);
    const result = await api.submitHoldInfo(orderId, input);
    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.reason);
      return null;
    }

    setErrorMessage('');
    onDone?.();
    return result.data;
  };

  return { isSubmitting, errorMessage, setErrorMessage, submit };
}
