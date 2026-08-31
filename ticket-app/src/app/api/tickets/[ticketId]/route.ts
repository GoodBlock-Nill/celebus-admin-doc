import { HTTP_STATUS, fail, isResponse, ok, readFailure, requireMember } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import { loadConcertBriefs, loadSessionBriefs, toTicketDetail } from '@/lib/server/mappers';
import { TICKET_COLUMNS, type TicketRow } from '@/lib/server/rows';

/**
 * 티켓 상세 — 본인 티켓만 조회된다.
 * 예매 웹은 지급 상태 확인까지만 담당하고, 발권·입장 확인은 CELEBUS 본 앱이 처리한다.
 */
export async function GET(req: Request, context: { params: Promise<{ ticketId: string }> }) {
  const member = await requireMember(req);
  if (isResponse(member)) return member;

  const { ticketId } = await context.params;
  const client = admin();

  const ticket = await client
    .from('ticket_tickets')
    .select(TICKET_COLUMNS)
    .eq('id', ticketId)
    .eq('member_id', member.id)
    .maybeSingle<TicketRow>();

  if (ticket.error) return readFailure();
  if (!ticket.data) return fail('티켓 정보를 찾을 수 없습니다.', HTTP_STATUS.notFound);

  const row = ticket.data;
  const [concerts, sessions] = await Promise.all([
    loadConcertBriefs(client, [row.concert_id]),
    loadSessionBriefs(client, [row.session_id]),
  ]);

  return ok({ ticket: toTicketDetail(row, concerts.get(row.concert_id), sessions.get(row.session_id)) });
}
