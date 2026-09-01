'use client';

import { useState } from 'react';

import { ConfirmDialog } from '../../_components/confirm-dialog';
import { Button } from '../../_components/form';
import { useConfirm } from '../../_components/hooks';
import { useToast } from '../../_components/toast';
import { InfoNote } from '../../_components/ui';
import { adminApi } from '@/lib/admin-client';

interface ConcertCancelActionProps {
  concertId: string;
  concertTitle: string;
  /** 일괄 처리 대상이 되는 진행중 예매 건수 — 확인 문구에 미리 알린다 */
  activeOrderCount: number;
  onDone: () => void;
}

/**
 * 공연 취소 — 공연을 닫고 소속 예매를 상태에 맞게 한 번에 정리한다.
 * 되돌릴 수 없고 회원의 돈이 움직이는 처리라 확인을 두 번 받는다.
 */
export function ConcertCancelAction({
  concertId,
  concertTitle,
  activeOrderCount,
  onDone,
}: ConcertCancelActionProps) {
  const toast = useToast();
  const firstStep = useConfirm();
  const finalStep = useConfirm();
  const [submitting, setSubmitting] = useState(false);

  const cancelConcert = async () => {
    setSubmitting(true);
    const result = await adminApi.cancelConcert(concertId);
    setSubmitting(false);

    toast.fromResult(
      result,
      result.ok
        ? `공연을 취소했습니다. (환불 대상 ${result.data.refund_requested ?? 0}건 · 자동 취소 ${
            result.data.expired ?? 0
          }건 · 티켓 회수 ${result.data.revoked_tickets ?? 0}매)`
        : '',
    );
    if (result.ok) onDone();
  };

  const askFinal = () =>
    finalStep.ask({
      title: '정말 공연을 취소할까요?',
      message: (
        <>
          확인을 누르면 즉시 처리되며 되돌릴 수 없습니다. 판매 상태도 다시 변경할 수 없습니다.
          <span className="mt-2 block font-semibold text-[#1B1D22]">{concertTitle}</span>
        </>
      ),
      confirmLabel: '공연 취소 확정',
      confirmVariant: 'danger',
      onConfirm: () => void cancelConcert(),
    });

  const askCancel = () =>
    firstStep.ask({
      title: '공연을 취소할까요?',
      message: (
        <>
          진행중인 예매 {activeOrderCount}건이 함께 정리됩니다.
          <span className="mt-2 block">
            · 티켓 지급·입금 확인·확인 보류 예매와 입금이 들어온 예매 → 환불 대상(취소 요청)으로 전환되고
            지급된 티켓은 회수됩니다.
            <br />· 입금이 없는 입금 대기·입금 확인중 예매 → 자동 취소되고 좌석이 반환됩니다.
          </span>
        </>
      ),
      confirmLabel: '다음',
      confirmVariant: 'danger',
      onConfirm: askFinal,
    });

  return (
    <div className="flex flex-col gap-3">
      <InfoNote tone="danger">
        공연이 열리지 못하게 된 경우에만 사용합니다. 취소하면 앱에서 예매가 막히고, 회원에게는 공연 취소
        안내가 표시됩니다. 환불 대상으로 전환된 예매는 취소·환불 화면에서 계좌를 확인해 환불을 승인해
        주세요.
      </InfoNote>
      <div>
        <Button variant="danger" disabled={submitting} onClick={askCancel}>
          공연 취소
        </Button>
      </div>

      <ConfirmDialog request={firstStep.request} onClose={firstStep.close} />
      <ConfirmDialog request={finalStep.request} onClose={finalStep.close} />
    </div>
  );
}
