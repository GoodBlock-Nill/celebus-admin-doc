'use client';

import { DataTable } from '../../_components/data-table';
import type { Column } from '../../_components/data-table';
import { Button } from '../../_components/form';
import { useToast } from '../../_components/toast';
import { InfoNote } from '../../_components/ui';
import { adminApi } from '@/lib/admin-client';
import type { AdminOrderView } from '@/lib/admin-types';
import { formatDateTime, formatKrw } from '@/lib/format';

/** ② 지급 대기 — 입금 확인이 끝나 운영자의 티켓 지급 처리만 남은 주문 */
export function IssuePendingTab({ rows, onDone }: { rows: AdminOrderView[]; onDone: () => void }) {
  const toast = useToast();

  const handleIssue = async (row: AdminOrderView) => {
    const result = await adminApi.issueOrderTickets(row.id);
    toast.fromResult(result, `주문 ${row.orderNo} 티켓 ${row.qty}매를 지급했습니다.`);
    if (result.ok) onDone();
  };

  const columns: Array<Column<AdminOrderView>> = [
    {
      key: 'orderNo',
      header: '주문번호',
      width: '130px',
      render: (row) => <span className="font-semibold tabular-nums">{row.orderNo}</span>,
    },
    {
      key: 'user',
      header: '주문자',
      width: '160px',
      render: (row) => (
        <span>
          {row.party.realName}
          <span className="ml-1 text-[12px] text-[#6B7080]">
            {row.party.nickname ? `(${row.party.nickname})` : ''}
          </span>
        </span>
      ),
    },
    {
      key: 'session',
      header: '회차',
      render: (row) => <span className="text-[12px] text-[#4A4E5A]">{row.sessionName}</span>,
    },
    { key: 'qty', header: '매수', numeric: true, width: '70px', render: (row) => `${row.qty}매` },
    {
      key: 'amount',
      header: '입금 금액',
      numeric: true,
      width: '110px',
      render: (row) => formatKrw(row.amountKrw),
    },
    {
      key: 'confirmedAt',
      header: '입금 확정 시각',
      width: '150px',
      render: (row) => (
        <span className="whitespace-nowrap tabular-nums text-[12px] text-[#4A4E5A]">
          {row.depositConfirmedAt ? formatDateTime(row.depositConfirmedAt) : '-'}
        </span>
      ),
    },
    {
      key: 'action',
      header: '처리',
      align: 'right',
      width: '120px',
      render: (row) => (
        <Button variant="primary" size="sm" onClick={() => void handleIssue(row)}>
          티켓 지급
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <InfoNote>
        입금이 확인된 주문입니다. 좌석은 선점 상태로 유지되며, 티켓 지급 처리를 해야 실명 티켓이 발급되고 회원 앱의
        내 티켓에 표시됩니다.
      </InfoNote>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        emptyText="티켓 지급을 기다리는 주문이 없습니다."
        minWidth="900px"
      />
    </div>
  );
}
