'use client';

import { CARD } from '../_components/ui';
import { HoldDepositorBlock } from './hold-depositor-block';
import { holdMismatchOf, mismatchRows } from './hold-reason';
import { HoldRefundBlock, HoldResendFold } from './hold-refund-block';
import type { OrderDetailView } from '@/lib/api-types';
import { CS_EMAIL } from '@/lib/constants';

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

/** 무엇이 다른가요 — 어긋난 항목을 먼저 짚어 회원이 원인을 납득하게 한다 */
function MismatchSummary({ order }: { order: OrderDetailView }) {
  const rows = mismatchRows(order.holdCause, order.holdReason);
  const { holdReason } = order;

  return (
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
          {holdReason ?? '운영자가 입금 내역을 대조하고 있습니다.'}
        </p>
      )}
    </div>
  );
}

/**
 * 확인 보류 전용 해결 플로우 — 사유에 따라 다음 단계를 다르게 안내한다.
 *  · 입금자명이 어긋남 → 실제로 쓴 입금자명을 알려주면 운영자가 그 이름으로 대조
 *  · 금액이 어긋남     → 환불 계좌를 등록하고, 관람을 원하면 정확한 금액으로 다시 송금
 * 회원은 이미 송금을 마친 상태이므로 "송금 유도"가 아니라 "해결"을 앞세운다.
 */
export function HoldFlowCard({ order, onDone }: { order: OrderDetailView; onDone?: () => void }) {
  const mismatch = holdMismatchOf(order.holdCause, order.holdReason);
  const depositorStep = 1;
  const refundStep = mismatch.isNameMismatch ? 2 : 1;

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
                입금 내역이 예매 정보와 달라 운영자가 대조하고 있어요. 아래 내용만 알려주시면 이어서
                처리됩니다.
              </p>
            </div>
          </div>
          <HoldStepper />
        </div>

        <MismatchSummary order={order} />

        <div className="border-t border-[#F2F4F6] pt-3.5">
          <h3 className="text-[15px] font-bold text-[#191F28]">지금 할 일</h3>
          <div className="mt-2.5 flex flex-col gap-2.5">
            {mismatch.isNameMismatch ? (
              <HoldDepositorBlock order={order} step={depositorStep} onDone={onDone} />
            ) : null}
            {mismatch.isAmountMismatch ? (
              <>
                <HoldRefundBlock order={order} step={refundStep} onDone={onDone} />
                <HoldResendFold order={order} />
              </>
            ) : null}
          </div>
        </div>

        <div className="border-t border-[#F2F4F6] pt-3.5">
          <h3 className="text-[15px] font-bold text-[#191F28]">확인되면</h3>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[#4E5968]">
            확인 완료 후, 공연 당일 CELEBUS 앱으로 티켓이 지급돼요.
          </p>
        </div>

        <a
          href={`mailto:${CS_EMAIL}`}
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-[#E5E8EB] bg-white px-4 text-[15px] font-semibold text-[#191F28]"
        >
          고객센터 문의
        </a>
      </section>
    </div>
  );
}
