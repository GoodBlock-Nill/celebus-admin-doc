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
 * 서버 함수가 돌려주는 실패 사유는 운영 로그와 같은 문장을 쓰기 때문에 "주문" 표현이 섞여 있다.
 * 회원 화면에는 예매 용어만 노출해야 하므로 전달 직전에 회원 문구로 바꾼다.
 */
const MEMBER_REASON_TEXT: Record<string, string> = {
  '주문을 찾을 수 없습니다.': '예매 내역을 찾을 수 없습니다.',
};

function toMemberReason(reason: string): string {
  return MEMBER_REASON_TEXT[reason] ?? reason.replaceAll('주문', '예매');
}

/**
 * 예매 취소 요청 — 입금 전이면 즉시 취소(좌석 반환), 입금 후면 환불 요청 접수(24시간 처리).
 * 본인 예매 여부는 서버 함수에서 회원 식별자로 함께 검증한다.
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
  if (!result.ok) {
    return fail(toMemberReason(String(result.reason ?? '취소할 수 없습니다.')), HTTP_STATUS.badRequest);
  }

  return ok({ cancelled: Boolean(result.cancelled), status: String(result.status) });
}
