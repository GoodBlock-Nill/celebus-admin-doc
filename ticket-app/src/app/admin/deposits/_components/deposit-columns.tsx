'use client';

import type { Column } from '../../_components/data-table';
import { DEPOSIT_STATUS_VIEW } from '../../_components/labels';
import { StatusBadge } from '../../_components/ui';
import type { AdminDepositView } from '@/lib/admin-types';
import { formatDateTime, formatKrw } from '@/lib/format';

export const depositorColumn: Column<AdminDepositView> = {
  key: 'depositor',
  header: '입금자명',
  width: '130px',
  render: (row) => <span className="font-semibold">{row.depositorName}</span>,
};

export const amountColumn: Column<AdminDepositView> = {
  key: 'amount',
  header: '입금액',
  numeric: true,
  width: '110px',
  render: (row) => formatKrw(row.amountKrw),
};

export const depositedAtColumn: Column<AdminDepositView> = {
  key: 'depositedAt',
  header: '입금 시각',
  width: '140px',
  render: (row) => (
    <span className="whitespace-nowrap tabular-nums text-[12px] text-[#4A4E5A]">
      {formatDateTime(row.depositedAt)}
    </span>
  ),
};

export const statusColumn: Column<AdminDepositView> = {
  key: 'status',
  header: '상태',
  width: '120px',
  render: (row) => <StatusBadge view={DEPOSIT_STATUS_VIEW[row.status]} />,
};

export const orderColumn: Column<AdminDepositView> = {
  key: 'order',
  header: '매칭 주문 / 주문자',
  render: (row) =>
    row.order ? (
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold tabular-nums">{row.order.orderNo}</span>
        <span className="text-[12px] text-[#6B7080]">
          {row.order.party.realName}
          {row.order.party.nickname ? ` (${row.order.party.nickname})` : ''} · {row.order.qty}매 ·{' '}
          {formatKrw(row.order.amountKrw)}
        </span>
      </div>
    ) : (
      <span className="text-[12px] text-[#6B7080]">연결된 주문 없음</span>
    ),
};

export const memoColumn: Column<AdminDepositView> = {
  key: 'memo',
  header: '보류·반환 사유',
  render: (row) => (
    <span className="text-[12px] leading-relaxed text-[#4A4E5A]">
      {row.memo ?? row.order?.holdReason ?? '-'}
    </span>
  ),
};
