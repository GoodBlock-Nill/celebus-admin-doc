import { expireOverdueOrders, isGuardFailure, requireAdmin } from '@/lib/server/admin-api';
import { ORDER_SEARCH_PAGE_SIZE, searchOrders } from '@/lib/server/admin-orders';
import { ok } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import type { OrderStatus } from '@/lib/api-types';

/** 조회 가능한 예매 상태 — 만료·지급 완료·환불 완료까지 전 구간을 포함한다 */
const ORDER_STATUSES: OrderStatus[] = [
  'AWAITING_DEPOSIT',
  'DEPOSIT_REPORTED',
  'ON_HOLD',
  'DEPOSIT_CONFIRMED',
  'PAID',
  'EXPIRED',
  'CANCEL_REQUESTED',
  'REFUNDED',
];

const MAX_KEYWORD_LENGTH = 40;

function readStatuses(value: string | null): OrderStatus[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is OrderStatus => (ORDER_STATUSES as string[]).includes(item));
}

function readPage(value: string | null): number {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * 주문 조회 — 예매번호·실명·상태로 찾고 20건씩 나눠 준다.
 * 처리 큐에 걸리지 않는 예매(자동 취소·지급 완료·환불 완료)까지 모두 대상이다.
 */
export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  await expireOverdueOrders();

  const params = new URL(req.url).searchParams;
  const result = await searchOrders(admin(), {
    keyword: (params.get('q') ?? '').slice(0, MAX_KEYWORD_LENGTH),
    statuses: readStatuses(params.get('status')),
    page: readPage(params.get('page')),
  });

  return ok({ ...result, pageSize: ORDER_SEARCH_PAGE_SIZE });
}
