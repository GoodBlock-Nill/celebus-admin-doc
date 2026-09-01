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
 * 입금확인 요청 — 회원이 "입금을 마쳤다"고 알리는 신호.
 * 운영자 확인 전까지 예매는 입금 확인중으로 표시되고 마감 자동 취소에서 제외된다.
 * 본인 예매 여부는 서버 함수에서 회원 식별자로 함께 검증한다.
 */
export async function POST(req: Request, context: { params: Promise<{ orderId: string }> }) {
  const blocked = guardMutation(req, 'report-deposit');
  if (blocked) return blocked;

  const member = await requireMember(req);
  if (isResponse(member)) return member;

  const { orderId } = await context.params;
  const { data, error } = await admin().rpc('ticket_report_deposit', {
    p_order_id: orderId,
    p_member_id: member.id,
  });

  const result = data as RpcResult | null;
  if (error || !result) return fail('입금확인 요청에 실패했습니다.', HTTP_STATUS.serverError);
  if (!result.ok) {
    return fail(
      toMemberReason(String(result.reason ?? '입금확인을 요청할 수 없습니다.')),
      HTTP_STATUS.badRequest,
    );
  }

  return ok({ status: String(result.status) });
}
