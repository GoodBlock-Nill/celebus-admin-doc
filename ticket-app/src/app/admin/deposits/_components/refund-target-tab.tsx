'use client';

import { ConfirmDialog } from '../../_components/confirm-dialog';
import { DataTable } from '../../_components/data-table';
import type { Column } from '../../_components/data-table';
import { Button } from '../../_components/form';
import { useConfirm } from '../../_components/hooks';
import { useToast } from '../../_components/toast';
import { InfoNote } from '../../_components/ui';
import {
  amountColumn,
  depositedAtColumn,
  depositorColumn,
  holdSubmissionColumn,
  memoColumn,
  orderColumn,
} from './deposit-columns';
import { adminApi } from '@/lib/admin-client';
import type { AdminDepositView } from '@/lib/admin-types';
import { formatKrw } from '@/lib/format';

/** ④ 환불 대상 — 마감 이후 입금 등 예매와 연결할 수 없는 입금 */
export function RefundTargetTab({ rows, onDone }: { rows: AdminDepositView[]; onDone: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();

  const handleRefund = async (row: AdminDepositView) => {
    const result = await adminApi.refundDeposit(row.id);
    toast.fromResult(result, `${row.depositorName} · ${formatKrw(row.amountKrw)} 반환 처리했습니다.`);
    if (result.ok) onDone();
  };

  const columns: Array<Column<AdminDepositView>> = [
    depositorColumn,
    amountColumn,
    depositedAtColumn,
    memoColumn,
    // 마감·취소 이후 입금은 어느 예매의 돈인지 연결이 남아 있다 — 회원 확인의 근거가 된다.
    orderColumn,
    // 보류 반려로 넘어온 건은 회원이 등록한 환불 계좌로 반환해야 한다.
    holdSubmissionColumn,
    {
      key: 'action',
      header: '처리',
      align: 'right',
      width: '150px',
      render: (row) => (
        <Button
          variant="danger"
          size="sm"
          onClick={() =>
            confirm.ask({
              title: '환불 완료로 처리할까요?',
              message: `${row.depositorName} 님에게 ${formatKrw(
                row.amountKrw,
              )}을 반환한 것으로 기록합니다. 되돌릴 수 없습니다.`,
              confirmLabel: '환불 완료 처리',
              confirmVariant: 'danger',
              onConfirm: () => void handleRefund(row),
            })
          }
        >
          환불 완료 처리
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <InfoNote tone="danger">
        입금 마감 이후 입금, 취소된 주문에 대한 입금 등 티켓으로 연결할 수 없는 건입니다. 매칭 주문이 남아 있으면 그
        회원에게 돌려줄 돈이며, 회원이 등록한 환불 계좌는 &lsquo;회원이 알린 정보&rsquo;에 표시됩니다. 계좌로 반환한
        뒤 완료 처리해 주세요.
      </InfoNote>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        emptyText="반환 대상 입금이 없습니다."
        minWidth="1240px"
      />
      <ConfirmDialog request={confirm.request} onClose={confirm.close} />
    </div>
  );
}
