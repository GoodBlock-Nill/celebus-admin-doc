import Link from 'next/link';

import { Badge } from '../_components/badge';
import { ChevronRightIcon } from '../_components/icons';
import { ORDER_STATUS_META } from '../_components/status-meta';
import { CARD, MUTED, NUMERIC } from '../_components/ui';
import { formatDateTime, formatKrw } from '@/lib/format';
import type { Concert, ConcertSession, Order } from '@/lib/types';

interface OrderCardProps {
  order: Order;
  concert?: Concert;
  session?: ConcertSession;
}

/** 주문 내역 목록 카드 */
export function OrderCard({ order, concert, session }: OrderCardProps) {
  const statusMeta = ORDER_STATUS_META[order.status];

  return (
    <Link href={`/app/orders/${order.id}`} className={`${CARD} flex items-center gap-3 p-4`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
          <span className={`truncate text-[11.5px] ${MUTED} ${NUMERIC}`}>{order.orderNo}</span>
        </div>
        <p className="mt-2 truncate text-[14px] font-bold">{concert?.title ?? '공연 정보 없음'}</p>
        <p className={`mt-1 truncate text-[12px] ${MUTED}`}>{session?.name ?? '-'}</p>
        <p className={`mt-1.5 text-[13px] font-semibold ${NUMERIC}`}>
          {order.qty}매 · {formatKrw(order.amountKrw)}
        </p>
        <p className={`mt-0.5 text-[11.5px] ${MUTED} ${NUMERIC}`}>
          신청 {formatDateTime(order.createdAt)}
        </p>
      </div>
      <ChevronRightIcon className="h-5 w-5 shrink-0 text-[#5F606B]" />
    </Link>
  );
}
