'use client';

import { useState } from 'react';

import { CheckRow, Field, QtyStepper, TextInput, ToggleRow } from '../_components/form-controls';
import { ErrorBanner } from '../_components/feedback';
import { InfoRow, NoticeBox, SectionCard } from '../_components/section';
import { MUTED, NUMERIC, PRIMARY_BUTTON } from '../_components/ui';
import { formatDateTime, formatKrw } from '@/lib/format';
import type { Concert, ConcertSession } from '@/lib/types';

const AGREEMENT_TEXT =
  '입금자명은 본인확인 실명과 일치해야 하며, 마감 시각까지 미입금 시 자동 취소됩니다.';

export interface CheckoutSubmitInput {
  qty: number;
  wantsCashReceipt: boolean;
  cashReceiptPhone: string;
}

interface CheckoutFormProps {
  concert: Concert;
  session: ConcertSession;
  /** 1인 한도·잔여 좌석을 반영한 최대 예매 매수 */
  maxQty: number;
  heldQty: number;
  defaultPhone: string;
  errorMessage: string;
  onSubmit: (input: CheckoutSubmitInput) => void;
}

/** A4 1단계 — 예매 신청 폼 */
export function CheckoutForm({
  concert,
  session,
  maxQty,
  heldQty,
  defaultPhone,
  errorMessage,
  onSubmit,
}: CheckoutFormProps) {
  const [qty, setQty] = useState(1);
  const [wantsCashReceipt, setWantsCashReceipt] = useState(false);
  const [cashReceiptPhone, setCashReceiptPhone] = useState(defaultPhone);
  const [isAgreed, setAgreed] = useState(false);

  const amount = concert.priceKrw * qty;
  const canSubmit = isAgreed && qty >= 1 && qty <= maxQty;

  return (
    <div className="flex flex-col gap-3.5">
      <SectionCard title="예매 회차">
        <InfoRow label="공연" value={concert.title} />
        <InfoRow label="회차" value={session.name} />
        <InfoRow label="일시" value={formatDateTime(session.startAt)} />
        <InfoRow label="장소" value={concert.venue} />
      </SectionCard>

      <SectionCard
        title="예매 매수"
        description={`1인 최대 ${concert.maxPerUser}매 · 현재 보유 ${heldQty}매 (이번 주문 가능 ${maxQty}매)`}
      >
        <QtyStepper value={qty} min={1} max={maxQty} onChange={setQty} />
        <div className="mt-3 flex items-center justify-between border-t border-[#2A2C34] pt-3">
          <span className={`text-[13px] ${MUTED}`}>결제 예정 금액</span>
          <span className={`text-[19px] font-extrabold text-[#F0426E] ${NUMERIC}`}>
            {formatKrw(amount)}
          </span>
        </div>
      </SectionCard>

      <SectionCard title="현금영수증">
        <ToggleRow label="현금영수증 신청" checked={wantsCashReceipt} onChange={setWantsCashReceipt} />
        {wantsCashReceipt ? (
          <div className="mt-3">
            <Field label="발급용 휴대폰 번호" hint="본인확인에 사용한 번호가 기본으로 입력됩니다.">
              <TextInput
                value={cashReceiptPhone}
                onChange={(value) => setCashReceiptPhone(value.replace(/\D/g, ''))}
                inputMode="tel"
                maxLength={11}
                numeric
              />
            </Field>
          </div>
        ) : null}
      </SectionCard>

      <NoticeBox tone="warning">{AGREEMENT_TEXT}</NoticeBox>

      <SectionCard>
        <CheckRow checked={isAgreed} onChange={setAgreed}>
          위 유의사항을 모두 확인했습니다. (필수)
        </CheckRow>
      </SectionCard>

      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => onSubmit({ qty, wantsCashReceipt, cashReceiptPhone })}
        className={PRIMARY_BUTTON}
      >
        입금 안내 받기
      </button>
    </div>
  );
}
