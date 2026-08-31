import { z } from 'zod';

import { callAdminRpc, isGuardFailure, requireAdmin } from '@/lib/server/admin-api';
import { HTTP_STATUS, fail, guardMutation, ok, readFailure } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import type { AdminReportView, ReportStatus } from '@/lib/admin-types';

const MAX_REASON_LENGTH = 50;
const MAX_DETAIL_LENGTH = 500;
const MAX_URL_LENGTH = 500;

const EXTERNAL_SOURCE = '외부 통보';

const schema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('submit'),
    targetType: z.enum(['게시물', '계정', '외부 링크']),
    reason: z.string().trim().min(1).max(MAX_REASON_LENGTH),
    detail: z.string().trim().max(MAX_DETAIL_LENGTH),
    evidenceUrl: z.union([z.literal(''), z.string().url().max(MAX_URL_LENGTH)]).optional(),
  }),
  z.object({
    action: z.literal('act'),
    reportId: z.string().uuid(),
    actionType: z.enum(['노출 차단', '수사기관 제출', '계정 제재', '티켓 무효화', '종결']),
  }),
]);

interface ReportRow {
  id: string;
  target_type: string;
  reason: string;
  detail: string;
  evidence_url: string | null;
  source: string;
  created_at: string;
  deadline_at: string;
  status: ReportStatus;
}

interface ReportActionRow {
  report_id: string;
  action_type: string;
  acted_at: string;
  admin_name: string;
}

/** 신고 목록 — 처리 기한이 급한 순서 */
export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const client = admin();
  const reports = await client
    .from('ticket_reports')
    .select('id, target_type, reason, detail, evidence_url, source, created_at, deadline_at, status')
    .order('deadline_at', { ascending: true })
    .returns<ReportRow[]>();

  if (reports.error) return readFailure();
  const rows = reports.data ?? [];

  const actions =
    rows.length === 0
      ? { data: [] as ReportActionRow[] }
      : await client
          .from('ticket_report_actions')
          .select('report_id, action_type, acted_at, admin_name')
          .in(
            'report_id',
            rows.map((row) => row.id),
          )
          .order('acted_at', { ascending: true })
          .returns<ReportActionRow[]>();

  const items: AdminReportView[] = rows.map((row) => ({
    id: row.id,
    targetType: row.target_type,
    reason: row.reason,
    detail: row.detail,
    evidenceUrl: row.evidence_url,
    source: row.source,
    createdAt: row.created_at,
    deadlineAt: row.deadline_at,
    status: row.status,
    actions: (actions.data ?? [])
      .filter((action) => action.report_id === row.id)
      .map((action) => ({
        actionType: action.action_type,
        actedAt: action.acted_at,
        adminName: action.admin_name,
      })),
  }));

  return ok({ items });
}

/** 외부 통보 수기 접수 · 신고 조치 처리 */
export async function POST(req: Request) {
  const blocked = guardMutation(req, 'admin-report');
  if (blocked) return blocked;

  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail('요청 값을 다시 확인해 주세요.', HTTP_STATUS.badRequest);

  if (parsed.data.action === 'submit') {
    return callAdminRpc(
      'ticket_submit_report',
      {
        p_target_type: parsed.data.targetType,
        p_reason: parsed.data.reason,
        p_detail: parsed.data.detail,
        p_evidence_url: parsed.data.evidenceUrl ?? '',
        p_source: EXTERNAL_SOURCE,
        p_member_id: null,
      },
      '신고 접수에 실패했습니다.',
    );
  }

  return callAdminRpc(
    'ticket_act_on_report',
    { p_report_id: parsed.data.reportId, p_action: parsed.data.actionType, p_admin: guard },
    '신고 조치 처리에 실패했습니다.',
  );
}
