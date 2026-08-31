'use client';

import { useState } from 'react';

import { ConfirmDialog } from '../../_components/confirm-dialog';
import { Button } from '../../_components/form';
import { useConfirm } from '../../_components/hooks';
import { CONCERT_STATUS_VIEW } from '../../_components/labels';
import { useToast } from '../../_components/toast';
import { InfoNote, StatusBadge } from '../../_components/ui';
import { adminApi } from '@/lib/admin-client';
import type { ConcertStatusTransition } from '@/lib/admin-types';
import type { ConcertStatus } from '@/lib/api-types';

interface StatusActionsProps {
  concertId: string;
  concertTitle: string;
  status: ConcertStatus;
  onDone: () => void;
}

const GUIDE: Record<ConcertStatus, string> = {
  UPCOMING: '판매를 시작하면 앱에서 예매 버튼이 열립니다. 판매 기간·회차 배정을 먼저 확인해 주세요.',
  ON_SALE: '판매를 종료하면 앱에서 새 예매를 받지 않습니다. 이미 접수된 주문과 티켓은 그대로 유지됩니다.',
  CLOSED: '판매가 종료된 공연입니다. 판매 상태는 더 이상 변경할 수 없습니다.',
};

/** 공연 판매 상태 전이 — 판매 예정 → 판매 중 → 판매 종료 (되돌릴 수 없음) */
export function ConcertStatusActions({ concertId, concertTitle, status, onDone }: StatusActionsProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [submitting, setSubmitting] = useState(false);

  const apply = async (next: ConcertStatusTransition, successMessage: string) => {
    setSubmitting(true);
    const result = await adminApi.setConcertStatus(concertId, next);
    setSubmitting(false);

    toast.fromResult(result, successMessage);
    if (result.ok) onDone();
  };

  const askStart = () =>
    confirm.ask({
      title: '판매를 시작할까요?',
      message: `${concertTitle} 공연이 앱에 공개되고 예매가 시작됩니다.`,
      confirmLabel: '판매 시작',
      onConfirm: () => void apply('ON_SALE', '판매를 시작했습니다.'),
    });

  const askClose = () =>
    confirm.ask({
      title: '판매를 종료할까요?',
      message: `${concertTitle} 공연의 예매가 즉시 마감되며 다시 열 수 없습니다.`,
      confirmLabel: '판매 종료',
      confirmVariant: 'danger',
      onConfirm: () => void apply('CLOSED', '판매를 종료했습니다.'),
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-[#6B7080]">현재 상태</span>
        <StatusBadge view={CONCERT_STATUS_VIEW[status]} />
      </div>

      <InfoNote tone={status === 'CLOSED' ? 'neutral' : 'accent'}>{GUIDE[status]}</InfoNote>

      {status !== 'CLOSED' ? (
        <div className="flex flex-wrap gap-2">
          {status === 'UPCOMING' ? (
            <Button variant="primary" disabled={submitting} onClick={askStart}>
              판매 시작
            </Button>
          ) : null}
          <Button variant="danger" disabled={submitting} onClick={askClose}>
            판매 종료
          </Button>
        </div>
      ) : null}

      <ConfirmDialog request={confirm.request} onClose={confirm.close} />
    </div>
  );
}
