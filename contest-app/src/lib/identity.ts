// 신원 레이어 (W4 확정판) — 스테이지 기능은 전부 이 모듈만 의존한다.
// 정책: 익명 이용 불가 — 신원 쿠키는 /api/auth/sso(CELEBUS 로그인)만 발급한다.
//   이 모듈은 검증·조회 전용이며, 쿠키가 없거나 위조면 null을 반환한다(자동 발급 없음).
import { peekVoterId } from "./anon-identity";

// 운영에서 서명 키 미설정 시 즉시 실패 — 개발용 폴백 키로 쿠키가 서명되는 사고 방지 (감사 백로그 #6)
if (process.env.NODE_ENV === "production" && !process.env.HASH_SALT) {
  throw new Error("HASH_SALT 환경변수가 설정되지 않았습니다 — 신원 서명 키 없이 기동할 수 없습니다.");
}

// 요청에서 검증된 사용자 식별자 추출 — 없으면 null (라우트는 401 처리)
export function requireUserId(req: Request): string | null {
  return peekVoterId(req);
}

// 상태 조회 전용 별칭 (의미 구분용)
export const peekUserId = requireUserId;
