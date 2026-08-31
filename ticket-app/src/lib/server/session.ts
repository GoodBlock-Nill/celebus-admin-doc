import 'server-only';

// 서버 서명 회원 식별 쿠키 — 예매 웹의 로그인 세션.
// 쿠키값 = "<회원 해시>.<서명>". 회원 해시는 서버가 산출하고 HASH_SALT HMAC으로 서명해 위조를 막는다.
// ⚠️ 클라이언트가 본문으로 보낸 회원 식별자는 절대 신뢰하지 않는다 — 신원은 오직 이 쿠키에서만 읽는다.
import { createHmac, timingSafeEqual } from 'crypto';

import { admin } from './db-admin';
import { ticketSalt } from './hash';

export const SESSION_COOKIE = 'tkt_vid';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: ONE_YEAR_SECONDS,
};

export interface MemberRow {
  id: string;
  celebus_uid: string;
  member_hash: string;
  nickname: string;
}

function sign(value: string): string {
  return createHmac('sha256', ticketSalt()).update(value).digest('hex');
}

/** 쿠키에 담을 서명 문자열 생성 */
export function signMemberHash(memberHash: string): string {
  return `${memberHash}.${sign(memberHash)}`;
}

/** 쿠키값 서명 검증 → 유효 회원 해시 또는 null */
function verify(value: string): string | null {
  const separator = value.lastIndexOf('.');
  if (separator < 1) return null;

  const memberHash = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  if (!/^[a-f0-9]{64}$/.test(memberHash) || !/^[a-f0-9]{64}$/.test(signature)) return null;

  try {
    if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(sign(memberHash), 'hex'))) return null;
  } catch {
    return null;
  }
  return memberHash;
}

/** 요청 쿠키에서 서명 검증된 회원 해시만 추출 (없거나 위조면 null) */
export function readMemberHash(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const matched = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return matched ? verify(decodeURIComponent(matched[1])) : null;
}

/** 쿠키 신원으로 회원 행을 조회한다 — 모든 회원 API의 단일 신원 진입점 */
export async function readMember(req: Request): Promise<MemberRow | null> {
  const memberHash = readMemberHash(req);
  if (!memberHash) return null;

  const { data, error } = await admin()
    .from('ticket_members')
    .select('id, celebus_uid, member_hash, nickname')
    .eq('member_hash', memberHash)
    .maybeSingle<MemberRow>();

  if (error || !data) return null;
  return data;
}
