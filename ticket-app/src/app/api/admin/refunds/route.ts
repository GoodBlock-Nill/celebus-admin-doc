import { z } from 'zod';

import {
  callAdminRpc,
  expireOverdueOrders,
  isGuardFailure,
  requireAdmin,
} from '@/lib/server/admin-api';
import { loadOrdersByStatus } from '@/lib/server/admin-load';
import { HTTP_STATUS, fail, guardMutation, ok } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import type { AdminRefundView, RefundFeeQuoteView } from '@/lib/admin-types';

/** 환불 수수료 조정 상한 — 결제 금액을 넘길 수 없다(서버 함수도 같은 조건으로 막는다) */
const MAX_FEE_KRW = 100_000_000;

/** 환불 승인 · 취소 요청 반려 — 구분을 생략하면 기존과 같이 승인으로 본다. */
const actionSchema = z.object({
  orderId: z.string().uuid(),
  action: z.enum(['approve', 'reject']).optional(),
  /** 운영자가 조정한 환불 수수료 — 생략하면 서버 단계표로 자동 계산한다 */
  feeKrw: z.number().int().min(0).max(MAX_FEE_KRW).optional(),
});

interface TicketCountRow {
  order_id: string | null;
  status: string;
}

interface FeeQuoteRow {
  rate_percent: number;
  fee_krw: number;
  refund_krw: number;
  basis: string;
}

/** 승인 전 미리 보여 줄 자동 계산 수수료 — 서버 단계표를 그대로 사용한다. */
async function loadFeeQuotes(
  client: ReturnType<typeof admin>,
  orderIds: string[],
): Promise<Map<string, RefundFeeQuoteView>> {
  const quotes = new Map<string, RefundFeeQuoteView>();
  if (orderIds.length === 0) return quotes;

  const { data } = await client.rpc('ticket_refund_fee_quotes', { p_order_ids: orderIds });
  const rows = (data ?? {}) as Record<string, FeeQuoteRow>;

  for (const [orderId, quote] of Object.entries(rows)) {
    quotes.set(orderId, {
      ratePercent: quote.rate_percent,
      feeKrw: quote.fee_krw,
      refundKrw: quote.refund_krw,
      basis: quote.basis,
    });
  }

  return quotes;
}

/** 취소 요청 대기 · 환불 완료 이력 — 회수 대상 티켓 매수를 함께 계산한다. */
export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  await expireOverdueOrders();
  const client = admin();

  const [pending, done] = await Promise.all([
    loadOrdersByStatus(client, {
      statuses: ['CANCEL_REQUESTED'],
      orderBy: 'cancel_requested_at',
      ascending: true,
    }),
    loadOrdersByStatus(client, { statuses: ['REFUNDED'], orderBy: 'refunded_at', ascending: false }),
  ]);

  const orderIds = [...pending, ...done].map((order) => order.id);
  const [tickets, quotes] = await Promise.all([
    orderIds.length === 0
      ? { data: [] as TicketCountRow[] }
      : client
          .from('ticket_tickets')
          .select('order_id, status')
          .in('order_id', orderIds)
          .returns<TicketCountRow[]>(),
    // 승인 대기 건만 자동 계산 수수료가 필요하다(완료 건은 확정 금액이 예매에 남아 있다).
    loadFeeQuotes(client, pending.map((order) => order.id)),
  ]);

  const countTickets = (orderId: string): number =>
    (tickets.data ?? []).filter((row) => row.order_id === orderId && row.status !== 'REVOKED').length;

  const withTickets = (orders: typeof pending): AdminRefundView[] =>
    orders.map((order) => ({
      ...order,
      ticketCount: countTickets(order.id),
      feeQuote: quotes.get(order.id) ?? null,
    }));

  return ok({ pending: withTickets(pending), done: withTickets(done) });
}

/**
 * 환불 승인 — 발급 전이면 선점 좌석 반환, 발급 후면 티켓 무효화 후 발급분 반환.
 *   수수료를 함께 보내면 그 금액으로, 보내지 않으면 관람일 기준 단계표로 자동 계산해 기록한다.
 * 취소 요청 반려 — 예매를 취소 요청 직전 상태로 되돌린다.
 */
export async function POST(req: Request) {
  const blocked = guardMutation(req, 'admin-refund');
  if (blocked) return blocked;

  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail('주문 정보를 확인해 주세요.', HTTP_STATUS.badRequest);

  if (parsed.data.action === 'reject') {
    return callAdminRpc(
      'ticket_reject_cancel_request',
      { p_order_id: parsed.data.orderId, p_admin: guard },
      '취소 요청 반려에 실패했습니다.',
    );
  }

  return callAdminRpc(
    'ticket_approve_refund',
    { p_order_id: parsed.data.orderId, p_admin: guard, p_fee_krw: parsed.data.feeKrw ?? null },
    '환불 처리에 실패했습니다.',
  );
}
