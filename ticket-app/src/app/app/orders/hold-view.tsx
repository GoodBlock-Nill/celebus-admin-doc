'use client';

import { useState } from 'react';

import { DepositGuideCard } from '../_components/deposit-guide';
import { CARD } from '../_components/ui';
import type { OrderDetailView } from '@/lib/api-types';

// 사업자 정보 확정 전 자리표시 — 실값 수급 시 푸터와 함께 일괄 교체
const CS_TEL = '{0000-0000}';

const HOLD_STEPS = ['입금 확인 요청', '수동 대조', '확인 완료'] as const;

/** 보류 배너 속 미니 진행선 — 보류를 "진행 중인 확인"으로 보여준다 */
function HoldStepper() {
  return (
    <div className="mt-4">
      <div className="flex items-center px-6">
        {HOLD_STEPS.map((label, index) => (
          <div key={label} className={`flex items-center ${index > 0 ? 'flex-1' : ''}`}>
            {index > 0 ? <span aria-hidden="true" className="h-[2px] flex-1 bg-[#E8B4C4]" /> : null}
            {index === 1 ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#D6336C] bg-white">
                <span className="h-2 w-2 rounded-full bg-[#D6336C]" />
              </span>
            ) : (
              <span className="h-4 w-4 rounded-full border-2 border-[#D9DEE4] bg-white" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[12.5px]">
        {HOLD_STEPS.map((label, index) => (
          <span
            key={label}
            className={index === 1 ? 'font-bold text-[#D6336C]' : 'font-medium text-[#6B7684]'}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** 보류 사유 텍스트에서 불일치 항목을 추려 낸다 */
function mismatchRows(holdReason: string | null): string[] {
  const reason = holdReason ?? '';
  const rows = [];
  if (reason.includes('입금자명')) rows.push('입금자명');
  if (reason.includes('금액')) rows.push('금액');
  return rows;
}

/**
 * 확인 보류 전용 해결 플로우 카드 — 무엇이 다른지·지금 할 일·확인되면
 * 어떻게 되는지를 한 흐름으로 묶어 상황을 예측 가능하게 만든다.
 */
export function HoldFlowCard({ order }: { order: OrderDetailView }) {
  const [showsResend, setShowsResend] = useState(false);
  const rows = mismatchRows(order.holdReason);

  return (
    <div className="flex flex-col gap-3">
      <section className={`${CARD} flex flex-col gap-4 p-4`}>
        <div className="rounded-xl bg-[#FDF2F7] p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FBDCE8] text-[18px]">
              <span aria-hidden="true" className="font-bold text-[#D6336C]">
                !
              </span>
            </span>
            <div className="min-w-0">
              <h2 className="text-[19px] font-bold text-[#C9184A]">입금 확인 보류</h2>
              <p className="mt-1 text-[14px] leading-relaxed text-[#4E5968]">
                입금자명/금액이 예매 정보와 달라 운영자가 수동으로 대조하고 있어요.
              </p>
            </div>
          </div>
          <HoldStepper />
        </div>

        <div className="border-t border-[#F2F4F6] pt-3.5">
          <h3 className="text-[15px] font-bold text-[#191F28]">무엇이 다른가요</h3>
          {rows.length > 0 ? (
            <ul className="mt-2.5 flex flex-col gap-2">
              {rows.map((label) => (
                <li key={label} className="flex items-center gap-3 text-[14px] text-[#4E5968]">
                  {label}
                  <span className="rounded-lg border border-[#F6C6DA] bg-[#FDF2F7] px-2.5 py-1 text-[12.5px] font-semibold text-[#D6336C]">
                    불일치
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[14px] leading-relaxed text-[#4E5968]">
              {order.holdReason ?? '운영자가 입금 내역을 대조하고 있습니다.'}
            </p>
          )}
        </div>

        <div className="border-t border-[#F2F4F6] pt-3.5">
          <h3 className="text-[15px] font-bold text-[#191F28]">지금 할 일</h3>
          <div className="mt-2.5 flex gap-2">
            <a
              href={`tel:${CS_TEL}`}
              className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-[#D6336C] px-3 text-[15px] font-bold text-white"
            >
              고객센터 문의
            </a>
            <button
              type="button"
              onClick={() => setShowsResend((value) => !value)}
              aria-expanded={showsResend}
              className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-[#D6336C] bg-white px-3 text-[15px] font-bold text-[#D6336C]"
            >
              재송금 안내 보기
            </button>
          </div>
        </div>

        <div className="border-t border-[#F2F4F6] pt-3.5">
          <h3 className="text-[15px] font-bold text-[#191F28]">확인되면</h3>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[#4E5968]">
            확인 완료 후, 공연 당일 CELEBUS 앱으로 티켓이 지급돼요.
          </p>
        </div>
      </section>

      {showsResend ? (
        <div className="flex flex-col gap-3">
          <p className="px-1 text-[13px] leading-relaxed text-[#6B7684]">
            다르게 입금된 금액은 전액 환불 후 다시 예매하는 것이 원칙입니다. 재송금이 필요한 경우
            고객센터 안내에 따라 아래 계좌로 정확한 금액·입금자명으로 보내 주세요.
          </p>
          <DepositGuideCard order={order} />
        </div>
      ) : null}
    </div>
  );
}
