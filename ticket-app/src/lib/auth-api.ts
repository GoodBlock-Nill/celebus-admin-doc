'use client';

// CELEBUS 계정 연계 클라이언트 — 본앱 로그인 상태를 확인해 예매 웹 세션을 발급받는다.
// 자체 회원가입·로그인은 없다. 세션 수명은 본앱이 관리한다.

export interface SessionProfile {
  signedUp: boolean;
  nickname: string;
  /** 네트워크·서버 실패로 판정 불가 (미로그인과 구분) */
  offline?: boolean;
  /** 본앱 로그인은 확인됐으나 예매 웹 세션 발급에 실패 (연동 문제) */
  bridge?: boolean;
}

/**
 * CELEBUS 본앱 회원 정보 조회 주소.
 * 인증 쿠키가 이 호스트 전용(HttpOnly)이라 "브라우저 → 본앱 API 직접 호출"만 세션 확인이 가능하다.
 */
const CELEBUS_ME_URL = 'https://api.client.celebus.xyz/v1/private/users/me';

const REQUEST_TIMEOUT_MS = 8000;
const UNAUTHORIZED = 401;

interface CelebusIdentity {
  uid: string;
  nickname: string;
}

function pickField(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function extractIdentity(body: unknown): CelebusIdentity | null {
  if (!body || typeof body !== 'object') return null;

  const root = body as Record<string, unknown>;
  if (root.success === false) return null;

  const data = root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : root;
  const uid = pickField(data, ['userId', 'id', 'uid', 'uuid', 'memberId']);
  if (!uid) return null;

  return { uid, nickname: pickField(data, ['username', 'nickname', 'nickName', 'name']) };
}

/** 본앱 세션 확인 — 미로그인이면 null, 판정 불가면 offline 플래그 */
async function fetchCelebusIdentity(): Promise<{ identity: CelebusIdentity | null; offline: boolean }> {
  // 개발 빌드는 본앱 직접 호출을 건너뛴다(다른 출처 세션이 없음 — 서버 개발 모의 신원이 대체)
  if (process.env.NODE_ENV !== 'production') return { identity: null, offline: false };

  try {
    const response = await fetch(CELEBUS_ME_URL, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.status === UNAUTHORIZED) return { identity: null, offline: false }; // 미로그인 확정
    if (!response.ok) return { identity: null, offline: true };

    const identity = extractIdentity(await response.json().catch(() => null));
    return { identity, offline: identity === null };
  } catch {
    return { identity: null, offline: true };
  }
}

/** 예매 웹 세션 발급 — ① 본앱 세션 확인 → ② 예매 웹 세션 쿠키 수신 */
export async function ssoLogin(): Promise<SessionProfile> {
  const { identity, offline } = await fetchCelebusIdentity();

  try {
    const response = await fetch('/api/auth/sso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(identity ?? {}),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.ok) {
      const body = (await response.json()) as { nickname?: string };
      return { signedUp: true, nickname: body.nickname ?? '' };
    }
    if (identity) return { signedUp: false, nickname: '', bridge: true };
    return { signedUp: false, nickname: '', offline };
  } catch {
    return { signedUp: false, nickname: '', offline: true, bridge: Boolean(identity) };
  }
}
