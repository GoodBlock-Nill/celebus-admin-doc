'use client';

import { useTicketStore } from '@/lib/store';
import { DataTable } from '../../_components/data-table';
import type { Column } from '../../_components/data-table';
import { Button } from '../../_components/form';
import { useToast } from '../../_components/toast';
import { InfoNote } from '../../_components/ui';
import {
  amountColumn,
  depositedAtColumn,
  depositorColumn,
  orderColumn,
} from './deposit-columns';
import type { DepositRow } from './deposit-rows';

/** ① 확인 대기 — 자동 대조가 끝나 운영자 확인만 남은 입금 */
export function PendingTab({ rows }: { rows: DepositRow[] }) {
  const confirmDeposit = useTicketStore((state) => state.confirmDeposit);
  const toast = useToast();

  const handleConfirm = (row: DepositRow) => {
    const result = confirmDeposit(row.deposit.id);
    toast.fromResult(
      result,
      `주문 ${row.order?.orderNo ?? ''} 입금 확정 — 티켓 ${row.order?.qty ?? 0}매를 지급했습니다.`,
    );
  };

  const columns: Array<Column<DepositRow>> = [
    depositorColumn,
    amountColumn,
    depositedAtColumn,
    orderColumn,
    {
      key: 'action',
      header: '처리',
      align: 'right',
      width: '120px',
      render: (row) => (
        <Button variant="primary" size="sm" onClick={() => handleConfirm(row)}>
          입금 확인
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <InfoNote>
        자동 대조는 금액 완전 일치 + 실명(또는 실명 + 주문번호 끝 4자리) 기준으로 이뤄집니다. 최종 확정은 운영자 확인
        후 처리되며, 확인 즉시 실명 티켓이 발급됩니다.
      </InfoNote>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.deposit.id}
        emptyText="확인 대기 중인 입금이 없습니다."
        minWidth="760px"
      />
    </div>
  );
}
