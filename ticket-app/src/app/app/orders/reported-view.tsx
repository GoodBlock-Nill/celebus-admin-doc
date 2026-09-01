'use client';

import { useState } from 'react';

import { DepositGuideCard } from '../_components/deposit-guide';
import { CheckIcon, ChevronDownIcon, ClockIcon } from '../_components/icons';
import { InfoRow, SectionCard } from '../_components/section';
import { CARD, NUMERIC } from '../_components/ui';
import type { OrderDetailView } from '@/lib/api-types';
import { formatDateTime, formatKrw } from '@/lib/format';

const INFO_BLUE = '#175CD3';

/** 처리중 히어로 — 현재 상태가 첫 시선에 고정되도록 화면 최상단에 둔다 */
function ReportedHero({ order }: { order: OrderDetailView }) {
  return (
    <section className={`${CARD} flex flex-col items-center gap-2 px-4 py-7 text-center`}>
      <span
        aria-hidden="true"
        className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#E5E8EB] border-t-[#175CD3]"
      />
      <h2 className="mt-1 text-[22px] font-bold text-[#191F28]">입금 확인중</h2>
      {order.depositReportedAt ? (
        <p className={`text-[13.5px] text-[#6B7684] ${NUMERIC}`}>
          요청 시각 {formatDateTime(order.depositReportedAt)}
        </p>
      ) : null}
      <p className="text-[14px] text-[#4E5968]">운영자가 입금 내역을 확인하고 있어요</p>
      <span className="mt-1.5 rounded-full bg-[#F2F4F6] px-3.5 py-1.5 text-[13px] font-semibold text-[#4E5968]">
        자동 취소 유예 중
      </span>
      <p className="mt-1 text-[13px] text-[#6B7684]">
        확인 완료 시 &lsquo;입금 확인&rsquo;으로 변경됩니다.
      </p>
    </section>
  );
}

const STEPS = ['예매 접수', '입금 확인중', '입금 확인', '티켓 지급'] as const;
const CURRENT_STEP = 1;

/** 가로 점선 스텝퍼 — 확정된 4단계 체계를 한 줄로 압축한다 */
function ReportedStepper() {
  return (
    <section className={`${CARD} px-3 py-4`}>
      <ol className="flex items-start">
        {STEPS.map((label, index) => {
          const isDone = index < CURRENT_STEP;
          const isCurrent = index === CURRENT_STEP;

          return (
            <li key={label} className="flex min-w-0 flex-1 items-start">
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="mt-[13px] h-0 flex-1 border-t-2 border-dotted border-[#D9DEE4]"
                />
              ) : null}
              <div className="flex w-[68px] shrink-0 flex-col items-center gap-1.5">
                {isDone ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EFF4FF]">
                    <CheckIcon className="h-4 w-4 text-[#175CD3]" />
                  </span>
                ) : isCurrent ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#175CD3]">
                    <ClockIcon className="h-4 w-4 text-white" />
                  </span>
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-[#E5E8EB] bg-white" />
                )}
                <span
                  className={`whitespace-nowrap text-[12px] ${
                    isCurrent ? 'font-bold' : 'font-medium text-[#8B95A1]'
                  }`}
                  style={isCurrent ? { color: INFO_BLUE } : undefined}
                >
                  {label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** 후순위로 내린 송금 정보 — 기본 접힘, 필요할 때만 펼쳐 본다 */
function DepositFold({ order }: { order: OrderDetailView }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className={`${CARD} flex min-h-[54px] w-full items-center justify-between px-4 py-3 text-left text-[15px] font-bold text-[#191F28]`}
      >
        입금 계좌/마감
        <ChevronDownIcon
          className={`h-5 w-5 text-[#8B95A1] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen ? <DepositGuideCard order={order} /> : null}
    </div>
  );
}

/**
 * 입금 확인중 전용 상세 구성 — 대기 상태를 첫 시선에 두고
 * 이미 마친 송금 정보는 접힘으로 후순위 처리한다.
 */
export function ReportedView({ order }: { order: OrderDetailView }) {
  return (
    <>
      <ReportedHero order={order} />
      <ReportedStepper />
      <SectionCard title="예매 정보">
        <InfoRow label="예매번호" value={order.orderNo} />
        <InfoRow label="공연" value={order.concertTitle} />
        <InfoRow label="회차" value={order.sessionName} />
        <InfoRow label="매수" value={`${order.qty}매`} />
        <InfoRow label="결제 금액" value={formatKrw(order.amountKrw)} emphasis />
      </SectionCard>
      <DepositFold order={order} />
    </>
  );
}
