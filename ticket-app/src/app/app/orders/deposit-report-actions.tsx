'use client';

import { useState } from 'react';

import { GHOST_BUTTON, MUTED, PRIMARY_BUTTON } from '../_components/ui';
import { depositReportCaption, isDepositReportExhausted } from './deposit-report-limit';
import { api } from '@/lib/api-client';
import type { OrderDetailView } from '@/lib/api-types';

interface DepositReportActionsProps {
  order: OrderDetailView;
  /** 처리 성공 후 예매 상세를 다시 불러온다 */
  onDone: () => void;
  /** 실패 사유를 상세 화면 상단 안내에 전달한다 */
  onFail: (reason: string) => void;
}

/**
 * 입금확인 요청 · 요청 취소 버튼.
 * 요청은 예매를 확정짓는 처리가 아니라 "입금했다"는 신호이며, 운영자 확인 뒤 입금 확인으로 바뀐다.
 */
export function DepositReportActions({ order, onDone, onFail }: DepositReportActionsProps) {
  const [isSubmitting, setSubmitting] = useState(false);

  const run = async (kind: 'REPORT' | 'CANCEL') => {
    if (isSubmitting) return;

    setSubmitting(true);
    const result =
      kind === 'REPORT' ? await api.reportDeposit(order.id) : await api.cancelDepositReport(order.id);
    setSubmitting(false);

    onFail(result.ok ? '' : result.reason);
    if (result.ok) onDone();
  };

  if (order.status === 'AWAITING_DEPOSIT') {
    // 요청 횟수를 다 쓰면 눌러도 서버가 거부하므로 화면에서 먼저 잠그고 이유를 알린다.
    const isExhausted = isDepositReportExhausted(order);
    const caption = depositReportCaption(order);

    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={isSubmitting || isExhausted}
          onClick={() => void run('REPORT')}
          className={PRIMARY_BUTTON}
        >
          입금확인 요청
        </button>
        <p className={`px-1 text-[12.5px] leading-relaxed ${MUTED}`}>
          {caption ?? '입금을 마치셨다면 눌러 주세요. 운영자가 입금 내역을 확인합니다.'}
        </p>
      </div>
    );
  }

  if (order.status === 'DEPOSIT_REPORTED') {
    return (
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => void run('CANCEL')}
        className={GHOST_BUTTON}
      >
        입금확인 요청 취소
      </button>
    );
  }

  return null;
}
