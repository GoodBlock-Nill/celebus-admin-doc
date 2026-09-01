'use client';

import { DataTable } from '../../_components/data-table';
import type { Column } from '../../_components/data-table';
import { Button } from '../../_components/form';
import { useToast } from '../../_components/toast';
import { Badge, InfoNote } from '../../_components/ui';
import { adminApi } from '@/lib/admin-client';
import type { AdminOrderView } from '@/lib/admin-types';
import { formatDateTime, formatKrw } from '@/lib/format';

/** ① 입금 확인 요청 — 회원이 "입금했다"고 알린 주문 (우선 확인 대상) */
export function ReportedTab({ rows, onDone }: { rows: AdminOrderView[]; onDone: () => void }) {
  const toast = useToast();

  const handleReject = async (row: AdminOrderView) => {
    const result = await adminApi.rejectDepositReport(row.id);
    toast.fromResult(result, `주문 ${row.orderNo} 미입금 반려 — 입금 대기로 되돌렸습니다.`);
    if (result.ok) onDone();
  };

  const columns: Array<Column<AdminOrderView>> = [
    {
      key: 'orderNo',
      header: '주문번호',
      width: '150px',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold tabular-nums">{row.orderNo}</span>
          <Badge tone="accent">회원 요청</Badge>
        </div>
      ),
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
      key: 'reportedAt',
      header: '요청 시각',
      width: '150px',
      render: (row) => (
        <span className="whitespace-nowrap tabular-nums text-[12px] text-[#4A4E5A]">
          {row.depositReportedAt ? formatDateTime(row.depositReportedAt) : '-'}
        </span>
      ),
    },
    {
      key: 'action',
      header: '처리',
      align: 'right',
      width: '130px',
      render: (row) => (
        <Button variant="danger" size="sm" onClick={() => void handleReject(row)}>
          미입금 반려
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <InfoNote>
        회원이 입금을 마쳤다고 알린 주문입니다. 은행 입금 내역에서 금액·입금자명을 찾아 위 입금 등록으로 처리하면
        자동 대조되고, 확인 대기 탭에서 입금 확인을 누르면 됩니다. 요청 건은 입금 마감이 지나도 자동 취소되지
        않으니 우선 확인해 주세요. 입금이 확인되지 않으면 미입금 반려로 입금 대기 상태에 되돌립니다.
      </InfoNote>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        emptyText="입금 확인 요청이 없습니다."
        minWidth="940px"
      />
    </div>
  );
}
