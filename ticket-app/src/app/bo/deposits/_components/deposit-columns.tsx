'use client';

import { formatDateTime, formatKrw } from '@/lib/format';
import type { Column } from '../../_components/data-table';
import { DEPOSIT_STATUS_VIEW } from '../../_components/labels';
import { StatusBadge } from '../../_components/ui';
import type { DepositRow } from './deposit-rows';

export const depositorColumn: Column<DepositRow> = {
  key: 'depositor',
  header: '입금자명',
  width: '130px',
  render: (row) => <span className="font-semibold">{row.deposit.depositorName}</span>,
};

export const amountColumn: Column<DepositRow> = {
  key: 'amount',
  header: '입금액',
  numeric: true,
  width: '110px',
  render: (row) => formatKrw(row.deposit.amountKrw),
};

export const depositedAtColumn: Column<DepositRow> = {
  key: 'depositedAt',
  header: '입금 시각',
  width: '140px',
  render: (row) => (
    <span className="whitespace-nowrap tabular-nums text-[12px] text-[#4A4E5A]">
      {formatDateTime(row.deposit.depositedAt)}
    </span>
  ),
};

export const statusColumn: Column<DepositRow> = {
  key: 'status',
  header: '상태',
  width: '120px',
  render: (row) => <StatusBadge view={DEPOSIT_STATUS_VIEW[row.deposit.status]} />,
};

export const orderColumn: Column<DepositRow> = {
  key: 'order',
  header: '매칭 주문 / 주문자',
  render: (row) =>
    row.order ? (
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold tabular-nums">{row.order.orderNo}</span>
        <span className="text-[12px] text-[#6B7080]">
          {row.realName ?? '실명 미확인'}
          {row.nickname ? ` (${row.nickname})` : ''} · {row.order.qty}매 ·{' '}
          {formatKrw(row.order.amountKrw)}
        </span>
      </div>
    ) : (
      <span className="text-[12px] text-[#6B7080]">연결된 주문 없음</span>
    ),
};

export const memoColumn: Column<DepositRow> = {
  key: 'memo',
  header: '보류·반환 사유',
  render: (row) => (
    <span className="text-[12px] leading-relaxed text-[#4A4E5A]">
      {row.deposit.memo ?? row.order?.holdReason ?? '-'}
    </span>
  ),
};
