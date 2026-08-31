'use client';

// CELEBUS 미로그인 게이트 — 본앱 세션이 없으면 예매를 이용할 수 없다.
// 본앱에서 로그인한 뒤 [다시 확인]으로 재시도한다(예매 웹 자체 회원가입 없음).
import { GHOST_BUTTON, MUTED, PRIMARY_BUTTON } from './ui';
import { ShieldIcon } from './icons';
import { Wordmark } from './wordmark';

/** CELEBUS 본앱 주소 — 로그인하러 이동할 대상 */
const PARENT_APP_URL = 'https://app.celebus.xyz';

export type GateReason = 'NO_SESSION' | 'BRIDGE_FAIL' | 'OFFLINE';

const REASON_MESSAGE: Record<GateReason, string> = {
  NO_SESSION: 'CELEBUS 앱에서 로그인한 뒤 다시 확인해 주세요.',
  BRIDGE_FAIL: '로그인은 확인됐지만 예매 세션 발급에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  OFFLINE: '네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
};

interface SsoGateProps {
  reason: GateReason;
  busy: boolean;
  onRetry: () => void;
}

/** 로그인 안내 화면 */
export function SsoGate({ reason, busy, onRetry }: SsoGateProps) {
  return (
    <main>
      <div className="flex h-14 items-center border-b border-[#E5E8EB] bg-white px-4">
        <Wordmark />
      </div>

      <div className="flex flex-col items-center gap-4 px-5 py-14 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FDF2F7] text-[#D6336C]">
          <ShieldIcon className="h-8 w-8" />
        </span>

        <h1 className="text-[18px] font-bold text-[#191F28]">CELEBUS 계정으로 로그인해 주세요</h1>

        <p className={`max-w-[300px] text-[14px] leading-[1.65] ${MUTED}`}>
          티켓 예매는 CELEBUS 계정으로만 이용할 수 있습니다. CELEBUS 앱에서 로그인한 뒤 이어서 진행해
          주세요.
        </p>

        <div className="mt-2 flex w-full max-w-[320px] flex-col gap-2">
          <a href={PARENT_APP_URL} className={PRIMARY_BUTTON}>
            CELEBUS 앱으로 이동
          </a>
          <button type="button" onClick={onRetry} disabled={busy} className={GHOST_BUTTON}>
            {busy ? '확인 중…' : '다시 확인'}
          </button>
        </div>

        <p className="rounded-xl bg-[#FFFAEB] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#B54708]">
          {REASON_MESSAGE[reason]}
        </p>
      </div>
    </main>
  );
}
