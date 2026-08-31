'use client';

// CELEBUS 미로그인 게이트 — 본앱 세션이 없으면 예매를 이용할 수 없다.
// 본앱에서 로그인한 뒤 [다시 확인]으로 재시도한다(예매 웹 자체 회원가입 없음).
import { GHOST_BUTTON, MUTED, PRIMARY_BUTTON } from './ui';
import { ShieldIcon } from './icons';

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
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-5 py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#20222A] text-[#F0426E]">
        <ShieldIcon className="h-8 w-8" />
      </span>

      <div>
        <p className="text-[11px] font-bold tracking-[0.28em] text-[#F0426E]">CELEBUS</p>
        <h1 className="mt-1.5 text-[20px] font-extrabold">TICKET</h1>
      </div>

      <p className={`max-w-[300px] text-[13px] leading-relaxed ${MUTED}`}>
        티켓 예매는 CELEBUS 계정으로만 이용할 수 있습니다. CELEBUS 앱에서 로그인한 뒤 이어서 진행해 주세요.
      </p>

      <div className="mt-2 flex w-full max-w-[320px] flex-col gap-2">
        <a href={PARENT_APP_URL} className={PRIMARY_BUTTON}>
          CELEBUS 앱으로 이동
        </a>
        <button type="button" onClick={onRetry} disabled={busy} className={GHOST_BUTTON}>
          {busy ? '확인 중…' : '다시 확인'}
        </button>
      </div>

      <p className="text-[11.5px] leading-relaxed text-[#F5B341]">{REASON_MESSAGE[reason]}</p>
    </main>
  );
}
