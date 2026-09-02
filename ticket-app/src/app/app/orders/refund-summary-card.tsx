'use client';

import { useState } from 'react';

import { InfoRow, SectionCard } from '../_components/section';
import { RefundAccountSection } from './refund-account-section';
import type { OrderDetailView } from '@/lib/api-types';
import { formatKrw } from '@/lib/format';

/**
 * 취소 요청 전용 환불 요약 — "돈은 얼마가 어디로 들어오나"를 화면이 먼저 답한다.
 * 수수료·예상 환불액은 서버 견적(관람일 기준 단계)이며, 확정 금액은 운영자 승인 시 정해진다.
 */
export function RefundSummaryCard({
  order,
  onDone,
}: {
  order: OrderDetailView;
  onDone?: () => void;
}) {
  const hasAccount = Boolean(order.refundBank && order.refundAccountMasked && order.refundHolder);
  // 계좌가 없으면 등록 폼을 바로 열어 두고, 있으면 [환불 계좌 변경]으로 연다.
  const [showsAccountForm, setShowsAccountForm] = useState(!hasAccount);
  const quote = order.refundQuote;

  return (
    <div className="flex flex-col gap-3.5">
      <SectionCard title="환불 요약">
        <InfoRow label="결제 금액" value={formatKrw(order.amountKrw)} />
        <InfoRow label="환불 수수료" value={quote ? formatKrw(quote.feeKrw) : '-'} />
        <InfoRow label="예상 환불액" value={quote ? formatKrw(quote.refundKrw) : '-'} emphasis />
        <InfoRow
          label="환불 입금처"
          value={
            hasAccount
              ? `${order.refundBank} ${order.refundAccountMasked} (예금주 ${order.refundHolder})`
              : '미등록'
          }
        />
        {quote?.basis ? (
          <p className="mt-1.5 text-[12.5px] text-[#8B95A1]">적용 기준 — {quote.basis}</p>
        ) : null}
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#F2F4F6] pt-3">
          <p className="min-w-0 text-[12.5px] leading-relaxed text-[#6B7684]">
            입금은 운영자 처리 완료 후 순차 반영됩니다.
          </p>
          <button
            type="button"
            onClick={() => setShowsAccountForm((value) => !value)}
            aria-expanded={showsAccountForm}
            className="shrink-0 rounded-xl border border-[#D6336C] bg-white px-3.5 py-2.5 text-[13.5px] font-bold text-[#D6336C]"
          >
            환불 계좌 변경
          </button>
        </div>
      </SectionCard>

      {showsAccountForm ? <RefundAccountSection order={order} onDone={onDone} /> : null}
    </div>
  );
}
