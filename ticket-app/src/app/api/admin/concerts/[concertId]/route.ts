import { isGuardFailure, requireAdmin } from '@/lib/server/admin-api';
import { HTTP_STATUS, fail, ok, readFailure } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import { toImageUrlList } from '@/lib/server/mappers';
import { CONCERT_COLUMNS, type ConcertRow } from '@/lib/server/rows';
import type {
  AdminConcertDetailView,
  AdminLogView,
  AdminSessionView,
  IssuanceRowView,
  PoolStockView,
} from '@/lib/admin-types';
import type { PoolType, TicketStatus } from '@/lib/api-types';

/** 상세 화면에 함께 노출하는 관련 활동 로그 건수 */
const RECENT_LOG_LIMIT = 10;
/** 관련 로그 대조 대상 — 최근 활동 로그 조회 상한 */
const LOG_SCAN_LIMIT = 300;

const POOL_ORDER: PoolType[] = ['PAID_SALE', 'CELEBUS_WINNER', 'IX_INVITATION', 'OPERATION_HOLD'];

/** 공연 취소 시 일괄 처리 대상이 되는 예매 상태 (진행중 예매) */
const ACTIVE_ORDER_STATUSES = [
  'AWAITING_DEPOSIT',
  'DEPOSIT_REPORTED',
  'ON_HOLD',
  'DEPOSIT_CONFIRMED',
  'PAID',
];

interface SessionRow {
  id: string;
  name: string;
  start_at: string;
  entry_open_minutes_before: number;
}

interface PoolRow {
  session_id: string;
  pool_type: PoolType;
  allocated: number;
  reserved: number;
  issued: number;
}

interface LogRow {
  id: string;
  actor: string;
  action: string;
  detail: string;
  created_at: string;
}

/** 지급된 티켓 1건 — 지급 현황 집계와 관련 로그 대조에 함께 쓴다 */
interface TicketRow {
  code: string;
  session_id: string;
  pool_type: PoolType;
  status: TicketStatus;
}

function toPools(rows: PoolRow[], sessionId: string): PoolStockView[] {
  return POOL_ORDER.map((poolType) => {
    const found = rows.find((row) => row.session_id === sessionId && row.pool_type === poolType);
    return {
      poolType,
      allocated: found?.allocated ?? 0,
      reserved: found?.reserved ?? 0,
      issued: found?.issued ?? 0,
    };
  });
}

/** 회차 1건의 분류별 지급 집계 — 입장 완료·입장 전은 CELEBUS 앱 체크인 결과가 반영된 값이다 */
function toIssuance(rows: TicketRow[], sessionId: string): IssuanceRowView[] {
  const own = rows.filter((row) => row.session_id === sessionId);
  return POOL_ORDER.map((poolType) => {
    const pooled = own.filter((row) => row.pool_type === poolType);
    return {
      poolType,
      issued: pooled.length,
      used: pooled.filter((row) => row.status === 'USED').length,
      waiting: pooled.filter((row) => row.status === 'VALID').length,
      revoked: pooled.filter((row) => row.status === 'REVOKED').length,
    };
  });
}

/** 공연 상세 — 회차별 4분류 재고·지급 현황 + 관련 최근 활동 로그 */
export async function GET(req: Request, context: { params: Promise<{ concertId: string }> }) {
  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const { concertId } = await context.params;
  const client = admin();

  const concert = await client
    .from('ticket_concerts')
    .select(CONCERT_COLUMNS)
    .eq('id', concertId)
    .maybeSingle<ConcertRow>();

  if (concert.error) return readFailure();
  if (!concert.data) return fail('공연 정보를 찾을 수 없습니다.', HTTP_STATUS.notFound);

  const sessions = await client
    .from('ticket_concert_sessions')
    .select('id, name, start_at, entry_open_minutes_before')
    .eq('concert_id', concertId)
    .order('start_at', { ascending: true })
    .returns<SessionRow[]>();

  if (sessions.error) return readFailure();
  const sessionRows = sessions.data ?? [];

  const pools =
    sessionRows.length === 0
      ? { data: [] as PoolRow[] }
      : await client
          .from('ticket_session_pools')
          .select('session_id, pool_type, allocated, reserved, issued')
          .in(
            'session_id',
            sessionRows.map((row) => row.id),
          )
          .returns<PoolRow[]>();

  const tickets = await client
    .from('ticket_tickets')
    .select('code, session_id, pool_type, status')
    .eq('concert_id', concertId)
    .returns<TicketRow[]>();

  const ticketRows = tickets.data ?? [];

  const sessionViews: AdminSessionView[] = sessionRows.map((row) => ({
    id: row.id,
    name: row.name,
    startAt: row.start_at,
    entryOpenMinutesBefore: row.entry_open_minutes_before,
    pools: toPools(pools.data ?? [], row.id),
    issuance: toIssuance(ticketRows, row.id),
  }));

  const row = concert.data;
  const detail: AdminConcertDetailView = {
    id: row.id,
    title: row.title,
    artist: row.artist,
    venue: row.venue,
    venueAddress: row.venue_address,
    venueMapUrl: row.venue_map_url,
    posterUrl: row.poster_url,
    description: row.description,
    detailImageUrls: toImageUrlList(row.detail_image_urls),
    seatType: row.seat_type,
    status: row.status,
    priceKrw: row.price_krw,
    maxPerUser: row.max_per_user,
    salesStartAt: row.sales_start_at,
    salesEndAt: row.sales_end_at,
    notice: row.notice,
    refundPolicy: row.refund_policy,
    sessions: sessionViews,
    activeOrderCount: 0,
  };

  // 공연 취소 확인 문구에 쓸 진행중 예매 건수
  const activeOrders = await client
    .from('ticket_orders')
    .select('id', { count: 'exact', head: true })
    .eq('concert_id', concertId)
    .in('status', ACTIVE_ORDER_STATUSES);

  detail.activeOrderCount = activeOrders.count ?? 0;

  // 관련 로그 — 공연명·회차명·주문번호·티켓 코드가 상세 문구에 포함된 기록.
  // 문구에 괄호·쉼표가 섞여 있어 조회 조건으로 넘기기 어렵기 때문에 최근 로그를 받아 대조한다.
  const [orders, logs] = await Promise.all([
    client.from('ticket_orders').select('order_no').eq('concert_id', concertId).returns<{ order_no: string }[]>(),
    client
      .from('ticket_admin_logs')
      .select('id, actor, action, detail, created_at')
      .order('created_at', { ascending: false })
      .limit(LOG_SCAN_LIMIT)
      .returns<LogRow[]>(),
  ]);

  const keywords = [
    row.title,
    ...sessionRows.map((session) => session.name),
    ...(orders.data ?? []).map((order) => order.order_no),
    ...ticketRows.map((ticket) => ticket.code),
  ].filter(Boolean);

  const relatedLogs: AdminLogView[] = (logs.data ?? [])
    .filter((log) => keywords.some((keyword) => log.detail.includes(keyword)))
    .slice(0, RECENT_LOG_LIMIT)
    .map((log) => ({
      id: log.id,
      actor: log.actor,
      action: log.action,
      detail: log.detail,
      createdAt: log.created_at,
    }));

  return ok({ concert: detail, logs: relatedLogs });
}
