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
  REFUND_ACCOUNT_COLUMN,
  approveColumn,
  hasRefundAccount,
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

  const reject = async (row: AdminRefundView) => {
    const result = await adminApi.rejectCancelRequest(row.id);
    toast.fromResult(result, `주문 ${row.orderNo} 취소 요청을 반려했습니다.`);
    if (result.ok) void reload();
  };

  const askReject = (row: AdminRefundView) =>
    confirm.ask({
      title: '취소 요청을 반려할까요?',
      message: `주문 ${row.orderNo}을(를) 취소 요청 직전 상태로 되돌립니다. 회원 화면에는 "취소 요청이 반려되었습니다. 자세한 내용은 고객센터로 문의해 주세요."가 표시되므로, 반려 사유는 고객센터를 통해 안내해 주세요.`,
      confirmLabel: '취소 요청 반려',
      confirmVariant: 'danger',
      onConfirm: () => void reject(row),
    });

  const askApprove = (row: AdminRefundView) => {
    // 계좌가 없으면 돈을 보낼 수 없다 — 서버도 같은 조건으로 거부한다.
    if (!hasRefundAccount(row)) {
      confirm.ask({
        title: '환불 계좌가 없습니다',
        message: `주문 ${row.orderNo}은 회원이 환불 계좌를 등록하지 않아 승인할 수 없습니다. 회원에게 예매 상세에서 환불 계좌를 등록하도록 안내해 주세요.`,
        confirmLabel: '확인',
        onConfirm: () => undefined,
      });
      return;
    }

    // 입금 확인 상태에서 취소된 주문은 회수할 티켓 없이 선점 좌석만 반환한다.
    const hasTickets = row.ticketCount > 0;
    confirm.ask({
      title: '환불을 승인할까요?',
      message: (
        <>
          {hasTickets
            ? `주문 ${row.orderNo}의 티켓 ${row.ticketCount}매가 회수되고 환불 처리됩니다.`
            : `주문 ${row.orderNo}은 티켓 지급 전 주문입니다. 선점 좌석 ${row.qty}매가 반환되고 환불 처리됩니다.`}
          <span className="mt-2 block font-semibold text-[#1B1D22]">
            환불 계좌 {row.refundBank} {row.refundAccountMasked} · 예금주 {row.refundHolder}
          </span>
        </>
      ),
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
                위험으로 표시됩니다. 환불 계좌가 등록되지 않은 건은 승인할 수 없으며, 회원이 예매 상세에서 계좌를
                등록해야 처리할 수 있습니다. 환불 대상이 아닌 요청은 취소 요청 반려로 원래 상태로 되돌릴 수 있습니다
                (공연 취소로 생긴 환불 대상은 반려할 수 없습니다).
              </InfoNote>
              <DataTable
                columns={[
                  ...BASE_COLUMNS,
                  REFUND_ACCOUNT_COLUMN,
                  slaColumn(now),
                  approveColumn(askApprove, askReject),
                ]}
                rows={state.data.pending}
                rowKey={(row) => row.id}
                emptyText="대기 중인 취소 요청이 없습니다."
                minWidth="1230px"
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
