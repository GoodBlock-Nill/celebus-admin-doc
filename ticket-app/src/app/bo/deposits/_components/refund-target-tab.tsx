'use client';

import { formatKrw } from '@/lib/format';
import { useTicketStore } from '@/lib/store';
import { ConfirmDialog } from '../../_components/confirm-dialog';
import { DataTable } from '../../_components/data-table';
import type { Column } from '../../_components/data-table';
import { Button } from '../../_components/form';
import { useConfirm } from '../../_components/hooks';
import { useToast } from '../../_components/toast';
import { InfoNote } from '../../_components/ui';
import { amountColumn, depositedAtColumn, depositorColumn, memoColumn } from './deposit-columns';
import type { DepositRow } from './deposit-rows';

/** ④ 환불 대상 — 마감 이후 입금 등 예매와 연결할 수 없는 입금 */
export function RefundTargetTab({ rows }: { rows: DepositRow[] }) {
  const refundDeposit = useTicketStore((state) => state.refundDeposit);
  const toast = useToast();
  const confirm = useConfirm();

  const columns: Array<Column<DepositRow>> = [
    depositorColumn,
    amountColumn,
    depositedAtColumn,
    memoColumn,
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
              message: `${row.deposit.depositorName} 님에게 ${formatKrw(
                row.deposit.amountKrw,
              )}을 반환한 것으로 기록합니다. 되돌릴 수 없습니다.`,
              confirmLabel: '환불 완료 처리',
              confirmVariant: 'danger',
              onConfirm: () => {
                const result = refundDeposit(row.deposit.id);
                toast.fromResult(
                  result,
                  `${row.deposit.depositorName} · ${formatKrw(row.deposit.amountKrw)} 반환 처리했습니다.`,
                );
              },
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
        입금 마감 이후 입금, 취소된 주문에 대한 입금 등 티켓으로 연결할 수 없는 건입니다. 계좌로 반환한 뒤 완료 처리해
        주세요.
      </InfoNote>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.deposit.id}
        emptyText="반환 대상 입금이 없습니다."
        minWidth="720px"
      />
      <ConfirmDialog request={confirm.request} onClose={confirm.close} />
    </div>
  );
}
