import 'server-only';

// NHN KCP 본인확인 V2 어댑터 — 실키 투입 시 이 파일만 완성하면 되는 구조 (설계서 §3.2·§8.1).
// 규격 문서: developer.kcp.co.kr/guide/cert (본인확인 V2 — 거래등록 → 인증창 → 콜백 → 결과 조회)
//
// 필요한 환경 변수
//   KCP_SITE_CD   가맹점 사이트 코드 (KCP 가맹점 관리자에서 발급)
//   KCP_CERT_KEY  가맹점 암호화 키 (요청 암호화·결과 복호화에 사용)
//   KCP_API_BASE  거래등록·결과조회 주소 (테스트/상용 전환용, 미설정 시 테스트 주소)
//
// ⚠️ 아래 함수 본문의 "구현 지점" 주석 자리에 KCP 규격의 요청 조립·전송·복호화를 채운다.
//    키가 없는 환경에서는 kcpConfigured()가 거짓이 되어 모의 어댑터로 자동 폴백한다.
import type {
  IdentityCompleteInput,
  IdentityPrepareInput,
  IdentityProvider,
  IdentityResult,
  IdentityWindowParams,
} from './provider';

const PROVIDER_NAME = 'NHN KCP 본인확인';
const TEST_API_BASE = 'https://stg-spl.kcp.co.kr';

/** 거래등록 요청 경로 — 상세 경로는 KCP 규격서 기준으로 확정한다. */
const REGISTER_PATH = '/std/certpay';
/** 결과 조회 요청 경로 */
const RESULT_PATH = '/std/certpay';

interface KcpConfig {
  siteCd: string;
  certKey: string;
  apiBase: string;
}

/** 대행사 실연동 키가 모두 설정된 환경인지 */
export function kcpConfigured(): boolean {
  return Boolean(process.env.KCP_SITE_CD && process.env.KCP_CERT_KEY);
}

function config(): KcpConfig {
  const siteCd = process.env.KCP_SITE_CD;
  const certKey = process.env.KCP_CERT_KEY;
  if (!siteCd || !certKey) throw new Error('본인확인 대행사 연동 키가 없습니다 (KCP_SITE_CD / KCP_CERT_KEY).');
  return { siteCd, certKey, apiBase: process.env.KCP_API_BASE || TEST_API_BASE };
}

/**
 * 요청 데이터 암호화 (KCP `encryptJson` 대응).
 * 구현 지점: 가맹점 암호화 키 기반 AES 암호화 + 서명 규격을 KCP 규격서대로 적용한다.
 */
function encryptRequest(_payload: Record<string, string>, _certKey: string): string {
  throw new Error('KCP 요청 암호화가 아직 구현되지 않았습니다.');
}

/**
 * 응답 복호화 (KCP `decryptJson` 대응).
 * 구현 지점: 암호문을 복호해 이름·생년월일·휴대폰·CI/DI 필드를 꺼낸다.
 */
function decryptResponse(_cipher: string, _certKey: string): Record<string, string> {
  throw new Error('KCP 결과 복호화가 아직 구현되지 않았습니다.');
}

export function kcpProvider(): IdentityProvider {
  return {
    name: PROVIDER_NAME,

    /** ① 거래등록 — 암호화 요청 전송 후 인증창 호출에 필요한 등록 키를 받는다. */
    async prepare(input: IdentityPrepareInput): Promise<IdentityWindowParams> {
      const { siteCd, certKey, apiBase } = config();

      // 구현 지점: 아래 요청 본문 구성·전송을 KCP 규격서(거래등록)대로 채운다.
      const encrypted = encryptRequest(
        {
          site_cd: siteCd,
          ordr_idxx: input.returnUrl,
          user_name: input.realName,
          phone_no: input.phone,
          birth_day: input.birth,
        },
        certKey,
      );

      const response = await fetch(`${apiBase}${REGISTER_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_cd: siteCd, enc_data: encrypted }),
      });
      const body = (await response.json()) as { ordr_idxx?: string };

      return {
        windowUrl: `${apiBase}${REGISTER_PATH}`,
        transactionId: String(body.ordr_idxx ?? ''),
        fields: { site_cd: siteCd, enc_data: encrypted, provider: input.provider },
      };
    },

    /** ③ 결과 조회 — 콜백 값을 신뢰하지 않고 서버가 직접 조회·복호해 실값을 확보한다. */
    async complete(input: IdentityCompleteInput): Promise<IdentityResult> {
      const { siteCd, certKey, apiBase } = config();

      const response = await fetch(`${apiBase}${RESULT_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_cd: siteCd, ordr_idxx: input.transactionId }),
      });
      const body = (await response.json()) as { enc_cert_data?: string };

      const decrypted = decryptResponse(String(body.enc_cert_data ?? ''), certKey);

      return {
        realName: decrypted.user_name ?? '',
        birth: decrypted.birth_day ?? '',
        phone: decrypted.phone_no ?? '',
        di: decrypted.di ?? '',
        provider: PROVIDER_NAME,
      };
    },
  };
}
