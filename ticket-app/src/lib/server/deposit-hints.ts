import 'server-only';

/**
 * 입금 행에 붙이는 대조 힌트 계산 (재설계서 B-5 / B-6).
 *
 * · 매칭 후보 — 예매가 연결되지 않은 입금과 금액이 같은 진행 중 예매 목록.
 *   후보가 둘 이상이면 서버가 자동 매칭을 하지 않았다는 뜻이라 운영자 확인이 필요하다.
 * · 분할 입금 후보 — 같은 입금자명으로 나눠 들어온 미종결 입금의 합계가
 *   그 이름의 진행 중 예매 금액과 딱 맞을 때 함께 연결하도록 알려 준다.
 *
 * 모든 계산은 읽기 전용이며, 실제 연결은 운영자가 수동 매칭으로 확정한다.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { DepositMatchCandidateView, SplitDepositHintView } from '@/lib/admin-types';
import type { DepositStatus } from '@/lib/admin-types';

/** 아직 예매 대금으로 확정되지 않은 입금 상태 — 힌트 계산 대상 */
const OPEN_DEPOSIT_STATUSES: DepositStatus[] = ['UNMATCHED', 'HELD'];

/** 진행 중 예매 상태 — 아직 대금을 받을 수 있는 예매 */
const OPEN_ORDER_STATUSES = ['AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD'];

/** 후보가 지나치게 많으면 화면이 읽히지 않아 앞쪽 몇 건만 보여 준다 */
const MAX_CANDIDATES = 5;

export interface DepositHintInput {
  id: string;
  depositorName: string;
  amountKrw: number;
  status: DepositStatus;
  matchedOrderId: string | null;
}

export interface DepositHint {
  matchCandidates: DepositMatchCandidateView[];
  splitHint: SplitDepositHintView | null;
}

interface OpenOrderRow {
  id: string;
  order_no: string;
  qty: number;
  amount_krw: number;
  member_id: string;
  created_at: string;
}

interface RealNameRow {
  member_id: string;
  real_name: string;
}

interface OpenOrder extends DepositMatchCandidateView {
  createdAt: string;
}

/** 입금자명 정규화 — 공백을 지운다 (서버 함수 ticket_norm_name과 같은 기준) */
function normalizeName(value: string): string {
  return value.replace(/\s/g, '');
}

/** 입금자명이 예매의 실명 규칙(실명 또는 실명+예매번호 끝 4자리)에 맞는지 */
function matchesNameRule(depositorName: string, order: OpenOrder): boolean {
  const name = normalizeName(depositorName);
  const realName = normalizeName(order.realName);
  if (realName === '') return false;
  return name === realName || name === `${realName}${order.orderNo.slice(-4)}`;
}

/** 진행 중 예매 목록 — 후보 계산에 필요한 최소 항목만 읽는다. */
async function loadOpenOrders(client: SupabaseClient): Promise<OpenOrder[]> {
  const { data } = await client
    .from('ticket_orders')
    .select('id, order_no, qty, amount_krw, member_id, created_at')
    .in('status', OPEN_ORDER_STATUSES)
    .order('created_at', { ascending: true })
    .returns<OpenOrderRow[]>();

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const { data: names } = await client
    .from('ticket_identity_verifications')
    .select('member_id, real_name')
    .in('member_id', [...new Set(rows.map((row) => row.member_id))])
    .returns<RealNameRow[]>();

  const realNames = new Map((names ?? []).map((row) => [row.member_id, row.real_name]));

  return rows.map((row) => ({
    orderId: row.id,
    orderNo: row.order_no,
    realName: realNames.get(row.member_id) ?? '',
    qty: row.qty,
    amountKrw: row.amount_krw,
    createdAt: row.created_at,
  }));
}

function toCandidateView(order: OpenOrder): DepositMatchCandidateView {
  return {
    orderId: order.orderId,
    orderNo: order.orderNo,
    realName: order.realName,
    qty: order.qty,
    amountKrw: order.amountKrw,
  };
}

/**
 * 이 입금이 어느 예매의 대금일 수 있는지 후보를 고른다.
 * 입금자명 규칙까지 맞는 예매가 있으면 그 예매들만 후보로 좁힌다 —
 * 그런 예매가 둘 이상이면 서버가 자동 매칭을 멈춘 바로 그 상황이다(B-5).
 */
function findCandidates(
  deposit: DepositHintInput,
  orders: OpenOrder[],
): DepositMatchCandidateView[] {
  const sameAmount = orders.filter((order) => order.amountKrw === deposit.amountKrw);
  const sameName = sameAmount.filter((order) => matchesNameRule(deposit.depositorName, order));
  const candidates = sameName.length > 0 ? sameName : sameAmount;
  return candidates.slice(0, MAX_CANDIDATES).map(toCandidateView);
}

/** 같은 입금자명으로 나눠 들어온 미종결 입금 묶음 → 합계가 맞는 예매를 찾는다. */
function buildSplitHints(
  deposits: DepositHintInput[],
  orders: OpenOrder[],
): Map<string, SplitDepositHintView> {
  const groups = new Map<string, DepositHintInput[]>();
  for (const deposit of deposits) {
    if (!OPEN_DEPOSIT_STATUSES.includes(deposit.status)) continue;
    const key = normalizeName(deposit.depositorName);
    groups.set(key, [...(groups.get(key) ?? []), deposit]);
  }

  const hints = new Map<string, SplitDepositHintView>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;

    const totalKrw = group.reduce((sum, deposit) => sum + deposit.amountKrw, 0);
    const target = orders.find(
      (order) => order.amountKrw === totalKrw && matchesNameRule(group[0].depositorName, order),
    );
    if (!target) continue;

    const hint: SplitDepositHintView = {
      depositIds: group.map((deposit) => deposit.id),
      totalKrw,
      order: toCandidateView(target),
    };
    for (const deposit of group) hints.set(deposit.id, hint);
  }

  return hints;
}

/** 입금 식별자 → 대조 힌트 */
export async function buildDepositHints(
  client: SupabaseClient,
  deposits: DepositHintInput[],
): Promise<Map<string, DepositHint>> {
  const hints = new Map<string, DepositHint>();
  if (deposits.length === 0) return hints;

  const orders = await loadOpenOrders(client);
  const splitHints = buildSplitHints(deposits, orders);

  for (const deposit of deposits) {
    const isOpen = OPEN_DEPOSIT_STATUSES.includes(deposit.status);

    hints.set(deposit.id, {
      matchCandidates:
        isOpen && !deposit.matchedOrderId ? findCandidates(deposit, orders) : [],
      splitHint: splitHints.get(deposit.id) ?? null,
    });
  }

  return hints;
}
