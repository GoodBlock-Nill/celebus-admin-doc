'use client';

import type { Column } from '../../../_components/data-table';
import { Button } from '../../../_components/form';
import { ORDER_STATUS_VIEW } from '../../../_components/labels';
import { Badge, StatusBadge } from '../../../_components/ui';
import { recommendationOf } from './recommendation';
import type { AdminWorklistItemView } from '@/lib/admin-types';
import { formatDateTime, formatElapsed, formatKrw } from '@/lib/format';

/** 회원이 알려 온 정보·요청 상황을 한눈에 알리는 뱃지 묶음 */
function SignalBadges({ item }: { item: AdminWorklistItemView }) {
  const order = item.order;
  const hasRefundAccount = Boolean(order.refundBank && order.refundAccountMasked);

  if (!order.depositReportedAt && !order.holdActualDepositor && !hasRefundAccount) {
    return <span className="text-[12px] text-[#6B7080]">-</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      {order.depositReportedAt ? (
        <Badge tone="accent">회원 요청 {order.depositReportCount}회</Badge>
      ) : null}
      {order.holdActualDepositor ? (
        <Badge tone="warning">실제 입금자명 {order.holdActualDepositor}</Badge>
      ) : null}
      {hasRefundAccount ? <Badge tone="danger">환불 계좌 등록</Badge> : null}
    </div>
  );
}

/** 할 일 큐 목록 열 구성 */
export function buildWorklistColumns(
  now: Date,
  expandedId: string | null,
  onToggle: (orderId: string) => void,
  onRecommended: (item: AdminWorklistItemView) => void,
): Array<Column<AdminWorklistItemView>> {
  return [
    {
      key: 'status',
      header: '상태',
      width: '92px',
      render: (item) => <StatusBadge view={ORDER_STATUS_VIEW[item.order.status]} />,
    },
    {
      key: 'order',
      header: '예매번호 / 주문자',
      width: '168px',
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold tabular-nums">{item.order.orderNo}</span>
          <span className="text-[12px] text-[#4A4E5A]">
            {item.order.party.realName}
            {item.order.party.nickname ? ` (${item.order.party.nickname})` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'session',
      header: '회차',
      width: '132px',
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] text-[#1B1D22]">{item.order.sessionName}</span>
          <span className="text-[11.5px] text-[#6B7080]">{item.concertTitle}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: '매수 · 금액',
      numeric: true,
      width: '108px',
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <span>{item.order.qty}매</span>
          <span className="text-[12px] text-[#4A4E5A]">{formatKrw(item.order.amountKrw)}</span>
        </div>
      ),
    },
    {
      key: 'elapsed',
      header: '대기 경과',
      width: '116px',
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] font-semibold text-[#1B1D22]">
            {formatElapsed(item.waitingSince, now)}
          </span>
          <span className="whitespace-nowrap text-[11.5px] tabular-nums text-[#6B7080]">
            {formatDateTime(item.waitingSince)}
          </span>
        </div>
      ),
    },
    {
      key: 'signal',
      header: '회원 알림',
      width: '150px',
      render: (item) => <SignalBadges item={item} />,
    },
    {
      key: 'action',
      header: '처리',
      align: 'right',
      width: '176px',
      render: (item) => (
        <div className="flex flex-wrap justify-end gap-1.5">
          <Button variant="primary" size="sm" onClick={() => onRecommended(item)}>
            {recommendationOf(item).label}
          </Button>
          <Button size="sm" onClick={() => onToggle(item.order.id)}>
            {expandedId === item.order.id ? '접기' : '상세'}
          </Button>
        </div>
      ),
    },
  ];
}
