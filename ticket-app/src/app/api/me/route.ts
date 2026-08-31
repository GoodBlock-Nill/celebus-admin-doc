import { isResponse, ok, requireMember } from '@/lib/server/api';
import { decryptText } from '@/lib/server/crypto';
import { admin } from '@/lib/server/db-admin';
import type { VerificationRow } from '@/lib/server/rows';
import type { MeView } from '@/lib/api-types';
import { maskName, maskPhone } from '@/lib/format';

const VERIFICATION_COLUMNS = 'real_name, birth, phone_enc, provider, verified_at';

/**
 * 로그인 회원 + 본인확인 상태.
 * 설계서 §3.1 완화 구조 — 실명·휴대폰번호는 마스킹만 노출한다.
 */
export async function GET(req: Request) {
  const member = await requireMember(req);
  if (isResponse(member)) return member;

  const { data } = await admin()
    .from('ticket_identity_verifications')
    .select(VERIFICATION_COLUMNS)
    .eq('member_id', member.id)
    .maybeSingle<VerificationRow>();

  const phone = decryptText(data?.phone_enc);
  const view: MeView = {
    nickname: member.nickname,
    verified: Boolean(data),
    verification: data
      ? {
          realNameMasked: maskName(data.real_name),
          phoneMasked: phone ? maskPhone(phone) : '',
          provider: data.provider ?? '',
          verifiedAt: data.verified_at,
        }
      : null,
  };

  return ok({ me: view });
}
