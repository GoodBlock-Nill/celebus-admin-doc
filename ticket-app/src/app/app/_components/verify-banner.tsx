import Link from 'next/link';

import { CARD } from './ui';

/** 미인증 회원에게 상태 칩 대신 '할 일'을 설명하는 본인확인 배너 (홈 전용) */
export function VerifyBanner() {
  return (
    <section className={`${CARD} flex items-center gap-3 p-4`}>
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FDF2F7] text-[#D6336C]"
      >
        <UserCheckIcon />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-bold text-[#191F28]">예매 전 본인확인이 필요해요</p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-[#6B7684]">
          부정 예매 방지 및 입장 확인을 위해 진행해요.
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <Link
          href="/app/verify"
          className="rounded-[10px] bg-[#D6336C] px-3.5 py-2.5 text-[13px] font-bold text-white"
        >
          본인확인 하기
        </Link>
        <Link href="/app/verify" className="text-[12px] text-[#6B7684]">
          왜 필요한가요 <span aria-hidden="true">›</span>
        </Link>
      </div>
    </section>
  );
}

function UserCheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="10" cy="8" r="3.4" />
      <path d="M4.2 19.2c0-3 2.6-5 5.8-5 1.1 0 2.1.2 3 .7" strokeLinecap="round" />
      <path d="M14.5 17.2l2 2 3.5-3.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
