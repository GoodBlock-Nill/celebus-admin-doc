// CELEBUS SSO 서버 유틸 — 본앱 세션 확인은 클라이언트(브라우저)가 본앱 API를 직접 호출한다
// (인증 쿠키가 api.client.celebus.xyz 호스트 전용 HttpOnly — 개발팀 확정 방식, 2026-07-24).
// 이 모듈은 uid→게임 신원 매핑과 로컬 개발 mock만 담당한다.
import { createHash } from "crypto";

// celebus uid → 결정론적 anon_id(hex) — 어느 기기로 접속해도 동일 게임 계정으로 귀결.
// 기존 anonId 검증 규격(^[a-f0-9]{16,64}$)과 호환.
export function celebusAnonId(uid: string): string {
  const salt = process.env.HASH_SALT ?? "dev-salt-change-me";
  return createHash("sha256").update(`${salt}:celebus-sso:${uid}`).digest("hex");
}

// 로컬 개발 mock — SSO_DEV_MOCK='{"data":{"userId":"...","username":"...","profileImageUrl":""}}'
export function mockIdentity(): Record<string, unknown> | null {
  try {
    const body = JSON.parse(process.env.SSO_DEV_MOCK ?? "") as Record<string, unknown>;
    const data = body.data && typeof body.data === "object" ? (body.data as Record<string, unknown>) : body;
    const uid = data.userId ?? data.id;
    if (!uid) return null;
    return { uid: String(uid), nickname: String(data.username ?? ""), avatar: String(data.profileImageUrl ?? "") };
  } catch {
    return null;
  }
}
