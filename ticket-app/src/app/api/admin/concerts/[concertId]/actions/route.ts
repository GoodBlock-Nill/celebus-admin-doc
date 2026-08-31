import { z } from 'zod';

import { callAdminRpc, isGuardFailure, requireAdmin } from '@/lib/server/admin-api';
import { HTTP_STATUS, fail, guardMutation } from '@/lib/server/api';

const POOL_TYPES = ['PAID_SALE', 'CELEBUS_WINNER', 'IX_INVITATION', 'OPERATION_HOLD'] as const;
const COMP_POOL_TYPES = ['CELEBUS_WINNER', 'IX_INVITATION', 'OPERATION_HOLD'] as const;

const MAX_COMP_QTY = 100;
const MAX_REALLOCATE_QTY = 100000;
const MAX_REASON_LENGTH = 100;

const CONCERT_STATUS_TARGETS = ['ON_SALE', 'CLOSED'] as const;

const schema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('set-status'),
    status: z.enum(CONCERT_STATUS_TARGETS),
  }),
  z.object({
    action: z.literal('reallocate'),
    sessionId: z.string().uuid(),
    from: z.enum(POOL_TYPES),
    to: z.enum(POOL_TYPES),
    qty: z.number().int().min(1).max(MAX_REALLOCATE_QTY),
  }),
  z.object({
    action: z.literal('comp-issue'),
    sessionId: z.string().uuid(),
    poolType: z.enum(COMP_POOL_TYPES),
    memberId: z.string().uuid(),
    qty: z.number().int().min(1).max(MAX_COMP_QTY),
    reason: z.string().trim().max(MAX_REASON_LENGTH).optional(),
  }),
]);

/** 판매 상태 전이 · 배정 수량 이동 · 무상 티켓 발급 — 검증과 로그 기록은 서버 함수가 담당한다. */
export async function POST(req: Request, context: { params: Promise<{ concertId: string }> }) {
  const blocked = guardMutation(req, 'admin-concert');
  if (blocked) return blocked;

  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail('요청 값을 다시 확인해 주세요.', HTTP_STATUS.badRequest);

  if (parsed.data.action === 'set-status') {
    const { concertId } = await context.params;
    return callAdminRpc(
      'ticket_set_concert_status',
      { p_concert_id: concertId, p_status: parsed.data.status, p_admin: guard },
      '판매 상태 변경에 실패했습니다.',
    );
  }

  if (parsed.data.action === 'reallocate') {
    return callAdminRpc(
      'ticket_reallocate_pool',
      {
        p_session_id: parsed.data.sessionId,
        p_from: parsed.data.from,
        p_to: parsed.data.to,
        p_qty: parsed.data.qty,
        p_admin: guard,
      },
      '배정 수량 이동에 실패했습니다.',
    );
  }

  return callAdminRpc(
    'ticket_issue_comp_tickets',
    {
      p_session_id: parsed.data.sessionId,
      p_pool_type: parsed.data.poolType,
      p_member_id: parsed.data.memberId,
      p_qty: parsed.data.qty,
      p_reason: parsed.data.reason ?? '',
      p_admin: guard,
    },
    '무상 티켓 발급에 실패했습니다.',
  );
}
