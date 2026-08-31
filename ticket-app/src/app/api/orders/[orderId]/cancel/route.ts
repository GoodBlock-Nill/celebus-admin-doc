import {
  HTTP_STATUS,
  fail,
  guardMutation,
  isResponse,
  ok,
  requireMember,
  type RpcResult,
} from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';

/**
 * 주문 취소 요청 — 입금 전이면 즉시 취소(좌석 반환), 입금 후면 환불 요청 접수(24시간 처리).
 * 본인 주문 여부는 서버 함수에서 회원 식별자로 함께 검증한다.
 */
export async function POST(req: Request, context: { params: Promise<{ orderId: string }> }) {
  const blocked = guardMutation(req, 'cancel');
  if (blocked) return blocked;

  const member = await requireMember(req);
  if (isResponse(member)) return member;

  const { orderId } = await context.params;
  const { data, error } = await admin().rpc('ticket_request_cancel', {
    p_order_id: orderId,
    p_member_id: member.id,
  });

  const result = data as RpcResult | null;
  if (error || !result) return fail('취소 처리에 실패했습니다.', HTTP_STATUS.serverError);
  if (!result.ok) return fail(String(result.reason ?? '취소할 수 없습니다.'), HTTP_STATUS.badRequest);

  return ok({ cancelled: Boolean(result.cancelled), status: String(result.status) });
}
