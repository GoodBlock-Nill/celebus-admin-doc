// 신원 추상화 레이어 — 스테이지 기능(업로드·하트·댓글·월드컵)은 전부 이 모듈만 의존한다.
// 개발 기간(W1~W3): 익명 HMAC 쿠키 id. W4: 이 모듈 내부만 CELEBUS SSO 계정 id로 교체(+데이터 전체 초기화).
// ⚠️ 스테이지 기능 코드에서 anon-identity를 직접 import 하지 말 것 — 전환점을 이 파일 하나로 유지.
import { peekVoterId, readVoterId, signAnonId, VID_COOKIE, VID_COOKIE_OPTS } from "./anon-identity";

// 운영에서 서명 키 미설정 시 즉시 실패 — 개발용 폴백 키로 쿠키가 서명되는 사고 방지 (감사 백로그 #6)
if (process.env.NODE_ENV === "production" && !process.env.HASH_SALT) {
  throw new Error("HASH_SALT 환경변수가 설정되지 않았습니다 — 신원 서명 키 없이 기동할 수 없습니다.");
}

export type UserIdentity = { id: string; isNew: boolean };

// 요청에서 사용자 식별자 추출(없으면 신규 후보 발급). isNew=true면 응답에 setIdentityCookie 필요.
export function getUserId(req: Request): UserIdentity {
  return readVoterId(req);
}

// 상태 조회 전용 — 신규 발급 없이 기존 신원만 (없으면 null)
export function peekUserId(req: Request): string | null {
  return peekVoterId(req);
}

// 신규 발급 신원을 응답 쿠키로 확정
export function setIdentityCookie(headers: Headers, id: string): void {
  const v = encodeURIComponent(signAnonId(id));
  const o = VID_COOKIE_OPTS;
  headers.append(
    "Set-Cookie",
    `${VID_COOKIE}=${v}; Path=${o.path}; Max-Age=${o.maxAge}; SameSite=${o.sameSite}${o.httpOnly ? "; HttpOnly" : ""}${o.secure ? "; Secure" : ""}`,
  );
}
