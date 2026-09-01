import 'server-only';

/**
 * 주문 중심 작업함 로더 (재설계서 §5 구획 1·2).
 *
 * 지금까지 관리자 화면은 "입금 건 기준"과 "예매 기준" 목록이 섞여 있어 한 건을 끝내려면
 * 탭을 옮겨 다녀야 했다. 여기서는 처리해야 할 예매 하나를 행으로 삼고, 그 예매를 끝내는 데
 * 필요한 맥락(연결 입금·대조 힌트·회원이 알린 정보·최근 활동 이력)을 한 덩어리로 묶는다.
 *
 * 상태를 바꾸지 않는 조회 전용이며, 처리 자체는 기존 서버 함수(RPC)가 그대로 담당한다.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import { ADMIN_ORDER_COLUMNS, buildOrderViews, type AdminOrderRow } from './admin-load';
import { buildDepositHints } from './deposit-hints';
import { loadConcertBriefs, loadSessionBriefs } from './mappers';
import type {
  AdminIssueSessionView,
  AdminLinkedDepositView,
  AdminLogView,
  AdminOrderView,
  AdminWorklistItemView,
  DepositStatus,
  WorklistKind,
} from '@/lib/admin-types';
import type { OrderStatus } from '@/lib/api-types';

/** 처리 대상이 될 수 있는 예매 상태 */
const QUEUE_ORDER_STATUSES: OrderStatus[] = [
  'AWAITING_DEPOSIT',
  'DEPOSIT_REPORTED',
  'ON_HOLD',
  'DEPOSIT_CONFIRMED',
];

/** 작업함 정렬 우선순위 — 회원 요청이 가장 위 */
const KIND_PRIORITY: Record<WorklistKind, number> = {
  REPORTED: 1,
  AWAITING_CONFIRM: 2,
  ON_HOLD: 3,
  ISSUE_PENDING: 4,
};

/** 활동 이력에서 훑어보는 최근 기록 수 */
const LOG_SCAN_LIMIT = 300;
/** 행 확장에 보여 주는 최근 활동 건수 */
const MAX_ITEM_LOGS = 3;

/**
 * 예매번호가 남지 않는 입금 관련 기록 — 입금자명으로 이어 붙인다.
 * (예: 입금 등록 직후의 자동 대조 기록은 예매번호 없이 입금자명·금액만 남는다)
 */
const DEPOSIT_LOG_ACTIONS = new Set([
  '입금 자동 대조',
  '입금 보류',
  '반환 대상 지정',
  '입금 등록 취소',
  '입금 반환',
  '입금 수동 매칭',
]);

const UNKNOWN_CONCERT = '공연 정보 없음';

interface QueueOrderRow extends AdminOrderRow {
  concert_id: string;
}

interface LinkedDepositRow {
  id: string;
  depositor_name: string;
  amount_krw: number;
  deposited_at: string;
  status: DepositStatus;
  matched_order_id: string | null;
  memo: string | null;
}

interface LogRow {
  id: string;
  actor: string;
  action: string;
  detail: string;
  created_at: string;
}

/** 예매에 연결된 입금 (등록 취소분 제외, 오래된 순) */
async function loadLinkedDeposits(
  client: SupabaseClient,
  orderIds: string[],
): Promise<Map<string, AdminLinkedDepositView[]>> {
  const grouped = new Map<string, AdminLinkedDepositView[]>();
  if (orderIds.length === 0) return grouped;

  const { data } = await client
    .from('ticket_deposits')
    .select('id, depositor_name, amount_krw, deposited_at, status, matched_order_id, memo')
    .in('matched_order_id', orderIds)
    .neq('status', 'VOIDED')
    .order('deposited_at', { ascending: true })
    .returns<LinkedDepositRow[]>();

  const rows = data ?? [];

  // 분할 입금 후보는 "같은 이름으로 나눠 들어온 입금"을 함께 봐야 계산되므로,
  // 예매에 아직 이어지지 않은 미종결 입금까지 넣어 힌트를 만든다.
  const { data: openRows } = await client
    .from('ticket_deposits')
    .select('id, depositor_name, amount_krw, deposited_at, status, matched_order_id, memo')
    .in('status', ['UNMATCHED', 'HELD'])
    .is('matched_order_id', null)
    .returns<LinkedDepositRow[]>();

  const hints = await buildDepositHints(
    client,
    [...rows, ...(openRows ?? [])].map((row) => ({
      id: row.id,
      depositorName: row.depositor_name,
      amountKrw: row.amount_krw,
      status: row.status,
      matchedOrderId: row.matched_order_id,
    })),
  );

  for (const row of rows) {
    if (!row.matched_order_id) continue;
    grouped.set(row.matched_order_id, [
      ...(grouped.get(row.matched_order_id) ?? []),
      {
        id: row.id,
        depositorName: row.depositor_name,
        amountKrw: row.amount_krw,
        depositedAt: row.deposited_at,
        status: row.status,
        memo: row.memo,
        matchCandidates: hints.get(row.id)?.matchCandidates ?? [],
        splitHint: hints.get(row.id)?.splitHint ?? null,
      },
    ]);
  }

  return grouped;
}

/** 최근 활동 이력 (최신순) */
async function loadRecentLogs(client: SupabaseClient): Promise<AdminLogView[]> {
  const { data } = await client
    .from('ticket_admin_logs')
    .select('id, actor, action, detail, created_at')
    .order('created_at', { ascending: false })
    .limit(LOG_SCAN_LIMIT)
    .returns<LogRow[]>();

  return (data ?? []).map((row) => ({
    id: row.id,
    actor: row.actor,
    action: row.action,
    detail: row.detail,
    createdAt: row.created_at,
  }));
}

