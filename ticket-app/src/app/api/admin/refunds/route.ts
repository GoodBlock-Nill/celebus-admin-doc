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
import type { AdminRefundView } from '@/lib/admin-types';

/** 환불 승인 · 취소 요청 반려 — 구분을 생략하면 기존과 같이 승인으로 본다. */
const actionSchema = z.object({
  orderId: z.string().uuid(),
  action: z.enum(['approve', 'reject']).optional(),
});

interface TicketCountRow {
  order_id: string | null;
  status: string;
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
  const tickets =
    orderIds.length === 0
      ? { data: [] as TicketCountRow[] }
      : await client
          .from('ticket_tickets')
          .select('order_id, status')
          .in('order_id', orderIds)
          .returns<TicketCountRow[]>();

  const countTickets = (orderId: string): number =>
    (tickets.data ?? []).filter((row) => row.order_id === orderId && row.status !== 'REVOKED').length;

  const withTickets = (orders: typeof pending): AdminRefundView[] =>
    orders.map((order) => ({ ...order, ticketCount: countTickets(order.id) }));

  return ok({ pending: withTickets(pending), done: withTickets(done) });
}

/**
 * 환불 승인 — 발급 전이면 선점 좌석 반환, 발급 후면 티켓 무효화 후 발급분 반환.
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
    { p_order_id: parsed.data.orderId, p_admin: guard },
    '환불 처리에 실패했습니다.',
  );
}
