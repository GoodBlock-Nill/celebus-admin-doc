'use client';

import { useState } from 'react';

import type { ConfirmRequest } from '../../_components/confirm-dialog';
import { useToast } from '../../_components/toast';
import { DEFAULT_VOID_REASON } from './deposit-void-form';
import { adminApi } from '@/lib/admin-client';
import type { AdminDepositView } from '@/lib/admin-types';
import { formatKrw } from '@/lib/format';

interface ConfirmApi {
  ask: (request: ConfirmRequest) => void;
}

/**
 * 입금 등록 취소 처리 묶음 (B-13).
 * 사유를 입력받고 확인을 한 번 더 받은 뒤에만 무효로 돌린다.
 */
export function useVoidDeposit(confirm: ConfirmApi, onDone: () => void) {
  const toast = useToast();
  const [reason, setReason] = useState(DEFAULT_VOID_REASON);

  const submit = async (row: AdminDepositView) => {
    const result = await adminApi.voidDeposit(row.id, reason.trim());
    toast.fromResult(result, `${row.depositorName} 입금 등록을 취소했습니다.`);
    if (result.ok) onDone();
  };

  const ask = (row: AdminDepositView) =>
    confirm.ask({
      title: '입금 등록을 취소할까요?',
      message: `${row.depositorName} · ${formatKrw(row.amountKrw)} 입금을 등록 취소합니다. 이 입금 때문에 보류된 예매가 있다면 보류도 함께 해제됩니다. (사유: ${reason.trim()})`,
      confirmLabel: '등록 취소',
      confirmVariant: 'danger',
      onConfirm: () => void submit(row),
    });

  const resetReason = () => setReason(DEFAULT_VOID_REASON);

  return { reason, setReason, resetReason, ask };
}
