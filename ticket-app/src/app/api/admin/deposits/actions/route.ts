import { z } from 'zod';

import { callAdminRpc, isGuardFailure, requireAdmin } from '@/lib/server/admin-api';
import { HTTP_STATUS, fail, guardMutation } from '@/lib/server/api';

const MAX_MEMO_LENGTH = 100;

/** 확인 보류 표준 사유 구분 (서버 함수의 허용값과 같다) */
const HOLD_CAUSES = ['NAME', 'AMOUNT', 'BOTH', 'OTHER'] as const;
const DEFAULT_HOLD_CAUSE = 'OTHER';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('confirm'), depositId: z.string().uuid() }),
  z.object({
    action: z.literal('hold'),
    depositId: z.string().uuid(),
    memo: z.string().trim().min(1).max(MAX_MEMO_LENGTH),
    /** 확인 보류 표준 사유 구분 — 생략하면 '그 밖의 사유'로 기록한다 */
    cause: z.enum(HOLD_CAUSES).optional(),
  }),
  z.object({
    action: z.literal('refund-target'),
    depositId: z.string().uuid(),
    memo: z.string().trim().min(1).max(MAX_MEMO_LENGTH),
  }),
  z.object({ action: z.literal('refund'), depositId: z.string().uuid() }),
  z.object({
    action: z.literal('manual-match'),
    depositId: z.string().uuid(),
    orderId: z.string().uuid(),
  }),
  z.object({ action: z.literal('issue-tickets'), orderId: z.string().uuid() }),
  z.object({ action: z.literal('reject-report'), orderId: z.string().uuid() }),
  z.object({ action: z.literal('reject-hold'), orderId: z.string().uuid() }),
]);

/** 입금 확정·보류·반환 지정·반환 완료·수동 매칭·티켓 지급·미입금 반려·보류 반려 처리 */
export async function POST(req: Request) {
  const blocked = guardMutation(req, 'admin-deposit-action');
  if (blocked) return blocked;

  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail('요청 값을 다시 확인해 주세요.', HTTP_STATUS.badRequest);

  const input = parsed.data;

  switch (input.action) {
    case 'confirm':
      return callAdminRpc(
        'ticket_confirm_deposit',
        { p_deposit_id: input.depositId, p_admin: guard },
        '입금 확정에 실패했습니다.',
      );
    case 'hold':
      return callAdminRpc(
        'ticket_hold_deposit',
        {
          p_deposit_id: input.depositId,
          p_memo: input.memo,
          p_admin: guard,
          p_cause: input.cause ?? DEFAULT_HOLD_CAUSE,
        },
        '입금 보류 처리에 실패했습니다.',
      );
    case 'refund-target':
      return callAdminRpc(
        'ticket_mark_refund_target',
        { p_deposit_id: input.depositId, p_memo: input.memo, p_admin: guard },
        '반환 대상 지정에 실패했습니다.',
      );
    case 'refund':
      return callAdminRpc(
        'ticket_refund_deposit',
        { p_deposit_id: input.depositId, p_admin: guard },
        '반환 처리에 실패했습니다.',
      );
    case 'manual-match':
      return callAdminRpc(
        'ticket_manual_match',
        { p_deposit_id: input.depositId, p_order_id: input.orderId, p_admin: guard },
        '수동 매칭에 실패했습니다.',
      );
    case 'reject-report':
      return callAdminRpc(
        'ticket_reject_deposit_report',
        { p_order_id: input.orderId, p_admin: guard },
        '미입금 반려에 실패했습니다.',
      );
    case 'reject-hold':
      return callAdminRpc(
        'ticket_reject_hold',
        { p_order_id: input.orderId, p_admin: guard },
        '보류 반려에 실패했습니다.',
      );
    default:
      return callAdminRpc(
        'ticket_issue_order_tickets',
        { p_order_id: input.orderId, p_admin: guard },
        '티켓 지급에 실패했습니다.',
      );
  }
}
