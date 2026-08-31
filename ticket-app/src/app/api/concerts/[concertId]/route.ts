import { HTTP_STATUS, fail, ok, readFailure } from '@/lib/server/api';
import { anon } from '@/lib/server/db-anon';
import { toConcertView, toSessionView } from '@/lib/server/mappers';
import {
  CONCERT_COLUMNS,
  PUBLIC_SESSION_COLUMNS,
  type ConcertRow,
  type PublicSessionRow,
} from '@/lib/server/rows';

/** 공연 상세 + 회차별 잔여 좌석 */
export async function GET(_req: Request, context: { params: Promise<{ concertId: string }> }) {
  const { concertId } = await context.params;
  const client = anon();

  const concert = await client
    .from('ticket_public_concerts')
    .select(CONCERT_COLUMNS)
    .eq('id', concertId)
    .maybeSingle<ConcertRow>();

  if (concert.error) return readFailure();
  if (!concert.data) return fail('공연 정보를 찾을 수 없습니다.', HTTP_STATUS.notFound);

  const sessions = await client
    .from('ticket_public_sessions')
    .select(PUBLIC_SESSION_COLUMNS)
    .eq('concert_id', concertId)
    .order('start_at', { ascending: true })
    .returns<PublicSessionRow[]>();

  if (sessions.error) return readFailure();

  return ok({
    concert: toConcertView(concert.data),
    sessions: (sessions.data ?? []).map(toSessionView),
  });
}
