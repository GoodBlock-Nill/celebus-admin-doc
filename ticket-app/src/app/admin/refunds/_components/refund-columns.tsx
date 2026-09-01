'use client';

import type { Column } from '../../_components/data-table';
import { Button } from '../../_components/form';
import { SlaCountdown } from '../../_components/sla-countdown';
import { Badge } from '../../_components/ui';
import type { AdminRefundView } from '@/lib/admin-types';
import { MS_PER_HOUR } from '@/lib/constants';
import { formatDateTime, formatKrw } from '@/lib/format';

/** 취소 요청 처리 기한 24시간, 잔여 6시간 미만이면 경고 */
export const REFUND_SLA_MS = 24 * MS_PER_HOUR;
export const REFUND_WARNING_MS = 6 * MS_PER_HOUR;

export const BASE_COLUMNS: Array<Column<AdminRefundView>> = [
  {
    key: 'orderNo',
    header: '주문번호',
    width: '130px',
    render: (row) => <span className="font-semibold tabular-nums">{row.orderNo}</span>,
  },
  {
    key: 'user',
    header: '주문자',
    render: (row) => (
      <span>
        {row.party.realName}
        <span className="ml-1 text-[12px] text-[#6B7080]">
          {row.party.nickname ? `(${row.party.nickname})` : ''}
        </span>
      </span>
    ),
  },
  { key: 'qty', header: '매수', numeric: true, width: '70px', render: (row) => `${row.qty}매` },
  {
    key: 'amount',
    header: '결제 금액',
    numeric: true,
    width: '110px',
    render: (row) => formatKrw(row.amountKrw),
  },
  {
    key: 'requestedAt',
    header: '요청 시각',
    width: '140px',
    render: (row) => (
      <span className="whitespace-nowrap tabular-nums text-[12px] text-[#4A4E5A]">
        {row.cancelRequestedAt ? formatDateTime(row.cancelRequestedAt) : '-'}
      </span>
    ),
  },
];

export function slaColumn(now: Date): Column<AdminRefundView> {
  return {
    key: 'sla',
    header: '처리 기한 (24시간)',
    width: '170px',
    render: (row) =>
      row.cancelRequestedAt ? (
        <SlaCountdown
          deadlineAt={new Date(new Date(row.cancelRequestedAt).getTime() + REFUND_SLA_MS).toISOString()}
          now={now}
          warningMs={REFUND_WARNING_MS}
        />
      ) : (
        '-'
      ),
  };
}

/** 환불 계좌를 모두 갖췄는지 — 승인 가능 여부의 판단 기준 */
export function hasRefundAccount(row: AdminRefundView): boolean {
  return Boolean(row.refundBank && row.refundAccountMasked && row.refundHolder);
}

/**
 * 회원이 등록한 환불 계좌.
 * 계좌 없이는 돈을 보낼 수 없으므로 승인 화면에서 가장 먼저 확인할 값이다.
 */
export const REFUND_ACCOUNT_COLUMN: Column<AdminRefundView> = {
  key: 'refundAccount',
  header: '환불 계좌',
  width: '230px',
  render: (row) =>
    hasRefundAccount(row) ? (
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-[#1B1D22]">
          {row.refundBank} {row.refundAccountMasked}
        </span>
        <span className="text-[12px] text-[#6B7080]">예금주 {row.refundHolder}</span>
      </div>
    ) : (
      <Badge tone="danger">미등록 — 승인 불가</Badge>
    ),
};

/**
 * 처리 손잡이 — 환불 승인과 취소 요청 반려를 나란히 둔다.
 * 반려는 회원의 요청을 되돌리는 처리라 승인 옆의 보조 자리에 위험 표시로 배치한다.
 */
export function approveColumn(
  onApprove: (row: AdminRefundView) => void,
  onReject: (row: AdminRefundView) => void,
): Column<AdminRefundView> {
  return {
    key: 'action',
    header: '처리',
    align: 'right',
    width: '210px',
    render: (row) => (
      <div className="flex flex-wrap justify-end gap-1.5">
        <Button
          variant="primary"
          size="sm"
          // 서버도 같은 조건으로 막지만, 누르기 전에 이유를 알 수 있게 화면에서 먼저 잠근다.
          disabled={!hasRefundAccount(row)}
          title={hasRefundAccount(row) ? undefined : '회원이 환불 계좌를 등록해야 승인할 수 있습니다.'}
          onClick={() => onApprove(row)}
        >
          환불 승인
        </Button>
        <Button variant="danger" size="sm" onClick={() => onReject(row)}>
          취소 요청 반려
        </Button>
      </div>
    ),
  };
}

export const REFUNDED_AT_COLUMN: Column<AdminRefundView> = {
  key: 'refundedAt',
  header: '환불 처리 시각',
  width: '150px',
  render: (row) => (
    <span className="whitespace-nowrap tabular-nums text-[12px] text-[#4A4E5A]">
      {row.refundedAt ? formatDateTime(row.refundedAt) : '-'}
    </span>
  ),
};
