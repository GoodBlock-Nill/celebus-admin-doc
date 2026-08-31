import { z } from 'zod';

import { HTTP_STATUS, fail, ok } from '@/lib/server/api';
import { mockIdentity, ticketMemberHash } from '@/lib/server/celebus-sso';
import { admin } from '@/lib/server/db-admin';
import { getClientIp } from '@/lib/server/hash';
import { assertSameOrigin } from '@/lib/server/origin';
import { resetAttempts, tooManyAttempts } from '@/lib/server/ratelimit';
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, signMemberHash } from '@/lib/server/session';

// 예매 웹 세션 발급 — 본앱 로그인 확인은 "브라우저 → 본앱 API 직접 호출"(본앱 개발팀 확정 방식).
// 본앱 인증 쿠키가 api 호스트 전용이라 이 서버에서는 재검증이 불가하며, 클라이언트가 확인한
// 신원(회원 식별자·닉네임)을 형식 검증 후 수용한다.
// ⚠️ 설계서 §3.1 — 서버 재검증 부재를 보완하기 위해 예매 웹의 실질 신원 기준은 본인확인(실명)이며,
//    주문·티켓·입금 대조가 전부 실명에 묶여 있어 계정 위조만으로는 티켓 수령·입장이 불가능하다.
const schema = z.object({
  uid: z.string().min(1).max(64).regex(/^[\w.:@-]+$/),
  nickname: z.string().max(60).optional().default(''),
});

interface MemberRecord {
  nickname: string;
}

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return fail('허용되지 않은 요청입니다.', HTTP_STATUS.forbidden);

  const throttleKey = `sso:${getClientIp(req)}`;
  if (tooManyAttempts(throttleKey)) {
    return fail('요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.', HTTP_STATUS.tooManyRequests);
  }

  let body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  // 로컬 개발 전용 mock — 운영 빌드에서는 완전 비활성
  if (process.env.NODE_ENV !== 'production' && process.env.SSO_DEV_MOCK && !body?.uid) {
    body = mockIdentity() as unknown as Record<string, unknown> | null;
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail('CELEBUS 로그인 정보가 확인되지 않았습니다.', HTTP_STATUS.unauthorized);

  const memberHash = ticketMemberHash(parsed.data.uid);
  const { data, error } = await admin().rpc('ticket_sso_login', {
    p_celebus_uid: parsed.data.uid,
    p_member_hash: memberHash,
    p_nickname: parsed.data.nickname,
  });

  const member = data as MemberRecord | null;
  if (error || !member) return fail('로그인 처리에 실패했습니다.', HTTP_STATUS.serverError);

  resetAttempts(throttleKey); // 성공 시 리셋 — 공유 IP(캐리어 NAT) 다수 사용자 보호
  const response = ok({ nickname: member.nickname ?? '' });
  response.cookies.set(SESSION_COOKIE, signMemberHash(memberHash), SESSION_COOKIE_OPTIONS);
  return response;
}
