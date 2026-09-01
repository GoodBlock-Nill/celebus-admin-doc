import { z } from 'zod';

import {
  callAdminRpc,
  expireOverdueOrders,
  isGuardFailure,
  requireAdmin,
} from '@/lib/server/admin-api';
import { loadDepositViews, loadOrdersByStatus } from '@/lib/server/admin-load';
import { HTTP_STATUS, fail, guardMutation, ok } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';

const MAX_DEPOSITOR_NAME_LENGTH = 30;
const MAX_AMOUNT_KRW = 100_000_000;

const registerSchema = z.object({
  depositorName: z.string().trim().min(1).max(MAX_DEPOSITOR_NAME_LENGTH),
  amountKrw: z.number().int().min(1).max(MAX_AMOUNT_KRW),
});

/**
 * 주문·입금 확인 화면 데이터.
 * 조회 진입 시 입금 마감이 지난 주문을 먼저 정리한다(설계서 §5 lazy 만료).
 */
export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  await expireOverdueOrders();
  const client = admin();

  const [deposits, reported, issuePending, matchable] = await Promise.all([
    loadDepositViews(client),
    // 회원이 입금확인을 요청한 예매 — 오래 기다린 요청이 위로 오게 정렬한다.
    loadOrdersByStatus(client, {
      statuses: ['DEPOSIT_REPORTED'],
      orderBy: 'deposit_reported_at',
      ascending: true,
    }),
    loadOrdersByStatus(client, {
      statuses: ['DEPOSIT_CONFIRMED'],
      orderBy: 'deposit_confirmed_at',
      ascending: true,
    }),
    loadOrdersByStatus(client, {
      statuses: ['AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD'],
      orderBy: 'created_at',
      ascending: true,
    }),
  ]);

  return ok({ deposits, reported, issuePending, matchable });
}

/**
 * 수기 입금 등록 — 은행 입금 내역을 보고 운영자가 입력한다.
 * 등록 즉시 금액·실명 기준 자동 대조가 서버에서 수행된다.
 */
export async function POST(req: Request) {
  const blocked = guardMutation(req, 'admin-deposit');
  if (blocked) return blocked;

  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const parsed = registerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail('입금자명과 입금액을 확인해 주세요.', HTTP_STATUS.badRequest);

  return callAdminRpc(
    'ticket_register_deposit',
    { p_depositor_name: parsed.data.depositorName, p_amount: parsed.data.amountKrw },
    '입금 등록에 실패했습니다.',
  );
}
