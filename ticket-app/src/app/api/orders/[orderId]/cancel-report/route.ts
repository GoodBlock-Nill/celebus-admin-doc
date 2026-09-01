import {
  HTTP_STATUS,
  fail,
  guardMutation,
  isResponse,
  ok,
  requireMember,
  toMemberReason,
  type RpcResult,
} from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';

/**
 * 입금확인 요청 취소 — 잘못 눌렀을 때 입금 대기로 되돌린다.
 * 예매 자체는 유지되며 좌석 선점도 그대로다.
 */
export async function POST(req: Request, context: { params: Promise<{ orderId: string }> }) {
  const blocked = guardMutation(req, 'cancel-report');
  if (blocked) return blocked;

  const member = await requireMember(req);
  if (isResponse(member)) return member;

  const { orderId } = await context.params;
  const { data, error } = await admin().rpc('ticket_cancel_deposit_report', {
    p_order_id: orderId,
    p_member_id: member.id,
  });

  const result = data as RpcResult | null;
  if (error || !result) return fail('요청 취소에 실패했습니다.', HTTP_STATUS.serverError);
  if (!result.ok) {
    return fail(
      toMemberReason(String(result.reason ?? '요청을 취소할 수 없습니다.')),
      HTTP_STATUS.badRequest,
    );
  }

  return ok({ status: String(result.status) });
}
