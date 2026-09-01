'use client';

import type { Column } from '../../../_components/data-table';
import { Button } from '../../../_components/form';
import { ORDER_STATUS_VIEW } from '../../../_components/labels';
import { StatusBadge } from '../../../_components/ui';
import type { AdminOrderSearchView } from '@/lib/admin-types';
import { formatDateTime, formatKrw } from '@/lib/format';

/** 주문 조회 목록 열 구성 */
export function buildOrderSearchColumns(
  expandedId: string | null,
  onToggle: (orderId: string) => void,
): Array<Column<AdminOrderSearchView>> {
  return [
    {
      key: 'status',
      header: '상태',
      width: '104px',
      render: (order) => <StatusBadge view={ORDER_STATUS_VIEW[order.status]} />,
    },
    {
      key: 'order',
      header: '예매번호 / 주문자',
      width: '190px',
      render: (order) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold tabular-nums">{order.orderNo}</span>
          <span className="text-[12px] text-[#4A4E5A]">
            {order.party.realName}
            {order.party.nickname ? ` (${order.party.nickname})` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'concert',
      header: '공연 · 회차',
      render: (order) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] text-[#1B1D22]">{order.concertTitle}</span>
          <span className="text-[11.5px] text-[#6B7080]">{order.sessionName}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: '매수 · 금액',
      numeric: true,
      width: '124px',
      render: (order) => (
        <div className="flex flex-col gap-0.5">
          <span>{order.qty}매</span>
          <span className="text-[12px] text-[#4A4E5A]">{formatKrw(order.amountKrw)}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: '신청 일시',
      width: '140px',
      render: (order) => (
        <span className="whitespace-nowrap tabular-nums text-[12px] text-[#4A4E5A]">
          {formatDateTime(order.createdAt)}
        </span>
      ),
    },
    {
      key: 'action',
      header: '이력',
      align: 'right',
      width: '90px',
      render: (order) => (
        <Button size="sm" onClick={() => onToggle(order.id)}>
          {expandedId === order.id ? '접기' : '상세'}
        </Button>
      ),
    },
  ];
}
