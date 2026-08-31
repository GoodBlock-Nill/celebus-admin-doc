import { isGuardFailure, requireAdmin } from '@/lib/server/admin-api';
import { ok, readFailure } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import type { AdminLogView } from '@/lib/admin-types';

/** 활동 로그 조회 상한 */
const LOG_LIMIT = 300;
const MAX_ACTION_LENGTH = 40;

interface LogRow {
  id: string;
  actor: string;
  action: string;
  detail: string;
  created_at: string;
}

/** 활동 로그 — 최신순 최대 300건. 액션 유형으로 걸러 볼 수 있다. */
export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const action = (new URL(req.url).searchParams.get('action') ?? '').trim().slice(0, MAX_ACTION_LENGTH);

  let query = admin()
    .from('ticket_admin_logs')
    .select('id, actor, action, detail, created_at')
    .order('created_at', { ascending: false })
    .limit(LOG_LIMIT);

  if (action) query = query.eq('action', action);

  const { data, error } = await query.returns<LogRow[]>();
  if (error) return readFailure();

  const items: AdminLogView[] = (data ?? []).map((row) => ({
    id: row.id,
    actor: row.actor,
    action: row.action,
    detail: row.detail,
    createdAt: row.created_at,
  }));

  return ok({ items });
}
