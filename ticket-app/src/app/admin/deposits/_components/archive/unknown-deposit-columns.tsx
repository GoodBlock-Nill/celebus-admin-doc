'use client';

import type { Column } from '../../../_components/data-table';
import { Button } from '../../../_components/form';
import {
  amountColumn,
  depositedAtColumn,
  depositorColumn,
  holdSubmissionColumn,
  matchHintColumn,
  memoColumn,
  orderColumn,
  statusColumn,
} from '../deposit-columns';
import type { AdminDepositView } from '@/lib/admin-types';

/** 주문 미상 입금 처리 구분 */
export type UnknownFormKind = 'match' | 'refund' | 'void';

const ACTION_LABEL: Record<UnknownFormKind, string> = {
  match: '수동 매칭',
  refund: '반환 대상 지정',
  void: '등록 취소',
};

const ACTION_ORDER: UnknownFormKind[] = ['match', 'refund', 'void'];

/** 대조 필요 목록 — 어느 예매의 돈인지 아직 정하지 못한 입금 */
export function buildUnknownColumns(
  onOpen: (depositId: string, kind: UnknownFormKind) => void,
): Array<Column<AdminDepositView>> {
  return [
    depositorColumn,
    amountColumn,
    depositedAtColumn,
    statusColumn,
    memoColumn,
    matchHintColumn,
    {
      key: 'action',
      header: '처리',
      align: 'right',
      width: '250px',
      render: (row) => (
        <div className="flex flex-wrap justify-end gap-1.5">
          {ACTION_ORDER.map((kind) => (
            <Button
              key={kind}
              size="sm"
              variant={kind === 'match' ? 'secondary' : 'danger'}
              onClick={() => onOpen(row.id, kind)}
            >
              {ACTION_LABEL[kind]}
            </Button>
          ))}
        </div>
      ),
    },
  ];
}

/** 반환 대상 목록 — 돌려줘야 할 입금 */
export function buildRefundTargetColumns(
  onRefund: (row: AdminDepositView) => void,
): Array<Column<AdminDepositView>> {
  return [
    depositorColumn,
    amountColumn,
    depositedAtColumn,
    memoColumn,
    orderColumn,
    holdSubmissionColumn,
    {
      key: 'action',
      header: '처리',
      align: 'right',
      width: '150px',
      render: (row) => (
        <Button variant="danger" size="sm" onClick={() => onRefund(row)}>
          환불 완료 처리
        </Button>
      ),
    },
  ];
}
