import 'server-only';

/**
 * 주문 조회 로더 (재설계서 D-8).
 *
 * 처리 대기 큐에 걸리지 않는 예매(자동 취소·티켓 지급 완료·환불 완료)는 지금까지 관리자
 * 어느 화면에도 나오지 않아 고객 문의에 답할 수 없었다. 예매번호·실명·상태로 전 구간을
 * 찾고, 그 예매에 연결된 입금·티켓 요약까지 함께 돌려준다.
 *
 * 상태를 바꾸지 않는 조회이므로 서버 함수(RPC) 없이 읽기 질의로만 구성한다.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import { ADMIN_ORDER_COLUMNS, buildOrderViews, type AdminOrderRow } from './admin-load';
import { loadConcertBriefs } from './mappers';
import type { AdminOrderSearchView, DepositStatus } from '@/lib/admin-types';
import type { OrderStatus } from '@/lib/api-types';

export const ORDER_SEARCH_PAGE_SIZE = 20;

/** 실명 검색 후보 상한 — 지나치게 넓은 검색어가 질의를 키우지 않게 자른다 */
const MAX_NAME_MATCHES = 200;

/** 어떤 회원과도 맞지 않는 식별자 — 실명 검색 결과가 없을 때 빈 결과를 만든다 */
const NO_MEMBER = '00000000-0000-0000-0000-000000000000';

const UNKNOWN_CONCERT = '공연 정보 없음';

export interface OrderSearchQuery {
  /** 예매번호 일부 또는 주문자 실명 (비우면 전체) */
  keyword: string;
  /** 비우면 모든 상태 */
  statuses: OrderStatus[];
  /** 1부터 시작 */
  page: number;
}

export interface OrderSearchResult {
  items: AdminOrderSearchView[];
  total: number;
  page: number;
  pageSize: number;
}

interface SearchOrderRow extends AdminOrderRow {
  concert_id: string;
}

interface DepositBriefRow {
  id: string;
  depositor_name: string;
  amount_krw: number;
  deposited_at: string;
  status: DepositStatus;
  matched_order_id: string | null;
}

interface TicketBriefRow {
  order_id: string | null;
  status: string;
}

/**
 * 검색어 정리 — 조회 조건 구문에서 뜻을 갖는 문자를 제거한다.
 * (한글·영문·숫자·하이픈만 남긴다)
 */
function sanitizeKeyword(keyword: string): string {
  return keyword.trim().replace(/[^0-9A-Za-z가-힣-]/g, '');
}

/** 실명이 검색어를 포함하는 회원 식별자 */
async function findMemberIdsByRealName(
  client: SupabaseClient,
  keyword: string,
): Promise<string[]> {
  const { data } = await client
    .from('ticket_identity_verifications')
    .select('member_id')
    .ilike('real_name', `%${keyword}%`)
    .limit(MAX_NAME_MATCHES)
    .returns<Array<{ member_id: string }>>();

  return (data ?? []).map((row) => row.member_id);
}

/** 예매에 연결된 입금 요약 */
async function loadOrderDeposits(
  client: SupabaseClient,
  orderIds: string[],
): Promise<Map<string, AdminOrderSearchView['deposits']>> {
  const grouped = new Map<string, AdminOrderSearchView['deposits']>();
  if (orderIds.length === 0) return grouped;

  const { data } = await client
    .from('ticket_deposits')
    .select('id, depositor_name, amount_krw, deposited_at, status, matched_order_id')
    .in('matched_order_id', orderIds)
    .order('deposited_at', { ascending: true })
    .returns<DepositBriefRow[]>();

  for (const row of data ?? []) {
    if (!row.matched_order_id) continue;
    grouped.set(row.matched_order_id, [
      ...(grouped.get(row.matched_order_id) ?? []),
      {
        id: row.id,
        depositorName: row.depositor_name,
        amountKrw: row.amount_krw,
        depositedAt: row.deposited_at,
        status: row.status,
      },
    ]);
  }

  return grouped;
}

/** 예매별 티켓 매수 (유효/회수 구분) */
async function loadTicketCounts(
  client: SupabaseClient,
  orderIds: string[],
): Promise<Map<string, { valid: number; revoked: number }>> {
  const counts = new Map<string, { valid: number; revoked: number }>();
  if (orderIds.length === 0) return counts;

  const { data } = await client
    .from('ticket_tickets')
    .select('order_id, status')
    .in('order_id', orderIds)
    .returns<TicketBriefRow[]>();

  for (const row of data ?? []) {
    if (!row.order_id) continue;
    const current = counts.get(row.order_id) ?? { valid: 0, revoked: 0 };
    if (row.status === 'REVOKED') current.revoked += 1;
    else current.valid += 1;
    counts.set(row.order_id, current);
  }

  return counts;
}

/** 예매번호·실명·상태로 예매를 찾는다 (최근 신청 순, 20건씩) */
export async function searchOrders(
  client: SupabaseClient,
  query: OrderSearchQuery,
): Promise<OrderSearchResult> {
  const page = Math.max(1, query.page);
  const from = (page - 1) * ORDER_SEARCH_PAGE_SIZE;
  const keyword = sanitizeKeyword(query.keyword);

  let request = client
    .from('ticket_orders')
    .select(`${ADMIN_ORDER_COLUMNS}, concert_id`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + ORDER_SEARCH_PAGE_SIZE - 1);

  if (query.statuses.length > 0) request = request.in('status', query.statuses);

  if (keyword !== '') {
    const memberIds = await findMemberIdsByRealName(client, keyword);
    const ids = memberIds.length > 0 ? memberIds : [NO_MEMBER];
    request = request.or(`order_no.ilike.%${keyword}%,member_id.in.(${ids.join(',')})`);
  }

  const { data, count } = await request.returns<SearchOrderRow[]>();
  const rows = data ?? [];
  const orderIds = rows.map((row) => row.id);

  const [views, concerts, deposits, tickets] = await Promise.all([
    buildOrderViews(client, rows),
    loadConcertBriefs(client, [...new Set(rows.map((row) => row.concert_id))]),
    loadOrderDeposits(client, orderIds),
    loadTicketCounts(client, orderIds),
  ]);

  const concertIdByOrder = new Map(rows.map((row) => [row.id, row.concert_id]));

  return {
    items: views.map((order) => {
      const ticketCount = tickets.get(order.id) ?? { valid: 0, revoked: 0 };
      return {
        ...order,
        concertTitle:
          concerts.get(concertIdByOrder.get(order.id) ?? '')?.title ?? UNKNOWN_CONCERT,
        deposits: deposits.get(order.id) ?? [],
        ticketCount: ticketCount.valid,
        revokedTicketCount: ticketCount.revoked,
      };
    }),
    total: count ?? 0,
    page,
    pageSize: ORDER_SEARCH_PAGE_SIZE,
  };
}
