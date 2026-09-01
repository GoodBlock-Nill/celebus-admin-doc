'use client';

import Link from 'next/link';

import { SectionCard } from '../_components/section';
import { GHOST_BUTTON, MUTED, PRIMARY_BUTTON } from '../_components/ui';

/**
 * 실명 교체 차단 화면 (재설계서 A-7).
 *
 * 진행 중인 예매·유효한 티켓이 있는 계정에서 다른 실명으로 본인확인을 마치면
 * 이미 안내된 입금자명 규칙과 티켓의 실명 확인 근거가 어긋난다.
 * 같은 실명으로 다시 인증하는 것은 그대로 허용된다.
 */
export function VerifyLockedStep({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="rounded-2xl bg-[#FFFAEB] p-5 text-center">
        <p className="text-[16px] font-bold text-[#B54708]">진행 중인 예매가 있어 변경할 수 없습니다</p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#93370D]">
          진행 중인 예매가 있어 본인확인 정보를 변경할 수 없습니다. 고객센터로 문의해 주세요.
        </p>
      </div>

      <SectionCard title="왜 변경할 수 없나요?">
        <ul className={`flex flex-col gap-1.5 text-[13.5px] leading-relaxed ${MUTED}`}>
          <li>· 입금자명 안내는 본인확인 실명으로 만들어집니다. 실명이 바뀌면 입금 확인이 되지 않습니다.</li>
          <li>· 발급된 티켓은 실명 티켓이라 현장 확인 기준도 함께 어긋납니다.</li>
          <li>· 같은 실명으로 인증 수단만 바꾸는 재인증은 그대로 가능합니다.</li>
        </ul>
      </SectionCard>

      <Link href="/app/orders" className={PRIMARY_BUTTON}>
        내 예매 확인하기
      </Link>
      <button type="button" onClick={onRetry} className={GHOST_BUTTON}>
        본인 실명으로 다시 인증
      </button>
    </div>
  );
}
