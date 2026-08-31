import 'server-only';

// 입장 QR 서명 단기 토큰 (설계서 §5).
// 티켓 화면은 열 때마다 서버에서 짧은 유효기간의 서명 토큰을 받아 QR로 그린다.
// 캡처 화면을 돌려써도 만료돼 입장할 수 없게 만드는 경량 방어책이다.
import { createHmac, timingSafeEqual } from 'crypto';

import { ticketSalt } from './hash';

/** 토큰 유효 시간 — 60초 */
export const QR_TOKEN_TTL_MS = 60 * 1000;

const TOKEN_PREFIX = 'TKT1';
const TOKEN_PARTS = 3;

export type QrTokenCheck =
  | { kind: 'VALID'; code: string }
  | { kind: 'EXPIRED' }
  | { kind: 'MALFORMED' };

function sign(payload: string): string {
  return createHmac('sha256', ticketSalt()).update(`ticket-qr:${payload}`).digest('hex');
}

export interface QrToken {
  token: string;
  /** 만료 시각(ISO) — 화면의 잔여 유효시간 표시에 사용 */
  expiresAt: string;
}

/** 입장 코드 + 만료 시각을 담은 서명 토큰 발급 */
export function issueQrToken(code: string, now: Date = new Date()): QrToken {
  const expiresAtMs = now.getTime() + QR_TOKEN_TTL_MS;
  const payload = `${code}.${expiresAtMs}`;
  return {
    token: `${TOKEN_PREFIX}.${Buffer.from(payload, 'utf8').toString('base64url')}.${sign(payload)}`,
    expiresAt: new Date(expiresAtMs).toISOString(),
  };
}

/** 입력값이 서명 토큰 형식인지 (아니면 8자리 원시 코드로 취급) */
export function looksLikeQrToken(input: string): boolean {
  return input.trim().startsWith(`${TOKEN_PREFIX}.`);
}

/** 토큰 검증 → 내부 입장 코드 추출. 위조·만료를 구분해 돌려준다. */
export function verifyQrToken(input: string, now: Date = new Date()): QrTokenCheck {
  const parts = input.trim().split('.');
  if (parts.length !== TOKEN_PARTS || parts[0] !== TOKEN_PREFIX) return { kind: 'MALFORMED' };

  const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
  const signature = parts[2];
  if (!/^[a-f0-9]{64}$/.test(signature)) return { kind: 'MALFORMED' };

  try {
    if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(sign(payload), 'hex'))) {
      return { kind: 'MALFORMED' };
    }
  } catch {
    return { kind: 'MALFORMED' };
  }

  const separator = payload.lastIndexOf('.');
  if (separator < 1) return { kind: 'MALFORMED' };

  const code = payload.slice(0, separator);
  const expiresAtMs = Number(payload.slice(separator + 1));
  if (!code || !Number.isFinite(expiresAtMs)) return { kind: 'MALFORMED' };
  if (expiresAtMs <= now.getTime()) return { kind: 'EXPIRED' };

  return { kind: 'VALID', code };
}
