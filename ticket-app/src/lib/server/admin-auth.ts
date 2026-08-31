import 'server-only';

// 관리자 세션 (설계서 §3.3) — ADMIN_KEY 단일 비밀키 검증 후 HMAC 서명 쿠키를 12시간 발급한다.
// 사내 선례(game-app admin-auth.ts)를 이식하되, 예매 웹은 환불·티켓 지급이 걸려 있어
// 쿠키에 "처리자 이름"까지 서명해 담는다. 모든 관리자 처리는 이 이름으로 활동 로그에 남는다.
// ⚠️ ADMIN_KEY가 없는 환경은 로그인·검증 모두 실패시킨다(fail-closed).
import { createHmac, timingSafeEqual } from 'crypto';

import { ticketSalt } from './hash';

export const ADMIN_COOKIE = 'tkt_adm';

const TWELVE_HOURS_SECONDS = 60 * 60 * 12;

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: TWELVE_HOURS_SECONDS,
};

/** 처리자 이름 — 한국어 2~10자 (활동 로그 추적용 실명 표기) */
const ADMIN_NAME_PATTERN = /^[가-힣]{2,10}$/;

export function isValidAdminName(name: string): boolean {
  return ADMIN_NAME_PATTERN.test(name.trim());
}

/** 쿠키 서명 — 솔트와 관리자 키를 함께 섞어 키가 바뀌면 기존 세션이 모두 무효가 된다. */
function sign(payload: string): string {
  const key = process.env.ADMIN_KEY ?? '';
  return createHmac('sha256', `${ticketSalt()}:${key}`).update(`ticket-admin:${payload}`).digest('hex');
}

/** 입력 키와 설정 키의 타이밍 세이프 비교 */
export function adminKeyValid(input: string): boolean {
  const key = process.env.ADMIN_KEY ?? '';
  if (!key || !input) return false;

  const given = Buffer.from(input);
  const expected = Buffer.from(key);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** 쿠키에 담을 값 — "<처리자 이름(base64url)>.<서명>" */
export function adminSessionValue(adminName: string): string {
  const payload = Buffer.from(adminName.trim(), 'utf8').toString('base64url');
  return `${payload}.${sign(payload)}`;
}

/** 쿠키값 검증 → 서명이 확인된 처리자 이름 또는 null */
export function verifyAdminCookie(value: string | undefined | null): string | null {
  if (!process.env.ADMIN_KEY || !value) return null;

  const separator = value.lastIndexOf('.');
  if (separator < 1) return null;

  const payload = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  if (!/^[a-f0-9]{64}$/.test(signature)) return null;

  try {
    if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(sign(payload), 'hex'))) return null;
  } catch {
    return null;
  }

  const adminName = Buffer.from(payload, 'base64url').toString('utf8');
  return isValidAdminName(adminName) ? adminName : null;
}

/** 요청 쿠키에서 서명 검증된 처리자 이름만 추출 (없거나 위조면 null) */
export function readAdminName(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const matched = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  return matched ? verifyAdminCookie(decodeURIComponent(matched[1])) : null;
}
