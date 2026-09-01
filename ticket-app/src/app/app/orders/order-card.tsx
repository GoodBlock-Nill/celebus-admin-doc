import Link from 'next/link';

import { Badge } from '../_components/badge';
import { ChevronRightIcon } from '../_components/icons';
import { ORDER_STATUS_META } from '../_components/status-meta';
import { CARD, MUTED, NUMERIC } from '../_components/ui';
import type { OrderSummaryView } from '@/lib/api-types';
import { formatDateTime, formatKrw } from '@/lib/format';

/** 예매 내역 목록 카드 */
export function OrderCard({ order }: { order: OrderSummaryView }) {
  const statusMeta = ORDER_STATUS_META[order.status];

  return (
    <Link href={`/app/orders/${order.id}`} className={`${CARD} flex items-center gap-3 p-4`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
          <span className={`truncate text-[12.5px] ${MUTED} ${NUMERIC}`}>{order.orderNo}</span>
        </div>
        <p className="mt-2 truncate text-[16px] font-bold text-[#191F28]">{order.concertTitle}</p>
        <p className={`mt-1 truncate text-[13px] ${MUTED}`}>{order.sessionName}</p>
        <p className={`mt-1.5 text-[14px] font-bold text-[#191F28] ${NUMERIC}`}>
          {order.qty}매 · {formatKrw(order.amountKrw)}
        </p>
        <p className={`mt-0.5 text-[12.5px] ${MUTED} ${NUMERIC}`}>
          신청 {formatDateTime(order.createdAt)}
        </p>
      </div>
      <ChevronRightIcon className="h-5 w-5 shrink-0 text-[#B0B8C1]" />
    </Link>
  );
}
