import { createHash } from 'crypto';

/** 예매 웹 전용 솔트 — 실명·결제 데이터를 다루므로 타 위성 앱과 분리한다(설계서 §3.1). */
export function ticketSalt(): string {
  return process.env.HASH_SALT ?? 'dev-salt-change-me';
}

/** 솔트 결합 SHA-256 — 원본 식별자를 저장하지 않기 위한 단방향 해시 */
export function hashWithSalt(input: string): string {
  return createHash('sha256').update(`${ticketSalt()}:${input}`).digest('hex');
}

/**
 * 신뢰 가능한 클라이언트 IP 추출.
 * Vercel은 x-vercel-forwarded-for(플랫폼이 세팅, 클라이언트 조작 불가) → x-real-ip 순으로 신뢰한다.
 * x-forwarded-for는 최좌측이 클라이언트 제어값이라 최후순위(로컬 개발 폴백).
 */
export function getClientIp(req: Request): string {
  const vercel = req.headers.get('x-vercel-forwarded-for');
  if (vercel) return vercel.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return '0.0.0.0';
}
