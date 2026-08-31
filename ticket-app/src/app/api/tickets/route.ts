import { isResponse, ok, readFailure, requireMember } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import { loadConcertBriefs, loadSessionBriefs, toTicketSummary } from '@/lib/server/mappers';
import { TICKET_COLUMNS, type TicketRow } from '@/lib/server/rows';

/** 내 티켓 목록 — 발급 순 */
export async function GET(req: Request) {
  const member = await requireMember(req);
  if (isResponse(member)) return member;

  const client = admin();
  const { data, error } = await client
    .from('ticket_tickets')
    .select(TICKET_COLUMNS)
    .eq('member_id', member.id)
    .order('issued_at', { ascending: true })
    .returns<TicketRow[]>();

  if (error) return readFailure();

  const rows = data ?? [];
  const [concerts, sessions] = await Promise.all([
    loadConcertBriefs(client, [...new Set(rows.map((row) => row.concert_id))]),
    loadSessionBriefs(client, [...new Set(rows.map((row) => row.session_id))]),
  ]);

  return ok({
    tickets: rows.map((row) => toTicketSummary(row, concerts.get(row.concert_id), sessions.get(row.session_id))),
  });
}
