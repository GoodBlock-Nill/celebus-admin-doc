import { z } from 'zod';

import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_OPTIONS,
  adminKeyValid,
  adminSessionValue,
  isValidAdminName,
} from '@/lib/server/admin-auth';
import { HTTP_STATUS, fail, ok } from '@/lib/server/api';
import { getClientIp } from '@/lib/server/hash';
import { assertSameOrigin } from '@/lib/server/origin';
import { resetAttempts, tooManyAttempts } from '@/lib/server/ratelimit';

const schema = z.object({
  key: z.string().min(1),
  adminName: z.string().trim().min(2).max(10),
});

/**
 * 관리자 로그인 (설계서 §3.3) — 관리자 키 확인 후 12시간짜리 서명 쿠키를 발급한다.
 * 쿠키에는 처리자 이름이 함께 서명돼 담기며, 모든 관리자 처리 로그의 처리자 표기로 쓰인다.
 * 동일 출처 요청만 허용하고 IP 단위로 시도 횟수를 제한한다.
 */
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return fail('허용되지 않은 요청입니다.', HTTP_STATUS.forbidden);

  const throttleKey = `admin-login:${getClientIp(req)}`;
  if (tooManyAttempts(throttleKey)) {
    return fail('로그인 시도가 너무 잦습니다. 잠시 후 다시 시도해 주세요.', HTTP_STATUS.tooManyRequests);
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail('관리자 키와 처리자 이름을 입력해 주세요.', HTTP_STATUS.badRequest);

  const adminName = parsed.data.adminName.trim();
  if (!isValidAdminName(adminName)) {
    return fail('처리자 이름은 한글 2~10자로 입력해 주세요.', HTTP_STATUS.badRequest);
  }
  if (!adminKeyValid(parsed.data.key)) {
    return fail('관리자 키가 올바르지 않습니다.', HTTP_STATUS.unauthorized);
  }

  resetAttempts(throttleKey);

  const response = ok({ adminName });
  response.cookies.set(ADMIN_COOKIE, adminSessionValue(adminName), ADMIN_COOKIE_OPTIONS);
  return response;
}

/** 관리자 로그아웃 — 세션 쿠키 즉시 만료 */
export async function DELETE(req: Request) {
  if (!assertSameOrigin(req)) return fail('허용되지 않은 요청입니다.', HTTP_STATUS.forbidden);

  const response = ok({});
  response.cookies.set(ADMIN_COOKIE, '', { ...ADMIN_COOKIE_OPTIONS, maxAge: 0 });
  return response;
}
