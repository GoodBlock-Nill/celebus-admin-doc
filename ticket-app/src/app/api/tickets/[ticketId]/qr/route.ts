import { HTTP_STATUS, fail, isResponse, ok, readFailure, requireMember } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import { issueQrToken } from '@/lib/server/qr-token';
import { loadSessionBriefs } from '@/lib/server/mappers';
import { TICKET_COLUMNS, type TicketRow } from '@/lib/server/rows';
import { ENTRY_WINDOW_AFTER_HOURS, MS_PER_HOUR, MS_PER_MINUTE } from '@/lib/constants';

/**
 * 입장 QR용 서명 단기 토큰 발급 (설계서 §5).
 * 본인 티켓만 발급되며, 입장 가능 시간(공연 시작 전 활성화 기준 ~ 시작 후 3시간)도 서버가 판정한다.
 * 화면은 이 토큰을 QR로 그리고 만료 전에 다시 받아 캡처 화면 재사용을 막는다.
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
  if (row.status === 'REVOKED') return fail('환불로 회수된 티켓입니다.', HTTP_STATUS.forbidden);
  if (row.status === 'USED') return fail('이미 입장 처리된 티켓입니다.', HTTP_STATUS.forbidden);

  const sessions = await loadSessionBriefs(client, [row.session_id]);
  const session = sessions.get(row.session_id);
  if (!session) return readFailure();

  const nowMs = Date.now();
  const startMs = new Date(session.start_at).getTime();
  const openMs = startMs - session.entry_open_minutes_before * MS_PER_MINUTE;
  const closeMs = startMs + ENTRY_WINDOW_AFTER_HOURS * MS_PER_HOUR;

  if (nowMs < openMs) {
    return fail(`입장 코드는 공연 시작 ${session.entry_open_minutes_before}분 전에 활성화됩니다.`, HTTP_STATUS.forbidden);
  }
  if (nowMs > closeMs) return fail('입장 시간이 종료되었습니다.', HTTP_STATUS.forbidden);

  const issued = issueQrToken(row.code);
  return ok({ token: issued.token, expiresAt: issued.expiresAt });
}
