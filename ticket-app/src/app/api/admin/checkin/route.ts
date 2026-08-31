import { z } from 'zod';

import { isGuardFailure, requireAdmin } from '@/lib/server/admin-api';
import { HTTP_STATUS, fail, guardMutation, ok, readFailure } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import { looksLikeQrToken, verifyQrToken } from '@/lib/server/qr-token';
import type {
  CheckInKind,
  CheckInResultView,
  IssuanceRowView,
  IssuanceSessionView,
} from '@/lib/admin-types';
import type { PoolType, TicketStatus } from '@/lib/api-types';

const MAX_SCAN_INPUT_LENGTH = 400;
const POOL_ORDER: PoolType[] = ['PAID_SALE', 'CELEBUS_WINNER', 'IX_INVITATION', 'OPERATION_HOLD'];

const scanSchema = z.object({ input: z.string().trim().min(1).max(MAX_SCAN_INPUT_LENGTH) });

interface SessionRow {
  id: string;
  name: string;
  start_at: string;
}

interface TicketCountRow {
  session_id: string;
  pool_type: PoolType;
  status: TicketStatus;
}

interface CheckInTicketRow {
  code: string;
  concert_id: string;
  pool_type: PoolType;
  status: TicketStatus;
  used_at: string | null;
  session_name: string | null;
  member_nickname: string | null;
}

/** 회차·분류별 발급/입장 집계 */
export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const client = admin();
  const [sessions, tickets] = await Promise.all([
    client
      .from('ticket_concert_sessions')
      .select('id, name, start_at')
      .order('start_at', { ascending: true })
      .returns<SessionRow[]>(),
    client
      .from('ticket_tickets')
      .select('session_id, pool_type, status')
      .returns<TicketCountRow[]>(),
  ]);

  if (sessions.error || tickets.error) return readFailure();

  const rows = tickets.data ?? [];
  const items: IssuanceSessionView[] = (sessions.data ?? []).map((session) => {
    const own = rows.filter((row) => row.session_id === session.id);
    const poolRows: IssuanceRowView[] = POOL_ORDER.map((poolType) => {
      const pooled = own.filter((row) => row.pool_type === poolType);
      return {
        poolType,
        issued: pooled.length,
        used: pooled.filter((row) => row.status === 'USED').length,
        waiting: pooled.filter((row) => row.status === 'VALID').length,
        revoked: pooled.filter((row) => row.status === 'REVOKED').length,
      };
    });
    return { sessionId: session.id, sessionName: session.name, rows: poolRows };
  });

  return ok({ items });
}

/**
 * 현장 입장 확인.
 * 입력값이 서명 토큰이면 서명·만료를 검증해 내부 입장 코드를 꺼내고,
 * 8자리 원시 코드도 그대로 허용한다(오프라인 폴백).
 */
export async function POST(req: Request) {
  const blocked = guardMutation(req, 'admin-checkin');
  if (blocked) return blocked;

  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const parsed = scanSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail('티켓 코드를 입력해 주세요.', HTTP_STATUS.badRequest);

  const raw = parsed.data.input.trim();
  let code = raw.toUpperCase();

  if (looksLikeQrToken(raw)) {
    const checked = verifyQrToken(raw);
    if (checked.kind === 'EXPIRED') {
      const expired: CheckInResultView = { kind: 'EXPIRED_TOKEN', ticket: null };
      return ok({ result: expired });
    }
    if (checked.kind === 'MALFORMED') {
      const invalid: CheckInResultView = { kind: 'INVALID', ticket: null };
      return ok({ result: invalid });
    }
    code = checked.code;
  }

  const client = admin();
  const { data, error } = await client.rpc('ticket_check_in', { p_code: code });
  if (error || !data) return fail('입장 확인 처리에 실패했습니다.', HTTP_STATUS.serverError);

  const outcome = data as { kind: CheckInKind; ticket?: CheckInTicketRow };
  if (!outcome.ticket) return ok({ result: { kind: outcome.kind, ticket: null } as CheckInResultView });

  const ticket = outcome.ticket;
  const concert = await client
    .from('ticket_concerts')
    .select('title')
    .eq('id', ticket.concert_id)
    .maybeSingle<{ title: string }>();

  const result: CheckInResultView = {
    kind: outcome.kind,
    ticket: {
      code: ticket.code,
      concertTitle: concert.data?.title ?? '-',
      sessionName: ticket.session_name ?? '-',
      poolType: ticket.pool_type,
      status: ticket.status,
      usedAt: ticket.used_at,
      memberNickname: ticket.member_nickname ?? '',
    },
  };

  return ok({ result });
}
