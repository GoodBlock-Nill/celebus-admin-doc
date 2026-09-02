import { z } from 'zod';

import {
  HTTP_STATUS,
  fail,
  guardMutation,
  isResponse,
  ok,
  requireMember,
  type RpcResult,
} from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';

const MAX_DETAIL_LENGTH = 1000;
const MAX_URL_LENGTH = 500;

const APP_REPORT_SOURCE = '앱 신고';

const schema = z.object({
  targetType: z.enum(['게시물', '계정', '외부 링크']),
  reason: z.string().trim().min(1).max(50),
  // 상세 내용은 선택 — 대상·사유 두 선택만으로 접수할 수 있게 한다.
  detail: z.string().trim().max(MAX_DETAIL_LENGTH),
  evidenceUrl: z.union([z.literal(''), z.string().url().max(MAX_URL_LENGTH)]).optional(),
});

/** 부정 거래 신고 접수 — 접수 시각 기준 10시간 처리 기한이 서버에서 부여된다. */
export async function POST(req: Request) {
  const blocked = guardMutation(req, 'report');
  if (blocked) return blocked;

  const member = await requireMember(req);
  if (isResponse(member)) return member;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail('신고 내용을 다시 확인해 주세요.', HTTP_STATUS.badRequest);

  const { data, error } = await admin().rpc('ticket_submit_report', {
    p_target_type: parsed.data.targetType,
    p_reason: parsed.data.reason,
    p_detail: parsed.data.detail,
    p_evidence_url: parsed.data.evidenceUrl ?? '',
    p_source: APP_REPORT_SOURCE,
    p_member_id: member.id,
  });

  const result = data as RpcResult | null;
  if (error || !result) return fail('신고 접수에 실패했습니다.', HTTP_STATUS.serverError);
  if (!result.ok) return fail(String(result.reason ?? '신고 접수에 실패했습니다.'), HTTP_STATUS.badRequest);

  return ok({ reportId: String(result.report_id) });
}
