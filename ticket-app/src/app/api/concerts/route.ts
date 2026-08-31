import { ok, readFailure } from '@/lib/server/api';
import { anon } from '@/lib/server/db-anon';
import { toConcertView, toSessionView } from '@/lib/server/mappers';
import {
  CONCERT_COLUMNS,
  PUBLIC_SESSION_COLUMNS,
  type ConcertRow,
  type PublicSessionRow,
} from '@/lib/server/rows';
import type { ConcertWithSessions } from '@/lib/api-types';

/** 공연 목록 + 회차별 잔여 좌석 — 익명 읽기가 허용된 공개 뷰만 조회한다. */
export async function GET() {
  const client = anon();

  const [concerts, sessions] = await Promise.all([
    client.from('ticket_public_concerts').select(CONCERT_COLUMNS).returns<ConcertRow[]>(),
    client
      .from('ticket_public_sessions')
      .select(PUBLIC_SESSION_COLUMNS)
      .order('start_at', { ascending: true })
      .returns<PublicSessionRow[]>(),
  ]);

  if (concerts.error || sessions.error) return readFailure();

  const items: ConcertWithSessions[] = (concerts.data ?? []).map((row) => ({
    concert: toConcertView(row),
    sessions: (sessions.data ?? []).filter((session) => session.concert_id === row.id).map(toSessionView),
  }));

  return ok({ items });
}
