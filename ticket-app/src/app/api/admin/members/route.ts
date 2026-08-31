import { isGuardFailure, requireAdmin } from '@/lib/server/admin-api';
import { ok, readFailure } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import type { AdminMemberOptionView } from '@/lib/admin-types';
import { maskName } from '@/lib/format';

/** 검색 결과 상한 — 무상 발급 대상 선택용이라 넓게 나열하지 않는다. */
const RESULT_LIMIT = 20;
/** 검색어 대조 대상 후보 상한 */
const CANDIDATE_LIMIT = 200;
const MAX_QUERY_LENGTH = 20;

interface VerifiedMemberRow {
  member_id: string;
  real_name: string;
  verified_at: string;
}

interface MemberRow {
  id: string;
  nickname: string;
}

/**
 * 무상 발급 대상 회원 검색 — 본인확인을 마친 회원만 후보다.
 * 실명은 마스킹해 내려주고, 검색은 실명·닉네임 부분 일치로 처리한다.
 */
export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const keyword = (new URL(req.url).searchParams.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH);
  const client = admin();

  const verified = await client
    .from('ticket_identity_verifications')
    .select('member_id, real_name, verified_at')
    .order('verified_at', { ascending: false })
    .limit(keyword ? CANDIDATE_LIMIT : RESULT_LIMIT)
    .returns<VerifiedMemberRow[]>();

  if (verified.error) return readFailure();

  const rows = verified.data ?? [];
  if (rows.length === 0) return ok({ items: [] });

  const members = await client
    .from('ticket_members')
    .select('id, nickname')
    .in(
      'id',
      rows.map((row) => row.member_id),
    )
    .returns<MemberRow[]>();

  if (members.error) return readFailure();
  const nicknames = new Map((members.data ?? []).map((row) => [row.id, row.nickname]));

  const items: AdminMemberOptionView[] = rows
    .filter((row) => {
      if (!keyword) return true;
      const nickname = nicknames.get(row.member_id) ?? '';
      return row.real_name.includes(keyword) || nickname.includes(keyword);
    })
    .slice(0, RESULT_LIMIT)
    .map((row) => ({
      id: row.member_id,
      nickname: nicknames.get(row.member_id) ?? '',
      realNameMasked: maskName(row.real_name),
    }));

  return ok({ items });
}
