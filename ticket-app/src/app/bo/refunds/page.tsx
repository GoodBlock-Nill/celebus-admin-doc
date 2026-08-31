'use client';

import { useMemo } from 'react';
import { useTicketStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';
import type { Order } from '@/lib/types';
import { ConfirmDialog } from '../_components/confirm-dialog';
import { DataTable } from '../_components/data-table';
import { useConfirm, useNow } from '../_components/hooks';
import { useToast } from '../_components/toast';
import { Card, Collapsible, InfoNote, PageHeader } from '../_components/ui';
import {
  BASE_COLUMNS,
  REFUNDED_AT_COLUMN,
  approveColumn,
  slaColumn,
} from './_components/refund-columns';
import type { RefundRow } from './_components/refund-columns';

export default function RefundsPage() {
  const hydrated = useHydrated();
  const now = useNow();
  const orders = useTicketStore((state) => state.orders);
  const tickets = useTicketStore((state) => state.tickets);
  const users = useTicketStore((state) => state.users);
  const verifications = useTicketStore((state) => state.verifications);
  const approveRefund = useTicketStore((state) => state.approveRefund);
  const toast = useToast();
  const confirm = useConfirm();

  const { pendingRows, doneRows } = useMemo(() => {
    const toRow = (order: Order): RefundRow => ({
      order,
      realName: verifications.find((item) => item.userId === order.userId)?.realName,
      nickname: users.find((item) => item.id === order.userId)?.nickname,
      ticketCount: tickets.filter(
        (ticket) => ticket.orderId === order.id && ticket.status !== 'REVOKED',
      ).length,
    });

    return {
      pendingRows: orders
        .filter((order) => order.status === 'CANCEL_REQUESTED')
        .slice()
        .sort(
          (a, b) =>
            new Date(a.cancelRequestedAt ?? a.createdAt).getTime() -
            new Date(b.cancelRequestedAt ?? b.createdAt).getTime(),
        )
        .map(toRow),
      doneRows: orders
        .filter((order) => order.status === 'REFUNDED')
        .slice()
        .sort((a, b) => new Date(b.refundedAt ?? '').getTime() - new Date(a.refundedAt ?? '').getTime())
        .map(toRow),
    };
  }, [orders, tickets, users, verifications]);

  const askApprove = (row: RefundRow) => {
    confirm.ask({
      title: '환불을 승인할까요?',
      message: `주문 ${row.order.orderNo}의 티켓 ${row.ticketCount}매가 회수되고 환불 처리됩니다.`,
      confirmLabel: '환불 승인',
      onConfirm: () => {
        const result = approveRefund(row.order.id);
        toast.fromResult(
          result,
          `주문 ${row.order.orderNo} 환불 처리 완료 — 티켓 ${row.ticketCount}매를 회수했습니다.`,
        );
      },
    });
  };

  return (
    <>
      <PageHeader
        title="취소·환불 처리"
        description="회원이 접수한 취소 요청을 확인하고 환불을 승인합니다. 승인 즉시 해당 주문의 티켓은 회수됩니다."
      />

      {!hydrated ? (
        <Card>
          <p className="text-[13px] text-[#6B7080]">취소 요청을 불러오는 중입니다…</p>
        </Card>
      ) : (
        <>
          <Card title={`취소 요청 대기 (${pendingRows.length}건)`}>
            <div className="flex flex-col gap-3">
              <InfoNote>
                취소 요청은 접수 후 24시간 이내에 처리하는 것이 기준입니다. 잔여 6시간 미만은 주의, 기한이 지난 건은
                위험으로 표시됩니다.
              </InfoNote>
              <DataTable
                columns={[...BASE_COLUMNS, slaColumn(now), approveColumn(askApprove)]}
                rows={pendingRows}
                rowKey={(row) => row.order.id}
                emptyText="대기 중인 취소 요청이 없습니다."
                minWidth="900px"
              />
            </div>
          </Card>

          <Collapsible summary={`환불 완료 이력 (${doneRows.length}건)`}>
            <DataTable
              columns={[...BASE_COLUMNS, REFUNDED_AT_COLUMN]}
              rows={doneRows}
              rowKey={(row) => row.order.id}
              emptyText="환불 완료 내역이 없습니다."
              minWidth="820px"
            />
          </Collapsible>

          <ConfirmDialog request={confirm.request} onClose={confirm.close} />
        </>
      )}
    </>
  );
}
