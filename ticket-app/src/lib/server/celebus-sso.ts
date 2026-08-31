// CELEBUS 계정 연계 서버 유틸 — 본앱 세션 확인은 클라이언트(브라우저)가 본앱 API를 직접 호출한다.
// (인증 쿠키가 api.client.celebus.xyz 호스트 전용 HttpOnly — 본앱 개발팀 확정 방식, 2026-07-24)
// 이 모듈은 본앱 회원 식별자 → 예매 웹 회원 해시 매핑과 로컬 개발 mock만 담당한다.
import { hashWithSalt } from './hash';

/** 로컬 개발 mock 기본 신원 — SSO_DEV_MOCK이 JSON이 아닐 때 사용 */
const DEV_MOCK_UID = 'dev-ticket-user-1';
const DEV_MOCK_NICKNAME = '개발 테스트 계정';

export interface CelebusIdentity {
  uid: string;
  nickname: string;
}

/**
 * 본앱 회원 식별자 → 예매 웹 회원 해시(결정론).
 * 어느 기기로 접속해도 동일 예매 계정으로 귀결되며, 쿠키 신원값으로도 사용한다.
 */
export function ticketMemberHash(uid: string): string {
  return hashWithSalt(`ticket-sso:${uid}`);
}

/**
 * 로컬 개발 mock — 비프로덕션에서만 호출된다.
 * SSO_DEV_MOCK='{"data":{"userId":"...","username":"..."}}' 형식이면 그 값을,
 * 단순 플래그(예: 1)면 기본 개발 계정을 반환한다.
 */
export function mockIdentity(): CelebusIdentity | null {
  const raw = process.env.SSO_DEV_MOCK;
  if (!raw) return null;

  try {
    const body = JSON.parse(raw) as Record<string, unknown>;
    const data = body.data && typeof body.data === 'object' ? (body.data as Record<string, unknown>) : body;
    const uid = data.userId ?? data.id;
    if (!uid) return { uid: DEV_MOCK_UID, nickname: DEV_MOCK_NICKNAME };
    return { uid: String(uid), nickname: String(data.username ?? data.nickname ?? DEV_MOCK_NICKNAME) };
  } catch {
    return { uid: DEV_MOCK_UID, nickname: DEV_MOCK_NICKNAME };
  }
}
