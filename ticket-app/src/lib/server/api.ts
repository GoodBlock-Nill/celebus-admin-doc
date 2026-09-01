import 'server-only';

import { NextResponse } from 'next/server';

import { getClientIp } from './hash';
import { assertSameOrigin } from './origin';
import { mutationThrottled } from './ratelimit';
import { readMember, type MemberRow } from './session';

/** RPC 공통 반환 규약 — { ok:true, … } / { ok:false, reason:'한국어 문구' } */
export interface RpcResult {
  ok?: boolean;
  reason?: string;
  [key: string]: unknown;
}

export const HTTP_STATUS = {
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  conflict: 409,
  tooManyRequests: 429,
  serverError: 500,
  /** 외부 연동 키가 설정되지 않아 기능을 제공할 수 없는 상태 */
  serviceUnavailable: 503,
} as const;

/** 실패 응답 — 화면에 그대로 노출할 한국어 사유만 담는다(내부 정보 비노출). */
export function fail(reason: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, reason }, { status });
}

/** 성공 응답 */
export function ok<T extends Record<string, unknown>>(data: T): NextResponse {
  return NextResponse.json({ ok: true, ...data });
}

/**
 * 변이 요청 공통 가드 — 동일 출처 검증 + IP 스로틀.
 * 통과하면 null, 막히면 즉시 반환할 응답을 돌려준다.
 */
export function guardMutation(req: Request, scope: string): NextResponse | null {
  if (!assertSameOrigin(req)) return fail('허용되지 않은 요청입니다.', HTTP_STATUS.forbidden);
  if (mutationThrottled(`${scope}:${getClientIp(req)}`)) {
    return fail('요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.', HTTP_STATUS.tooManyRequests);
  }
  return null;
}

/** 쿠키 신원으로 회원을 확인한다 — 미로그인이면 401 응답 */
export async function requireMember(req: Request): Promise<MemberRow | NextResponse> {
  const member = await readMember(req);
  if (!member) return fail('로그인이 필요합니다.', HTTP_STATUS.unauthorized);
  return member;
}

/** requireMember 결과가 회원인지 응답인지 구분 */
export function isResponse(value: MemberRow | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

/**
 * 서버 함수의 실패 사유는 운영 로그와 같은 문장을 쓰기 때문에 "주문" 표현이 섞여 있다.
 * 회원 화면에는 예매 용어만 노출해야 하므로 전달 직전에 회원 문구로 바꾼다.
 */
const MEMBER_REASON_TEXT: Record<string, string> = {
  '주문을 찾을 수 없습니다.': '예매 내역을 찾을 수 없습니다.',
};

export function toMemberReason(reason: string): string {
  return MEMBER_REASON_TEXT[reason] ?? reason.replaceAll('주문', '예매');
}

/** 조회 실패를 공통 문구로 변환 */
export function readFailure(): NextResponse {
  return fail('정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', HTTP_STATUS.serverError);
}
