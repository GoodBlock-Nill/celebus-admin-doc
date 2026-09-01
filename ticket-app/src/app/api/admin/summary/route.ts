import { expireOverdueOrders, isGuardFailure, requireAdmin } from '@/lib/server/admin-api';
import { ok, readFailure } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import type {
  AdminSummaryView,
  DepositStatus,
  PoolIntegrityItemView,
  PoolIntegrityView,
  ReportStatus,
} from '@/lib/admin-types';
import type { OrderStatus } from '@/lib/api-types';
import { startOfKstDayIso } from '@/lib/time';

interface IntegrityItemRow {
  session_id: string;
  session_name: string;
  concert_title: string;
  pool_type: PoolIntegrityItemView['poolType'];
  pool_label: string;
  reserved: number;
  expected_reserved: number;
  issued: number;
  expected_issued: number;
}

interface IntegrityRow {
  checked_at: string;
  checked_count: number;
  mismatch_count: number;
  items: IntegrityItemRow[];
}

/**
 * 재고 정합 점검 (F-3) — 선점·발급 수치를 예매·티켓 실측으로 다시 계산해 비교한다.
 * 읽기 전용이라 어긋난 값을 고치지는 않고, 운영자가 원인을 찾도록 목록만 보여 준다.
 */
async function loadIntegrity(client: ReturnType<typeof admin>): Promise<PoolIntegrityView | null> {
  const { data, error } = await client.rpc('ticket_pool_integrity_check');
  if (error || !data) return null;

  const row = data as IntegrityRow;
  return {
    checkedAt: row.checked_at,
    checkedCount: row.checked_count,
    mismatchCount: row.mismatch_count,
    items: (row.items ?? []).map((item) => ({
      sessionId: item.session_id,
      sessionName: item.session_name,
      concertTitle: item.concert_title,
      poolType: item.pool_type,
      poolLabel: item.pool_label,
      reserved: item.reserved,
      expectedReserved: item.expected_reserved,
      issued: item.issued,
      expectedIssued: item.expected_issued,
    })),
  };
}

interface DepositStatusRow {
  status: DepositStatus;
}

interface OrderQueueRow {
  status: OrderStatus;
  qty: number;
  amount_krw: number;
  created_at: string;
  cancel_requested_at: string | null;
}

interface ReportQueueRow {
  status: ReportStatus;
  deadline_at: string;
}

/** 운영 대시보드·사이드바 뱃지용 처리 대기 집계 */
export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  await expireOverdueOrders();
  const client = admin();

  const [deposits, orders, reports, integrity] = await Promise.all([
    client
      .from('ticket_deposits')
      .select('status')
      .in('status', ['AUTO_MATCHED', 'UNMATCHED', 'HELD'])
      .returns<DepositStatusRow[]>(),
    client
      .from('ticket_orders')
      .select('status, qty, amount_krw, created_at, cancel_requested_at')
      .in('status', ['DEPOSIT_REPORTED', 'DEPOSIT_CONFIRMED', 'PAID', 'CANCEL_REQUESTED'])
      .returns<OrderQueueRow[]>(),
    client
      .from('ticket_reports')
      .select('status, deadline_at')
      .eq('status', 'RECEIVED')
      .order('deadline_at', { ascending: true })
      .returns<ReportQueueRow[]>(),
    loadIntegrity(client),
  ]);

  if (deposits.error || orders.error || reports.error) return readFailure();

  const depositRows = deposits.data ?? [];
  const orderRows = orders.data ?? [];
  const reportRows = reports.data ?? [];

  const countDeposits = (status: DepositStatus) =>
    depositRows.filter((row) => row.status === status).length;

  const issuePending = orderRows.filter((row) => row.status === 'DEPOSIT_CONFIRMED');
  const depositReported = orderRows.filter((row) => row.status === 'DEPOSIT_REPORTED');
  const cancelRequested = orderRows
    .filter((row) => row.status === 'CANCEL_REQUESTED')
    .sort((a, b) => (a.cancel_requested_at ?? '').localeCompare(b.cancel_requested_at ?? ''));

  // 입금이 확인된 시점부터 판매로 집계한다 (티켓 지급 처리 전 주문 포함)
  const todayStart = startOfKstDayIso(new Date());
  const todaySold = orderRows.filter(
    (row) =>
      (row.status === 'DEPOSIT_CONFIRMED' || row.status === 'PAID') && row.created_at >= todayStart,
  );

  const summary: AdminSummaryView = {
    depositPending: depositRows.length + issuePending.length + depositReported.length,
    depositReported: depositReported.length,
    autoMatched: countDeposits('AUTO_MATCHED'),
    unmatched: countDeposits('UNMATCHED'),
    held: countDeposits('HELD'),
    issuePending: issuePending.length,
    refundPending: cancelRequested.length,
    nearestCancelRequestedAt: cancelRequested[0]?.cancel_requested_at ?? null,
    reportPending: reportRows.length,
    nearestReportDeadlineAt: reportRows[0]?.deadline_at ?? null,
    todayQty: todaySold.reduce((sum, row) => sum + row.qty, 0),
    todayAmountKrw: todaySold.reduce((sum, row) => sum + row.amount_krw, 0),
  };

  return ok({ summary, integrity, adminName: guard });
}
