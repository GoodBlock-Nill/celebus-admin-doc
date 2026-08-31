import { isGuardFailure, requireAdmin } from '@/lib/server/admin-api';
import { ok, readFailure } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import { CONCERT_COLUMNS, type ConcertRow } from '@/lib/server/rows';
import type { AdminConcertRowView } from '@/lib/admin-types';

interface SessionPoolRow {
  session_id: string;
  allocated: number;
  reserved: number;
  issued: number;
}

interface SessionConcertRow {
  id: string;
  concert_id: string;
}

/** 공연 목록 — 공연별 회차 수와 4분류 합산 재고를 함께 내려준다. */
export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const client = admin();
  const [concerts, sessions, pools] = await Promise.all([
    client
      .from('ticket_concerts')
      .select(CONCERT_COLUMNS)
      .order('sales_start_at', { ascending: false })
      .returns<ConcertRow[]>(),
    client.from('ticket_concert_sessions').select('id, concert_id').returns<SessionConcertRow[]>(),
    client
      .from('ticket_session_pools')
      .select('session_id, allocated, reserved, issued')
      .returns<SessionPoolRow[]>(),
  ]);

  if (concerts.error || sessions.error || pools.error) return readFailure();

  const sessionToConcert = new Map((sessions.data ?? []).map((row) => [row.id, row.concert_id]));

  const items: AdminConcertRowView[] = (concerts.data ?? []).map((concert) => {
    const ownSessions = (sessions.data ?? []).filter((row) => row.concert_id === concert.id);
    const totals = (pools.data ?? [])
      .filter((pool) => sessionToConcert.get(pool.session_id) === concert.id)
      .reduce(
        (acc, pool) => ({
          allocated: acc.allocated + pool.allocated,
          reserved: acc.reserved + pool.reserved,
          issued: acc.issued + pool.issued,
        }),
        { allocated: 0, reserved: 0, issued: 0 },
      );

    return {
      id: concert.id,
      title: concert.title,
      artist: concert.artist,
      status: concert.status,
      priceKrw: concert.price_krw,
      salesStartAt: concert.sales_start_at,
      salesEndAt: concert.sales_end_at,
      sessionCount: ownSessions.length,
      ...totals,
    };
  });

  return ok({ items });
}
