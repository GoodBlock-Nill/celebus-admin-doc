import 'server-only';

// 본인확인 어댑터 경계 (설계서 §3.2).
// 대행사(NHN KCP 본인확인 V2 등)가 바뀌어도 /api/verify 이후의 중복 확인·저장 경로는 불변이다.
//
// 대행사 공통 플로우
//   ① prepare : 가맹점 서버가 요청 데이터를 암호화해 거래등록 → 인증창 호출 파라미터 확보
//   ② (브라우저) 인증창 호출 → 이용자 인증 → 지정 반환 주소로 콜백
//   ③ complete: 가맹점 서버가 결과 조회 API를 호출·복호화해 실명·생년월일·휴대폰·중복확인정보(DI) 확보
import { kcpProvider, kcpConfigured } from './kcp-provider';
import { mockProvider } from './mock-provider';

/** 인증 수단 — 화면의 간편인증 수단 선택과 동일한 목록 */
export const IDENTITY_PROVIDERS = ['PASS', '카카오', '토스', '네이버'] as const;

export type IdentityProviderName = (typeof IDENTITY_PROVIDERS)[number];

/** ① 거래등록 입력 — 이용자가 화면에 입력한 값과 인증 수단 */
export interface IdentityPrepareInput {
  provider: IdentityProviderName;
  realName: string;
  birth: string;
  phone: string;
  /** 인증 완료 후 대행사가 호출할 반환 주소 */
  returnUrl: string;
}

/** ① 결과 — 인증창을 띄우기 위해 브라우저에 전달할 파라미터 */
export interface IdentityWindowParams {
  /** 인증창 주소 (모의 구현은 자체 화면 경로) */
  windowUrl: string;
  /** 거래 식별자 — ③ 결과 조회의 조회 키 */
  transactionId: string;
  /** 인증창 호출 시 함께 넘길 값 (대행사 규격에 따라 달라진다) */
  fields: Record<string, string>;
}

/** ③ 결과 조회 입력 — 콜백으로 받은 값 */
export interface IdentityCompleteInput {
  transactionId: string;
  /** 대행사 콜백이 실어 보낸 원본 값 (모의 구현은 화면 입력값) */
  callback: Record<string, string>;
}

/** ③ 결과 — 예매 웹이 저장하는 본인확인 정보 */
export interface IdentityResult {
  realName: string;
  birth: string;
  phone: string;
  /** 중복 가입 차단용 식별값 — 저장 시 단방향 해시로 변환한다 */
  di: string;
  provider: string;
}

export interface IdentityProvider {
  /** 어댑터 표기 — 활동 로그·저장 값에 남는다 */
  readonly name: string;
  prepare(input: IdentityPrepareInput): Promise<IdentityWindowParams>;
  complete(input: IdentityCompleteInput): Promise<IdentityResult>;
}

/**
 * 사용할 본인확인 어댑터를 고른다.
 * 대행사 키가 설정된 환경에서는 실연동 어댑터를, 그렇지 않으면 모의 어댑터를 쓴다.
 */
export function identityProvider(): IdentityProvider {
  return kcpConfigured() ? kcpProvider() : mockProvider();
}
