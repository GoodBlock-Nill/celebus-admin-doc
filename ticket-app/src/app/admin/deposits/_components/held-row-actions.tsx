'use client';

import { Button } from '../../_components/form';
import type { AdminDepositView } from '@/lib/admin-types';

/**
 * 보류 행의 처리 손잡이.
 * 보류 반려는 예매 자체를 되돌리는 처리라 확인 보류 상태의 예매가 연결된 행에만 보여 준다.
 */
export function HeldRowActions({
  row,
  onConfirm,
  onMatch,
  onRefundTarget,
  onRejectHold,
  onVoid,
}: {
  row: AdminDepositView;
  onConfirm: () => void;
  onMatch: () => void;
  onRefundTarget: () => void;
  onRejectHold: () => void;
  /** 입금 등록 자체를 되돌린다 (은행 내역과 다르게 등록한 건) */
  onVoid: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {row.order ? (
        <Button variant="primary" size="sm" onClick={onConfirm}>
          입금 확인
        </Button>
      ) : null}
      <Button size="sm" onClick={onMatch}>
        수동 매칭
      </Button>
      <Button variant="danger" size="sm" onClick={onRefundTarget}>
        환불 대상 지정
      </Button>
      {row.order?.status === 'ON_HOLD' ? (
        <Button variant="danger" size="sm" onClick={onRejectHold}>
          보류 반려
        </Button>
      ) : null}
      <Button variant="danger" size="sm" onClick={onVoid}>
        등록 취소
      </Button>
    </div>
  );
}
