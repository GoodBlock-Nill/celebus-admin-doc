import { z } from 'zod';

/**
 * 은행 내역 대조 원클릭 처리 (재설계서 §5 구획 1).
 *
 * 지금까지는 ①수기 입금 등록 → ②자동 대조 결과 확인 → ③확인 대기 목록에서 입금 확인,
 * 세 단계를 서로 다른 화면에서 밟아야 했다. 여기서는 처리 중인 예매를 지목한 상태로
 * 은행 내역을 입력받아 등록·대조·입금 확인을 한 번에 끝낸다.
 *
 * 서버 규칙을 새로 만들지 않기 위해 기존 함수(입금 등록·입금 확정)를 순서대로 호출하며,
 * 지목한 예매와 다른 결과가 나오면 그 사실만 알려 주고 임의로 밀어붙이지 않는다.
 */
import { isGuardFailure, requireAdmin } from '@/lib/server/admin-api';
import { HTTP_STATUS, fail, guardMutation, ok, type RpcResult } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import type { HoldCauseCode } from '@/lib/api-types';

const MAX_DEPOSITOR_NAME_LENGTH = 30;
const MAX_AMOUNT_KRW = 100_000_000;

const schema = z.object({
  orderId: z.string().uuid(),
  depositorName: z.string().trim().min(1).max(MAX_DEPOSITOR_NAME_LENGTH),
  amountKrw: z.number().int().min(1).max(MAX_AMOUNT_KRW),
});

/** 입금 등록 결과 — 서버 함수가 돌려주는 자동 대조 판정 */
interface RegisterResult extends RpcResult {
  deposit_id?: string;
  status?: string;
  matched_order_id?: string | null;
  hold_cause?: HoldCauseCode | null;
  memo?: string | null;
}

/** 지목한 예매의 예매번호 (안내 문구에 사용) */
async function readOrderNo(orderId: string): Promise<string> {
  const { data } = await admin()
    .from('ticket_orders')
    .select('order_no')
    .eq('id', orderId)
    .maybeSingle<{ order_no: string }>();

  return data?.order_no ?? '';
}

/**
 * 대조 결과 → 화면이 이해할 처리 결과.
 * CONFIRMED = 원클릭 완료 · MATCHED_OTHER = 다른 예매의 대금 · 그 밖에는 등록만 된 상태.
 */
async function resolveOutcome(
  registered: RegisterResult,
  orderId: string,
  adminName: string,
): Promise<Record<string, unknown>> {
  const depositId = registered.deposit_id ?? '';
  const base = {
    depositId,
    depositStatus: registered.status ?? '',
    holdCause: registered.hold_cause ?? null,
    memo: registered.memo ?? null,
  };

  const matchedOrderId = registered.matched_order_id ?? null;

  if (registered.status === 'AUTO_MATCHED' && matchedOrderId === orderId) {
    const { data } = await admin().rpc('ticket_confirm_deposit', {
      p_deposit_id: depositId,
      p_admin: adminName,
    });
    const confirmed = data as RpcResult | null;

    if (!confirmed || !confirmed.ok) {
      return {
        ...base,
        outcome: 'CONFIRM_FAILED',
        reason: String(confirmed?.reason ?? '입금 확인에 실패했습니다.'),
      };
    }

    return { ...base, outcome: 'CONFIRMED', orderNo: String(confirmed.order_no ?? '') };
  }

  if (matchedOrderId && matchedOrderId !== orderId) {
    return {
      ...base,
      outcome: registered.status === 'AUTO_MATCHED' ? 'MATCHED_OTHER' : 'LINKED_OTHER',
      matchedOrderNo: await readOrderNo(matchedOrderId),
    };
  }

  return { ...base, outcome: registered.status ?? 'UNMATCHED' };
}

/** 은행 내역 대조 — 입금 등록 + 자동 대조 + (일치 시) 입금 확인까지 한 번에 */
export async function POST(req: Request) {
  const blocked = guardMutation(req, 'admin-deposit-reconcile');
  if (blocked) return blocked;

  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail('입금자명과 입금액을 확인해 주세요.', HTTP_STATUS.badRequest);

  const { data, error } = await admin().rpc('ticket_register_deposit', {
    p_depositor_name: parsed.data.depositorName,
    p_amount: parsed.data.amountKrw,
  });
  const registered = data as RegisterResult | null;

  if (error || !registered) return fail('입금 등록에 실패했습니다.', HTTP_STATUS.serverError);
  if (!registered.ok) {
    return fail(String(registered.reason ?? '입금 등록에 실패했습니다.'), HTTP_STATUS.badRequest);
  }

  return ok(await resolveOutcome(registered, parsed.data.orderId, guard));
}