/** 이 예매와 관련된 최근 활동 — 예매번호 또는 연결 입금의 입금자명으로 찾는다 */
function pickLogs(
  logs: AdminLogView[],
  orderNo: string,
  deposits: AdminLinkedDepositView[],
): AdminLogView[] {
  const names = [...new Set(deposits.map((deposit) => deposit.depositorName))].filter(
    (name) => name.trim() !== '',
  );

  return logs
    .filter(
      (log) =>
        log.detail.includes(orderNo) ||
        (DEPOSIT_LOG_ACTIONS.has(log.action) && names.some((name) => log.detail.includes(name))),
    )
    .slice(0, MAX_ITEM_LOGS);
}

/** 이 예매가 지금 어떤 처리를 기다리는지 */
function resolveKind(
  order: AdminOrderView,
  deposits: AdminLinkedDepositView[],
): WorklistKind | null {
  if (order.status === 'DEPOSIT_CONFIRMED') return 'ISSUE_PENDING';
  if (order.status === 'ON_HOLD') return 'ON_HOLD';
  if (deposits.some((deposit) => deposit.status === 'AUTO_MATCHED')) return 'AWAITING_CONFIRM';
  if (order.status === 'DEPOSIT_REPORTED') return 'REPORTED';
  // 입금 대기 상태이면서 연결 입금도 없는 예매는 아직 운영자가 할 일이 없다.
  return null;
}

/** 이 상태로 기다리기 시작한 시각 */
function resolveWaitingSince(
  kind: WorklistKind,
  order: AdminOrderView,
  deposits: AdminLinkedDepositView[],
): string {
  if (kind === 'ISSUE_PENDING') return order.depositConfirmedAt ?? order.createdAt;
  if (kind === 'AWAITING_CONFIRM') {
    return (
      deposits.find((deposit) => deposit.status === 'AUTO_MATCHED')?.depositedAt ?? order.createdAt
    );
  }
  if (kind === 'ON_HOLD') return deposits[0]?.depositedAt ?? order.createdAt;
  return order.depositReportedAt ?? order.createdAt;
}

/** 티켓 지급 대기 예매를 회차별로 묶는다 (공연 당일 일괄 지급용) */
function buildIssueSessions(items: AdminWorklistItemView[], sessionIdByOrder: Map<string, string>) {
  const sessions = new Map<string, AdminIssueSessionView>();

  for (const item of items) {
    if (item.kind !== 'ISSUE_PENDING') continue;
    const sessionId = sessionIdByOrder.get(item.order.id);
    if (!sessionId) continue;

    const current = sessions.get(sessionId) ?? {
      sessionId,
      sessionName: item.order.sessionName,
      concertTitle: item.concertTitle,
      startAt: item.sessionStartAt,
      pendingOrders: 0,
      pendingQty: 0,
    };

    sessions.set(sessionId, {
      ...current,
      pendingOrders: current.pendingOrders + 1,
      pendingQty: current.pendingQty + item.order.qty,
    });
  }

  return [...sessions.values()].sort((left, right) => left.startAt.localeCompare(right.startAt));
}

export interface WorklistResult {
  items: AdminWorklistItemView[];
  issueSessions: AdminIssueSessionView[];
}

/** 주문 중심 작업함 — 처리 필요한 예매만 우선순위 순으로 돌려준다 */
export async function loadWorklist(client: SupabaseClient): Promise<WorklistResult> {
  const { data } = await client
    .from('ticket_orders')
    .select(`${ADMIN_ORDER_COLUMNS}, concert_id`)
    .in('status', QUEUE_ORDER_STATUSES)
    .order('created_at', { ascending: true })
    .returns<QueueOrderRow[]>();

  const rows = data ?? [];
  if (rows.length === 0) return { items: [], issueSessions: [] };

  const [views, depositsByOrder, logs, sessions, concerts] = await Promise.all([
    buildOrderViews(client, rows),
    loadLinkedDeposits(
      client,
      rows.map((row) => row.id),
    ),
    loadRecentLogs(client),
    loadSessionBriefs(client, [...new Set(rows.map((row) => row.session_id))]),
    loadConcertBriefs(client, [...new Set(rows.map((row) => row.concert_id))]),
  ]);

  const sessionIdByOrder = new Map(rows.map((row) => [row.id, row.session_id]));
  const concertIdByOrder = new Map(rows.map((row) => [row.id, row.concert_id]));

  const items: AdminWorklistItemView[] = [];
  for (const order of views) {
    const deposits = depositsByOrder.get(order.id) ?? [];
    const kind = resolveKind(order, deposits);
    if (!kind) continue;

    items.push({
      order,
      kind,
      waitingSince: resolveWaitingSince(kind, order, deposits),
      concertTitle: concerts.get(concertIdByOrder.get(order.id) ?? '')?.title ?? UNKNOWN_CONCERT,
      sessionStartAt: sessions.get(sessionIdByOrder.get(order.id) ?? '')?.start_at ?? '',
      deposits,
      logs: pickLogs(logs, order.orderNo, deposits),
    });
  }

  items.sort(
    (left, right) =>
      KIND_PRIORITY[left.kind] - KIND_PRIORITY[right.kind] ||
      left.waitingSince.localeCompare(right.waitingSince),
  );

  return { items, issueSessions: buildIssueSessions(items, sessionIdByOrder) };
}
