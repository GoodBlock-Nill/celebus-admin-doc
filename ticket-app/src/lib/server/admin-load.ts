import 'server-only';

// 관리자 화면 조회 전용 로더 — 주문·입금 행을 화면 표시 형태로 조립한다.
// 상태 변경은 전부 RPC 담당이며, 여기서는 service_role 읽기만 수행한다.
import type { SupabaseClient } from '@supabase/supabase-js';

import { loadSessionBriefs, maskedRefundAccount } from './mappers';
import type { AdminDepositView, AdminOrderView, DepositStatus, OrderPartyView } from '@/lib/admin-types';
import type { OrderStatus } from '@/lib/api-types';

const UNKNOWN_SESSION = '-';
const UNKNOWN_REAL_NAME = '실명 미확인';

export const ADMIN_ORDER_COLUMNS =
  'id, order_no, status, qty, amount_krw, created_at, deposit_deadline, member_id, session_id, ' +
  'hold_reason, hold_actual_depositor, refund_bank, refund_account_enc, refund_holder, ' +
  'hold_info_submitted_at, deposit_reported_at, report_rejected_at, deposit_confirmed_at, ' +
  'cancel_requested_at, refunded_at';

const ADMIN_DEPOSIT_COLUMNS =
  'id, depositor_name, amount_krw, deposited_at, status, matched_order_id, memo';

export interface AdminOrderRow {
  id: string;
  order_no: string;
  status: OrderStatus;
  qty: number;
  amount_krw: number;
  created_at: string;
  deposit_deadline: string;
  member_id: string;
  session_id: string;
  hold_reason: string | null;
  hold_actual_depositor: string | null;
  refund_bank: string | null;
  /** 환불 계좌번호 암호문 — 화면에는 마스킹만 내려준다(원문 비노출) */
  refund_account_enc: string | null;
  refund_holder: string | null;
  hold_info_submitted_at: string | null;
  deposit_reported_at: string | null;
  report_rejected_at: string | null;
  deposit_confirmed_at: string | null;
  cancel_requested_at: string | null;
  refunded_at: string | null;
}

interface AdminDepositRow {
  id: string;
  depositor_name: string;
  amount_krw: number;
  deposited_at: string;
  status: DepositStatus;
  matched_order_id: string | null;
  memo: string | null;
}

interface MemberNameRow {
  id: string;
  nickname: string;
}

interface VerificationNameRow {
  member_id: string;
  real_name: string;
}

/**
 * 주문자 표기(실명·닉네임) 조회.
 * 실명은 입금 대조·환불 확인에 필요한 최소 범위에서만 사용한다.
 */
export async function loadOrderParties(
  client: SupabaseClient,
  memberIds: string[],
): Promise<Map<string, OrderPartyView>> {
  const unique = [...new Set(memberIds)];
  if (unique.length === 0) return new Map();

  const [members, verifications] = await Promise.all([
    client.from('ticket_members').select('id, nickname').in('id', unique).returns<MemberNameRow[]>(),
    client
      .from('ticket_identity_verifications')
      .select('member_id, real_name')
      .in('member_id', unique)
      .returns<VerificationNameRow[]>(),
  ]);

  const nicknames = new Map((members.data ?? []).map((row) => [row.id, row.nickname]));
  const realNames = new Map((verifications.data ?? []).map((row) => [row.member_id, row.real_name]));

  return new Map(
    unique.map((memberId) => [
      memberId,
      {
        realName: realNames.get(memberId) ?? UNKNOWN_REAL_NAME,
        nickname: nicknames.get(memberId) ?? '',
      },
    ]),
  );
}

function toOrderView(
  row: AdminOrderRow,
  sessionName: string,
  party: OrderPartyView | undefined,
): AdminOrderView {
  return {
    id: row.id,
    orderNo: row.order_no,
    status: row.status,
    qty: row.qty,
    amountKrw: row.amount_krw,
    createdAt: row.created_at,
    depositDeadline: row.deposit_deadline,
    sessionName,
    holdReason: row.hold_reason,
    holdActualDepositor: row.hold_actual_depositor,
    refundBank: row.refund_bank,
    refundAccountMasked: maskedRefundAccount(row.refund_account_enc),
    refundHolder: row.refund_holder,
    holdInfoSubmittedAt: row.hold_info_submitted_at,
    depositReportedAt: row.deposit_reported_at,
    reportRejectedAt: row.report_rejected_at,
    depositConfirmedAt: row.deposit_confirmed_at,
    cancelRequestedAt: row.cancel_requested_at,
    refundedAt: row.refunded_at,
    party: party ?? { realName: UNKNOWN_REAL_NAME, nickname: '' },
  };
}

/** 주문 행 묶음 → 화면 표시 형태 (회차명·주문자 표기 결합) */
export async function buildOrderViews(
  client: SupabaseClient,
  rows: AdminOrderRow[],
): Promise<AdminOrderView[]> {
  if (rows.length === 0) return [];

  const [sessions, parties] = await Promise.all([
    loadSessionBriefs(client, [...new Set(rows.map((row) => row.session_id))]),
    loadOrderParties(client, rows.map((row) => row.member_id)),
  ]);

  return rows.map((row) =>
    toOrderView(row, sessions.get(row.session_id)?.name ?? UNKNOWN_SESSION, parties.get(row.member_id)),
  );
}

export interface OrderQuery {
  statuses: OrderStatus[];
  orderBy: string;
  ascending: boolean;
}

/** 상태로 주문을 조회해 화면 표시 형태로 반환한다. */
export async function loadOrdersByStatus(
  client: SupabaseClient,
  query: OrderQuery,
): Promise<AdminOrderView[]> {
  const { data } = await client
    .from('ticket_orders')
    .select(ADMIN_ORDER_COLUMNS)
    .in('status', query.statuses)
    .order(query.orderBy, { ascending: query.ascending })
    .returns<AdminOrderRow[]>();

  return buildOrderViews(client, data ?? []);
}

/** 입금 내역 전체 — 최근 입금이 위. 매칭된 주문 정보를 함께 붙인다. */
export async function loadDepositViews(client: SupabaseClient): Promise<AdminDepositView[]> {
  const { data } = await client
    .from('ticket_deposits')
    .select(ADMIN_DEPOSIT_COLUMNS)
    .order('deposited_at', { ascending: false })
    .returns<AdminDepositRow[]>();

  const deposits = data ?? [];
  const orderIds = deposits
    .map((deposit) => deposit.matched_order_id)
    .filter((id): id is string => Boolean(id));

  const orderRows =
    orderIds.length === 0
      ? []
      : ((
          await client
            .from('ticket_orders')
            .select(ADMIN_ORDER_COLUMNS)
            .in('id', [...new Set(orderIds)])
            .returns<AdminOrderRow[]>()
        ).data ?? []);

  const orders = new Map((await buildOrderViews(client, orderRows)).map((order) => [order.id, order]));

  return deposits.map((deposit) => ({
    id: deposit.id,
    depositorName: deposit.depositor_name,
    amountKrw: deposit.amount_krw,
    depositedAt: deposit.deposited_at,
    status: deposit.status,
    memo: deposit.memo,
    order: deposit.matched_order_id ? (orders.get(deposit.matched_order_id) ?? null) : null,
  }));
}
