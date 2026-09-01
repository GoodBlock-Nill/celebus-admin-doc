import { z } from 'zod';

import {
  callAdminRpc,
  expireOverdueOrders,
  isGuardFailure,
  requireAdmin,
} from '@/lib/server/admin-api';
import {
  loadDepositViews,
  loadOrdersByStatus,
  loadRecentIssuedOrders,
} from '@/lib/server/admin-load';
import { loadWorklist } from '@/lib/server/admin-worklist';
import { HTTP_STATUS, fail, guardMutation, ok } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';

const MAX_DEPOSITOR_NAME_LENGTH = 30;
const MAX_AMOUNT_KRW = 100_000_000;
/** 지급 취소(오지급 정정) 후보로 보여 주는 최근 지급 완료 건수 */
const RECENT_ISSUED_LIMIT = 20;

const registerSchema = z.object({
  depositorName: z.string().trim().min(1).max(MAX_DEPOSITOR_NAME_LENGTH),
  amountKrw: z.number().int().min(1).max(MAX_AMOUNT_KRW),
});

/**
 * 주문·입금 확인 화면 데이터 (주문 중심 작업함).
 * 조회 진입 시 입금 마감이 지난 주문을 먼저 정리한다(설계서 §5 lazy 만료).
 */
export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  await expireOverdueOrders();
  const client = admin();

  const [worklist, deposits, matchable, recentIssued] = await Promise.all([
    // 구획 1·2 — 처리 필요한 예매 큐와 회차별 지급 대상
    loadWorklist(client),
    // 구획 3 — 주문 미상 입금·처리 완료 이력에 쓰는 입금 전체
    loadDepositViews(client),
    // 주문 미상 입금을 이어 붙일 수 있는 진행 중 예매 후보
    loadOrdersByStatus(client, {
      statuses: ['AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD'],
      orderBy: 'created_at',
      ascending: true,
    }),
    // 잘못 지급한 건을 되돌릴 수 있도록 최근 지급 완료 예매를 함께 내려준다.
    loadRecentIssuedOrders(client, RECENT_ISSUED_LIMIT),
  ]);

  return ok({
    worklist: worklist.items,
    issueSessions: worklist.issueSessions,
    deposits,
    matchable,
    recentIssued,
  });
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
