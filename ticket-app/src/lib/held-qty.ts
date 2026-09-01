import type { OrderStatus, OrderSummaryView, TicketSummaryView } from './api-types';

/** 1인 구매 한도에 포함되는 주문 상태 (서버 판정과 동일 기준) */
const ACTIVE_ORDER_STATUSES = new Set<OrderStatus>([
  'AWAITING_DEPOSIT',
  'DEPOSIT_REPORTED',
  'ON_HOLD',
  'DEPOSIT_CONFIRMED',
  'PAID',
  'CANCEL_REQUESTED',
]);

/**
 * 1인 구매 한도 계산에 포함되는 수량 — 유효 주문 매수 + 주문 없이 발급된 무상 티켓 매수.
 * 표시용 계산이며, 실제 한도 판정은 서버(예매 신청 처리)에서 다시 이뤄진다.
 */
export function countHeldQty(
  orders: OrderSummaryView[],
  tickets: TicketSummaryView[],
  concertId: string,
): number {
  const orderQty = orders
    .filter((order) => order.concertId === concertId && ACTIVE_ORDER_STATUSES.has(order.status))
    .reduce((sum, order) => sum + order.qty, 0);

  const compTicketQty = tickets.filter(
    (ticket) => ticket.concertId === concertId && ticket.orderId === null && ticket.status !== 'REVOKED',
  ).length;

  return orderQty + compTicketQty;
}
