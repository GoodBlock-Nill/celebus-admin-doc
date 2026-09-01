import { z } from 'zod';

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
import { encryptText } from '@/lib/server/crypto';
import { admin } from '@/lib/server/db-admin';
import { maskAccountNumber } from '@/lib/format';

const NAME_MIN = 1;
const NAME_MAX = 20;
const ACCOUNT_MIN = 6;
const ACCOUNT_MAX = 30;

/** 계좌번호는 숫자와 하이픈만 받는다(은행별 표기 차이를 그대로 보관) */
const ACCOUNT_PATTERN = /^[0-9-]+$/;

const schema = z
  .object({
    /** 회원이 실제로 송금에 사용한 입금자명 */
    actualDepositor: z.string().trim().min(NAME_MIN).max(NAME_MAX).optional(),
    refundBank: z.string().trim().min(NAME_MIN).max(NAME_MAX).optional(),
    refundAccount: z
      .string()
      .trim()
      .min(ACCOUNT_MIN)
      .max(ACCOUNT_MAX)
      .regex(ACCOUNT_PATTERN)
      .optional(),
    refundHolder: z.string().trim().min(NAME_MIN).max(NAME_MAX).optional(),
  })
  .refine(
    (input) =>
      Boolean(input.actualDepositor) ||
      Boolean(input.refundBank || input.refundAccount || input.refundHolder),
    { path: ['actualDepositor'] },
  )
  .refine(
    (input) => {
      const filled = [input.refundBank, input.refundAccount, input.refundHolder].filter(Boolean);
      return filled.length === 0 || filled.length === 3;
    },
    { path: ['refundAccount'] },
  );

const INVALID_INPUT =
  '알려주실 내용을 다시 확인해 주세요. 환불 계좌는 은행·계좌번호·예금주를 모두 입력해야 합니다.';

/**
 * 확인 보류 해결 정보 알리기 — 실제 입금자명 / 오입금 환불 계좌.
 *
 * 계좌번호는 이 서버에서 암호화한 뒤 저장하며, 화면에는 마스킹 값만 돌려준다.
 * 본인 예매 여부와 허용 상태(확인 보류·취소 요청)는 서버 함수에서 함께 검증한다.
 */
export async function POST(req: Request, context: { params: Promise<{ orderId: string }> }) {
  const blocked = guardMutation(req, 'hold-info');
  if (blocked) return blocked;

  const member = await requireMember(req);
  if (isResponse(member)) return member;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(INVALID_INPUT, HTTP_STATUS.badRequest);

  const input = parsed.data;
  const { orderId } = await context.params;
  const { data, error } = await admin().rpc('ticket_submit_hold_info', {
    p_order_id: orderId,
    p_member_id: member.id,
    p_actual_depositor: input.actualDepositor ?? null,
    p_refund_bank: input.refundBank ?? null,
    p_refund_account_enc: input.refundAccount ? encryptText(input.refundAccount) : null,
    p_refund_holder: input.refundHolder ?? null,
  });

  const result = data as RpcResult | null;
  if (error || !result) return fail('알려주신 내용을 저장하지 못했습니다.', HTTP_STATUS.serverError);
  if (!result.ok) {
    return fail(
      toMemberReason(String(result.reason ?? '알려주신 내용을 저장할 수 없습니다.')),
      HTTP_STATUS.badRequest,
    );
  }

  return ok({
    holdInfoSubmittedAt: String(result.hold_info_submitted_at ?? ''),
    refundAccountMasked: input.refundAccount ? maskAccountNumber(input.refundAccount) : null,
  });
}
