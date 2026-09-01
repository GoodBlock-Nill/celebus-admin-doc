'use client';

import { ConfirmDialog } from '../../_components/confirm-dialog';
import { DataTable } from '../../_components/data-table';
import type { Column } from '../../_components/data-table';
import { Button } from '../../_components/form';
import { useConfirm } from '../../_components/hooks';
import { useToast } from '../../_components/toast';
import { InfoNote } from '../../_components/ui';
import { RecentIssuedList } from './recent-issued-list';
import { adminApi } from '@/lib/admin-client';
import type { AdminIssuedOrderView, AdminOrderView } from '@/lib/admin-types';
import { formatDateTime, formatKrw } from '@/lib/format';

interface IssuePendingTabProps {
  rows: AdminOrderView[];
  /** 최근 지급 완료 — 오지급을 되돌리는 소목록 */
  recentIssued: AdminIssuedOrderView[];
  onDone: () => void;
}

/** ③ 티켓 지급 대기 — 입금 확인이 끝나 운영자의 티켓 지급 처리만 남은 주문 */
export function IssuePendingTab({ rows, recentIssued, onDone }: IssuePendingTabProps) {
  const toast = useToast();
  const confirm = useConfirm();

  const handleIssue = async (row: AdminOrderView) => {
    const result = await adminApi.issueOrderTickets(row.id);
    toast.fromResult(result, `주문 ${row.orderNo} 티켓 ${row.qty}매를 지급했습니다.`);
    if (result.ok) onDone();
  };

  const undoConfirm = async (row: AdminOrderView) => {
    const result = await adminApi.undoConfirmDeposit(row.id);
    toast.fromResult(result, `주문 ${row.orderNo} 입금 확인을 취소하고 입금 대기로 되돌렸습니다.`);
    if (result.ok) onDone();
  };

  const askUndoConfirm = (row: AdminOrderView) =>
    confirm.ask({
      title: '입금 확인을 취소할까요?',
      message: `주문 ${row.orderNo}을(를) 입금 대기로 되돌립니다. 연결된 입금은 확인 대기로 돌아가고, 입금 마감이 지났다면 오늘 자정까지 연장됩니다.`,
      confirmLabel: '입금 확인 취소',
      confirmVariant: 'danger',
      onConfirm: () => void undoConfirm(row),
    });

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
      width: '230px',
      render: (row) => (
        <div className="flex flex-wrap justify-end gap-1.5">
          <Button variant="primary" size="sm" onClick={() => void handleIssue(row)}>
            티켓 지급
          </Button>
          <Button variant="danger" size="sm" onClick={() => askUndoConfirm(row)}>
            입금 확인 취소
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <InfoNote>
        입금이 확인된 주문입니다. 좌석은 선점 상태로 유지되며, 티켓 지급 처리를 해야 실명 티켓이 발급되고 회원
        예매내역·CELEBUS 앱 지급으로 반영됩니다. 티켓 지급 처리는 공연 당일 CELEBUS 앱 발권 일정에 맞춰 진행하는
        것이 원칙입니다. 잘못 확인한 건은 입금 확인 취소로 입금 대기에 되돌릴 수 있습니다.
      </InfoNote>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        emptyText="티켓 지급을 기다리는 주문이 없습니다."
        minWidth="1020px"
      />
      <RecentIssuedList rows={recentIssued} onDone={onDone} />
      <ConfirmDialog request={confirm.request} onClose={confirm.close} />
    </div>
  );
}
