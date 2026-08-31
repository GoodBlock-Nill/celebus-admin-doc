import { expireOverdueOrders, isGuardFailure, requireAdmin } from '@/lib/server/admin-api';
import { ok, readFailure } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import type { AdminSummaryView, DepositStatus, ReportStatus } from '@/lib/admin-types';
import type { OrderStatus } from '@/lib/api-types';
import { startOfKstDayIso } from '@/lib/time';

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

  const [deposits, orders, reports] = await Promise.all([
    client
      .from('ticket_deposits')
      .select('status')
      .in('status', ['AUTO_MATCHED', 'UNMATCHED', 'HELD'])
      .returns<DepositStatusRow[]>(),
    client
      .from('ticket_orders')
      .select('status, qty, amount_krw, created_at, cancel_requested_at')
      .in('status', ['DEPOSIT_CONFIRMED', 'PAID', 'CANCEL_REQUESTED'])
      .returns<OrderQueueRow[]>(),
    client
      .from('ticket_reports')
      .select('status, deadline_at')
      .eq('status', 'RECEIVED')
      .order('deadline_at', { ascending: true })
      .returns<ReportQueueRow[]>(),
  ]);

  if (deposits.error || orders.error || reports.error) return readFailure();

  const depositRows = deposits.data ?? [];
  const orderRows = orders.data ?? [];
  const reportRows = reports.data ?? [];

  const countDeposits = (status: DepositStatus) =>
    depositRows.filter((row) => row.status === status).length;

  const issuePending = orderRows.filter((row) => row.status === 'DEPOSIT_CONFIRMED');
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
    depositPending: depositRows.length + issuePending.length,
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

  return ok({ summary, adminName: guard });
}
