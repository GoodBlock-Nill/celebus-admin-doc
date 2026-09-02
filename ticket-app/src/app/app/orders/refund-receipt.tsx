'use client';

import { useState } from 'react';

import { ChevronDownIcon } from '../_components/icons';
import { CARD, NUMERIC } from '../_components/ui';
import { OrderInfoRows } from './order-info-card';
import type { OrderDetailView } from '@/lib/api-types';
import { CS_EMAIL } from '@/lib/constants';
import { formatDateTime, formatKrw } from '@/lib/format';

/** 영수증 번호 — 예매번호에서 파생되는 결정적 표기 (T260901-0001 → RF-260901-0001) */
function receiptNoOf(orderNo: string): string {
  return `RF-${orderNo.replace(/^T/, '')}`;
}

/**
 * 환불 영수증 — 환불 결과를 상태가 아니라 "정산 오브젝트"로 완결해
 * 총 환불액·수수료·처리 시각을 한 장으로 기억하게 한다.
 */
export function RefundReceiptCard({ order }: { order: OrderDetailView }) {
  const feeKrw = order.refundFeeKrw ?? 0;
  const refundKrw = order.refundAmountKrw ?? order.amountKrw - feeKrw;

  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="px-4 pt-4">
        <h2 className="border-b-2 border-[#D6336C] pb-2.5 text-[18px] font-bold text-[#D6336C]">
          환불 영수증
        </h2>
        <p className="mt-4 text-[14px] font-semibold text-[#191F28]">총 환불액</p>
        <p className={`mt-1 text-[38px] font-bold leading-tight text-[#191F28] ${NUMERIC}`}>
          {formatKrw(refundKrw).replace('원', '')}
          <span className="ml-1 text-[20px] font-bold">원</span>
        </p>
        <div className={`mt-4 flex flex-col gap-3 border-t border-[#E5E8EB] pt-4 pb-4 ${NUMERIC}`}>
          <div className="flex items-center justify-between text-[14.5px]">
            <span className="text-[#8B95A1]">결제액</span>
            <span className="text-[#191F28]">{formatKrw(order.amountKrw)}</span>
          </div>
          <div className="flex items-center justify-between text-[14.5px]">
            <span className="text-[#8B95A1]">환불 수수료</span>
            <span className="text-[#191F28]">{formatKrw(feeKrw)}</span>
          </div>
          <div className="flex items-center justify-between text-[14.5px]">
            <span className="text-[#8B95A1]">처리 시각</span>
            <span className="text-[#191F28]">
              {order.refundedAt ? formatDateTime(order.refundedAt) : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[14.5px]">
            <span className="text-[#8B95A1]">영수증 번호</span>
            <span className="text-[#191F28]">{receiptNoOf(order.orderNo)}</span>
          </div>
        </div>
      </div>
      <div className="flex border-t border-[#F2F4F6]">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex min-h-[52px] flex-1 items-center justify-center text-[15px] font-bold text-[#191F28]"
        >
          영수증 저장
        </button>
        <span aria-hidden="true" className="my-3 w-px bg-[#E5E8EB]" />
        <a
          href={`mailto:${CS_EMAIL}`}
          className="flex min-h-[52px] flex-1 items-center justify-center text-[15px] font-bold text-[#191F28]"
        >
          문의하기
        </a>
      </div>
    </section>
  );
}

/** 종결된 예매의 상세 정보 — 기본 접힘, 필요할 때만 펼쳐 본다 */
export function CollapsedOrderInfo({ order }: { order: OrderDetailView }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className={`${CARD} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between px-4 py-4 text-left"
      >
        <span>
          <span className="block text-[16px] font-bold text-[#191F28]">예매 정보</span>
          {isOpen ? null : (
            <span className="mt-0.5 block text-[13px] text-[#8B95A1]">공연/회차/매수</span>
          )}
        </span>
        <ChevronDownIcon
          className={`h-5 w-5 text-[#8B95A1] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen ? (
        <div className="border-t border-[#F2F4F6] px-4 pb-4 pt-1">
          <OrderInfoRows order={order} />
        </div>
      ) : null}
    </section>
  );
}
