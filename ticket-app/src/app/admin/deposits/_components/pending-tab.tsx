'use client';

import { DataTable } from '../../_components/data-table';
import type { Column } from '../../_components/data-table';
import { Button } from '../../_components/form';
import { useToast } from '../../_components/toast';
import { InfoNote } from '../../_components/ui';
import { amountColumn, depositedAtColumn, depositorColumn, orderColumn } from './deposit-columns';
import { adminApi } from '@/lib/admin-client';
import type { AdminDepositView } from '@/lib/admin-types';

/** ② 확인 대기 — 자동 대조가 끝나 운영자 확인만 남은 입금 */
export function PendingTab({ rows, onDone }: { rows: AdminDepositView[]; onDone: () => void }) {
  const toast = useToast();

  const handleConfirm = async (row: AdminDepositView) => {
    const result = await adminApi.confirmDeposit(row.id);
    toast.fromResult(result, `주문 ${row.order?.orderNo ?? ''} 입금 확인 — 티켓 지급 대기로 전환되었습니다.`);
    if (result.ok) onDone();
  };

  const columns: Array<Column<AdminDepositView>> = [
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
        <Button variant="primary" size="sm" onClick={() => void handleConfirm(row)}>
          입금 확인
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <InfoNote>
        자동 대조는 금액 완전 일치 + 실명(또는 실명 + 주문번호 끝 4자리) 기준으로 이뤄집니다. 입금 확인 후 티켓 지급
        대기로 전환되며, 티켓 지급 대기 탭에서 지급 처리를 해야 티켓이 발급됩니다.
      </InfoNote>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        emptyText="확인 대기 중인 입금이 없습니다."
        minWidth="760px"
      />
    </div>
  );
}
