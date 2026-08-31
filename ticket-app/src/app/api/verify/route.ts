import { z } from 'zod';

import { HTTP_STATUS, fail, guardMutation, isResponse, ok, requireMember, type RpcResult } from '@/lib/server/api';
import { diHashFromProvider, encryptText } from '@/lib/server/crypto';
import { admin } from '@/lib/server/db-admin';
import { IDENTITY_PROVIDERS, identityProvider } from '@/lib/server/identity/provider';

const DUPLICATE_REASON = '중복';

const schema = z.object({
  realName: z.string().trim().min(2).max(20).regex(/^[가-힣a-zA-Z]+$/),
  birth: z.string().regex(/^\d{8}$/),
  phone: z.string().regex(/^01\d{8,9}$/),
  provider: z.enum(IDENTITY_PROVIDERS),
});

/**
 * 본인확인 결과 저장.
 *
 * 본인확인 어댑터(설계서 §3.2)를 거쳐 실명·생년월일·휴대폰·중복 확인값(DI)을 확보한 뒤 저장한다.
 * 모의 어댑터는 화면 입력값으로 결정적 중복 확인값을 만들고, 대행사 실연동 어댑터는 서버 결과 조회로 실값을 받는다.
 * 대행사 실연동 시에는 이 라우트를 거래등록 요청과 콜백 수신 두 단계로 나누며,
 * "결과 → 중복 확인 → 저장" 이후 경로는 아래 코드 그대로 유지된다.
 *
 * 동일 명의가 이미 다른 계정에 등록돼 있으면 409로 차단한다(1인 1계정 원칙).
 */
export async function POST(req: Request) {
  const blocked = guardMutation(req, 'verify');
  if (blocked) return blocked;

  const member = await requireMember(req);
  if (isResponse(member)) return member;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail('본인확인 정보를 다시 확인해 주세요.', HTTP_STATUS.badRequest);

  const provider = identityProvider();
  const identity = await provider.complete({
    transactionId: member.id,
    callback: parsed.data,
  }).catch(() => null);

  if (!identity || !identity.realName || !identity.di) {
    return fail('본인확인 기관 응답을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.', HTTP_STATUS.serverError);
  }

  const { data, error } = await admin().rpc('ticket_verify_identity', {
    p_member_id: member.id,
    p_real_name: identity.realName,
    p_birth: identity.birth,
    p_phone: encryptText(identity.phone),
    p_di_hash: diHashFromProvider(identity.di),
    p_provider: identity.provider || provider.name,
  });

  const result = data as RpcResult | null;
  if (error || !result) return fail('본인확인 처리에 실패했습니다.', HTTP_STATUS.serverError);
  if (!result.ok) {
    const isDuplicate = result.reason === DUPLICATE_REASON;
    return fail(
      isDuplicate
        ? '동일한 명의로 이미 본인확인을 마친 계정이 있습니다.'
        : String(result.reason ?? '본인확인에 실패했습니다.'),
      isDuplicate ? HTTP_STATUS.conflict : HTTP_STATUS.badRequest,
    );
  }

  return ok({});
}
