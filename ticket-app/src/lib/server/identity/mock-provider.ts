import 'server-only';

// 모의 본인확인 어댑터 — 대행사 계약 전까지의 기본값.
// 실명·생년월일·휴대폰번호 조합으로 결정적(같은 입력 = 같은 값) 중복 확인값을 만들어
// 대행사 실연동과 동일한 "결과 → 중복 확인 → 저장" 경로를 그대로 검증할 수 있게 한다.
import { makeDiHash } from '../crypto';
import type {
  IdentityCompleteInput,
  IdentityPrepareInput,
  IdentityProvider,
  IdentityResult,
  IdentityWindowParams,
} from './provider';

const MOCK_NAME = '모의 간편인증';
const MOCK_WINDOW_PATH = '/app/verify';

function transactionId(input: IdentityPrepareInput): string {
  return makeDiHash(input.realName, input.birth, input.phone).slice(0, 24);
}

export function mockProvider(): IdentityProvider {
  return {
    name: MOCK_NAME,

    async prepare(input: IdentityPrepareInput): Promise<IdentityWindowParams> {
      // 모의 구현은 외부 인증창 대신 앱 내 인증 화면을 그대로 사용한다.
      return {
        windowUrl: MOCK_WINDOW_PATH,
        transactionId: transactionId(input),
        fields: { provider: input.provider, returnUrl: input.returnUrl },
      };
    },

    async complete(input: IdentityCompleteInput): Promise<IdentityResult> {
      const { realName = '', birth = '', phone = '', provider = '' } = input.callback;
      return {
        realName,
        birth,
        phone,
        // 대행사가 발급하는 중복 확인값(DI)을 대신하는 결정적 값
        di: makeDiHash(realName, birth, phone),
        provider,
      };
    },
  };
}
