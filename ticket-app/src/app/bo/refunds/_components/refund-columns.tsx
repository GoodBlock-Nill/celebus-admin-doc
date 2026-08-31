'use client';

import { MS_PER_HOUR } from '@/lib/constants';
import { formatDateTime, formatKrw } from '@/lib/format';
import type { Order } from '@/lib/types';
import type { Column } from '../../_components/data-table';
import { Button } from '../../_components/form';
import { SlaCountdown } from '../../_components/sla-countdown';

/** 취소 요청 처리 기한 24시간, 잔여 6시간 미만이면 경고 */
export const REFUND_SLA_MS = 24 * MS_PER_HOUR;
export const REFUND_WARNING_MS = 6 * MS_PER_HOUR;

export interface RefundRow {
  order: Order;
  realName?: string;
  nickname?: string;
  ticketCount: number;
}

export const BASE_COLUMNS: Array<Column<RefundRow>> = [
  {
    key: 'orderNo',
    header: '주문번호',
    width: '130px',
    render: (row) => <span className="font-semibold tabular-nums">{row.order.orderNo}</span>,
  },
  {
    key: 'user',
    header: '주문자',
    render: (row) => (
      <span>
        {row.realName ?? '실명 미확인'}
        <span className="ml-1 text-[12px] text-[#6B7080]">{row.nickname ? `(${row.nickname})` : ''}</span>
      </span>
    ),
  },
  { key: 'qty', header: '매수', numeric: true, width: '70px', render: (row) => `${row.order.qty}매` },
  {
    key: 'amount',
    header: '결제 금액',
    numeric: true,
    width: '110px',
    render: (row) => formatKrw(row.order.amountKrw),
  },
  {
    key: 'requestedAt',
    header: '요청 시각',
    width: '140px',
    render: (row) => (
      <span className="whitespace-nowrap tabular-nums text-[12px] text-[#4A4E5A]">
        {row.order.cancelRequestedAt ? formatDateTime(row.order.cancelRequestedAt) : '-'}
      </span>
    ),
  },
];

export function slaColumn(now: Date): Column<RefundRow> {
  return {
    key: 'sla',
    header: '처리 기한 (24시간)',
    width: '170px',
    render: (row) =>
      row.order.cancelRequestedAt ? (
        <SlaCountdown
          deadlineAt={new Date(new Date(row.order.cancelRequestedAt).getTime() + REFUND_SLA_MS).toISOString()}
          now={now}
          warningMs={REFUND_WARNING_MS}
        />
      ) : (
        '-'
      ),
  };
}

export function approveColumn(onApprove: (row: RefundRow) => void): Column<RefundRow> {
  return {
    key: 'action',
    header: '처리',
    align: 'right',
    width: '120px',
    render: (row) => (
      <Button variant="primary" size="sm" onClick={() => onApprove(row)}>
        환불 승인
      </Button>
    ),
  };
}

export const REFUNDED_AT_COLUMN: Column<RefundRow> = {
  key: 'refundedAt',
  header: '환불 처리 시각',
  width: '150px',
  render: (row) => (
    <span className="whitespace-nowrap tabular-nums text-[12px] text-[#4A4E5A]">
      {row.order.refundedAt ? formatDateTime(row.order.refundedAt) : '-'}
    </span>
  ),
};
