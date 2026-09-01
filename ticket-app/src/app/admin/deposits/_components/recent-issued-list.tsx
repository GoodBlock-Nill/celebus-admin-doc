'use client';

import { ConfirmDialog } from '../../_components/confirm-dialog';
import { DataTable } from '../../_components/data-table';
import type { Column } from '../../_components/data-table';
import { Button } from '../../_components/form';
import { useConfirm } from '../../_components/hooks';
import { useToast } from '../../_components/toast';
import { Collapsible, InfoNote } from '../../_components/ui';
import { adminApi } from '@/lib/admin-client';
import type { AdminIssuedOrderView } from '@/lib/admin-types';
import { formatDateTime } from '@/lib/format';

/**
 * 최근 지급 완료 — 잘못 지급한 티켓을 되돌리기 위한 소목록.
 * 지급 취소는 티켓을 회수하고 좌석을 다시 선점 상태로 돌리므로 확인 후에만 처리한다.
 */
export function RecentIssuedList({
  rows,
  onDone,
}: {
  rows: AdminIssuedOrderView[];
  onDone: () => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();

  const undoIssue = async (row: AdminIssuedOrderView) => {
    const result = await adminApi.undoIssueTickets(row.id);
    toast.fromResult(result, `주문 ${row.orderNo} 티켓 지급을 취소하고 ${row.qty}매를 회수했습니다.`);
    if (result.ok) onDone();
  };

  const askUndoIssue = (row: AdminIssuedOrderView) =>
    confirm.ask({
      title: '티켓 지급을 취소할까요?',
      message: `주문 ${row.orderNo}의 티켓 ${row.qty}매를 회수하고 티켓 지급 대기로 되돌립니다. 이미 입장에 사용된 티켓이 있으면 되돌릴 수 없습니다.`,
      confirmLabel: '지급 취소',
      confirmVariant: 'danger',
      onConfirm: () => void undoIssue(row),
    });

  const columns: Array<Column<AdminIssuedOrderView>> = [
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
      key: 'issuedAt',
      header: '지급 시각',
      width: '150px',
      render: (row) => (
        <span className="whitespace-nowrap tabular-nums text-[12px] text-[#4A4E5A]">
          {formatDateTime(row.issuedAt)}
        </span>
      ),
    },
    {
      key: 'action',
      header: '처리',
      align: 'right',
      width: '110px',
      render: (row) => (
        <Button variant="danger" size="sm" onClick={() => askUndoIssue(row)}>
          지급 취소
        </Button>
      ),
    },
  ];

  return (
    <Collapsible summary={`최근 지급 완료 (${rows.length}건)`}>
      <div className="flex flex-col gap-3">
        <InfoNote tone="warning">
          잘못 지급한 건을 되돌리는 목록입니다. 지급 취소는 티켓을 회수하고 좌석을 선점 상태로 되돌리며,
          예매는 티켓 지급 대기로 돌아갑니다. 이미 입장에 사용된 티켓이 있으면 처리되지 않습니다.
        </InfoNote>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          emptyText="최근 지급 완료된 주문이 없습니다."
          minWidth="900px"
        />
        <ConfirmDialog request={confirm.request} onClose={confirm.close} />
      </div>
    </Collapsible>
  );
}
