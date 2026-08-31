import { z } from 'zod';

import { HTTP_STATUS, fail, guardMutation, isResponse, ok, requireMember, type RpcResult } from '@/lib/server/api';
import { encryptText, makeDiHash } from '@/lib/server/crypto';
import { admin } from '@/lib/server/db-admin';

/** 인증 수단 표기 — 화면의 간편인증 수단 선택과 동일한 목록 */
const PROVIDERS = ['PASS', '카카오', '토스', '네이버'] as const;

const DUPLICATE_REASON = '중복';

const schema = z.object({
  realName: z.string().trim().min(2).max(20).regex(/^[가-힣a-zA-Z]+$/),
  birth: z.string().regex(/^\d{8}$/),
  phone: z.string().regex(/^01\d{8,9}$/),
  provider: z.enum(PROVIDERS),
});

/**
 * 본인확인 결과 저장.
 * W1은 모의 간편인증 단계라 실명·생년월일·휴대폰번호 조합의 결정적 해시를 중복 확인값으로 쓴다.
 * 동일 명의가 이미 다른 계정에 등록돼 있으면 409로 차단한다(1인 1계정 원칙).
 */
export async function POST(req: Request) {
  const blocked = guardMutation(req, 'verify');
  if (blocked) return blocked;

  const member = await requireMember(req);
  if (isResponse(member)) return member;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail('본인확인 정보를 다시 확인해 주세요.', HTTP_STATUS.badRequest);

  const { realName, birth, phone, provider } = parsed.data;
  const { data, error } = await admin().rpc('ticket_verify_identity', {
    p_member_id: member.id,
    p_real_name: realName,
    p_birth: birth,
    p_phone: encryptText(phone),
    p_di_hash: makeDiHash(realName, birth, phone),
    p_provider: provider,
  });

  const result = data as RpcResult | null;
  if (error || !result) return fail('본인확인 처리에 실패했습니다.', HTTP_STATUS.serverError);
  if (!result.ok) {
    const isDuplicate = result.reason === DUPLICATE_REASON;
    return fail(
      isDuplicate ? '동일한 명의로 이미 본인확인을 마친 계정이 있습니다.' : String(result.reason ?? '본인확인에 실패했습니다.'),
      isDuplicate ? HTTP_STATUS.conflict : HTTP_STATUS.badRequest,
    );
  }

  return ok({});
}
