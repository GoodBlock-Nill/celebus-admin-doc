import { z } from 'zod';

import { callAdminRpc, isGuardFailure, requireAdmin } from '@/lib/server/admin-api';
import { HTTP_STATUS, fail, guardMutation } from '@/lib/server/api';

const MAX_MEMO_LENGTH = 100;

/** 확인 보류 표준 사유 구분 (서버 함수의 허용값과 같다) */
const HOLD_CAUSES = ['NAME', 'AMOUNT', 'BOTH', 'OTHER'] as const;
const DEFAULT_HOLD_CAUSE = 'OTHER';

const depositId = z.string().uuid();
const orderId = z.string().uuid();
const memo = z.string().trim().min(1).max(MAX_MEMO_LENGTH);

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('confirm'), depositId }),
  z.object({
    action: z.literal('hold'),
    depositId,
    memo,
    /** 확인 보류 표준 사유 구분 — 생략하면 '그 밖의 사유'로 기록한다 */
    cause: z.enum(HOLD_CAUSES).optional(),
  }),
  z.object({ action: z.literal('refund-target'), depositId, memo }),
  z.object({ action: z.literal('refund'), depositId }),
  z.object({ action: z.literal('manual-match'), depositId, orderId }),
  /** 입금 오등록 정정 — 사유를 반드시 남긴다 */
  z.object({ action: z.literal('void'), depositId, reason: memo }),
  z.object({ action: z.literal('issue-tickets'), orderId }),
  z.object({ action: z.literal('reject-report'), orderId }),
  z.object({ action: z.literal('reject-hold'), orderId }),
  /** 운영자 오처리 정정 — 입금 확인 취소 · 티켓 지급 취소 */
  z.object({ action: z.literal('undo-confirm'), orderId }),
  z.object({ action: z.literal('undo-issue'), orderId }),
]);

type ActionInput = z.infer<typeof schema>;

interface RpcCall {
  name: string;
  params: Record<string, unknown>;
  failure: string;
}

type DepositAction = Extract<ActionInput, { depositId: string }>;
type OrderAction = Exclude<ActionInput, { depositId: string }>;

/** 입금 건을 대상으로 하는 처리 */
function resolveDepositCall(input: DepositAction, adminName: string): RpcCall {
  switch (input.action) {
    case 'confirm':
      return {
        name: 'ticket_confirm_deposit',
        params: { p_deposit_id: input.depositId, p_admin: adminName },
        failure: '입금 확정에 실패했습니다.',
      };
    case 'hold':
      return {
        name: 'ticket_hold_deposit',
        params: {
          p_deposit_id: input.depositId,
          p_memo: input.memo,
          p_admin: adminName,
          p_cause: input.cause ?? DEFAULT_HOLD_CAUSE,
        },
        failure: '입금 보류 처리에 실패했습니다.',
      };
    case 'refund-target':
      return {
        name: 'ticket_mark_refund_target',
        params: { p_deposit_id: input.depositId, p_memo: input.memo, p_admin: adminName },
        failure: '반환 대상 지정에 실패했습니다.',
      };
    case 'refund':
      return {
        name: 'ticket_refund_deposit',
        params: { p_deposit_id: input.depositId, p_admin: adminName },
        failure: '반환 처리에 실패했습니다.',
      };
    case 'manual-match':
      return {
        name: 'ticket_manual_match',
        params: { p_deposit_id: input.depositId, p_order_id: input.orderId, p_admin: adminName },
        failure: '수동 매칭에 실패했습니다.',
      };
    default:
      return {
        name: 'ticket_void_deposit',
        params: { p_deposit_id: input.depositId, p_admin: adminName, p_reason: input.reason },
        failure: '입금 등록 취소에 실패했습니다.',
      };
  }
}

/** 예매를 대상으로 하는 처리 (지급·반려·오처리 정정) */
function resolveOrderCall(input: OrderAction, adminName: string): RpcCall {
  switch (input.action) {
    case 'reject-report':
      return {
        name: 'ticket_reject_deposit_report',
        params: { p_order_id: input.orderId, p_admin: adminName },
        failure: '미입금 반려에 실패했습니다.',
      };
    case 'reject-hold':
      return {
        name: 'ticket_reject_hold',
        params: { p_order_id: input.orderId, p_admin: adminName },
        failure: '보류 반려에 실패했습니다.',
      };
    case 'undo-confirm':
      return {
        name: 'ticket_undo_confirm_deposit',
        params: { p_order_id: input.orderId, p_admin: adminName },
        failure: '입금 확인 취소에 실패했습니다.',
      };
    case 'undo-issue':
      return {
        name: 'ticket_undo_issue_tickets',
        params: { p_order_id: input.orderId, p_admin: adminName },
        failure: '티켓 지급 취소에 실패했습니다.',
      };
    default:
      return {
        name: 'ticket_issue_order_tickets',
        params: { p_order_id: input.orderId, p_admin: adminName },
        failure: '티켓 지급에 실패했습니다.',
      };
  }
}

/** 요청 구분 → 호출할 서버 함수·인자·실패 문구 */
function resolveCall(input: ActionInput, adminName: string): RpcCall {
  return 'depositId' in input
    ? resolveDepositCall(input, adminName)
    : resolveOrderCall(input, adminName);
}

/**
 * 입금·예매 처리 액션 한 곳.
 * 확정·보류·반환 지정·반환 완료·수동 매칭·등록 취소·티켓 지급·미입금 반려·보류 반려,
 * 그리고 오처리 정정(입금 확인 취소·티켓 지급 취소)을 모두 받는다.
 */
export async function POST(req: Request) {
  const blocked = guardMutation(req, 'admin-deposit-action');
  if (blocked) return blocked;

  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail('요청 값을 다시 확인해 주세요.', HTTP_STATUS.badRequest);

  const call = resolveCall(parsed.data, guard);
  return callAdminRpc(call.name, call.params, call.failure);
}
