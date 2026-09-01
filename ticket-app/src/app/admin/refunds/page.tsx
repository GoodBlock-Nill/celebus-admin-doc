'use client';

import { useCallback } from 'react';

import { ConfirmDialog } from '../_components/confirm-dialog';
import { DataTable } from '../_components/data-table';
import { useAdminResource, useConfirm, useNow } from '../_components/hooks';
import { useToast } from '../_components/toast';
import { Card, Collapsible, InfoNote, PageHeader } from '../_components/ui';
import {
  BASE_COLUMNS,
  REFUNDED_AT_COLUMN,
  approveColumn,
  slaColumn,
} from './_components/refund-columns';
import { adminApi } from '@/lib/admin-client';
import type { AdminRefundView } from '@/lib/admin-types';

export default function AdminRefundsPage() {
  const now = useNow();
  const loadRefunds = useCallback(() => adminApi.refunds(), []);
  const { state, reload } = useAdminResource(loadRefunds);
  const toast = useToast();
  const confirm = useConfirm();

  const approve = async (row: AdminRefundView) => {
    const hasTickets = row.ticketCount > 0;
    const result = await adminApi.approveRefund(row.id);
    toast.fromResult(
      result,
      hasTickets
        ? `주문 ${row.orderNo} 환불 처리 완료 — 티켓 ${row.ticketCount}매를 회수했습니다.`
        : `주문 ${row.orderNo} 환불 처리 완료 — 선점 좌석 ${row.qty}매를 반환했습니다.`,
    );
    if (result.ok) void reload();
  };

  const askApprove = (row: AdminRefundView) => {
    // 입금 확인 상태에서 취소된 주문은 회수할 티켓 없이 선점 좌석만 반환한다.
    const hasTickets = row.ticketCount > 0;
    confirm.ask({
      title: '환불을 승인할까요?',
      message: hasTickets
        ? `주문 ${row.orderNo}의 티켓 ${row.ticketCount}매가 회수되고 환불 처리됩니다.`
        : `주문 ${row.orderNo}은 티켓 지급 전 주문입니다. 선점 좌석 ${row.qty}매가 반환되고 환불 처리됩니다.`,
      confirmLabel: '환불 승인',
      onConfirm: () => void approve(row),
    });
  };

  return (
    <>
      <PageHeader
        title="취소·환불 처리"
        description="회원이 접수한 취소 요청을 확인하고 환불을 승인합니다. 승인 즉시 해당 주문의 티켓은 회수됩니다."
      />

      {state.status !== 'READY' ? (
        <Card>
          <p className="text-[13px] text-[#6B7080]">
            {state.status === 'LOADING' ? '취소 요청을 불러오는 중입니다…' : state.reason}
          </p>
        </Card>
      ) : (
        <>
          <Card title={`취소 요청 대기 (${state.data.pending.length}건)`}>
            <div className="flex flex-col gap-3">
              <InfoNote>
                취소 요청은 접수 후 24시간 이내에 처리하는 것이 기준입니다. 잔여 6시간 미만은 주의, 기한이 지난 건은
                위험으로 표시됩니다.
              </InfoNote>
              <DataTable
                columns={[...BASE_COLUMNS, slaColumn(now), approveColumn(askApprove)]}
                rows={state.data.pending}
                rowKey={(row) => row.id}
                emptyText="대기 중인 취소 요청이 없습니다."
                minWidth="900px"
              />
            </div>
          </Card>

          <Collapsible summary={`환불 완료 이력 (${state.data.done.length}건)`}>
            <DataTable
              columns={[...BASE_COLUMNS, REFUNDED_AT_COLUMN]}
              rows={state.data.done}
              rowKey={(row) => row.id}
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
