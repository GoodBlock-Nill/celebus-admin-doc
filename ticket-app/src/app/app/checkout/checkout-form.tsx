'use client';

import { useState } from 'react';

import { CashReceiptField } from './cash-receipt-field';
import { CheckRow, QtyStepper } from '../_components/form-controls';
import { ErrorBanner } from '../_components/feedback';
import { InfoRow, NoticeBox, SectionCard } from '../_components/section';
import { MUTED, NUMERIC, PRIMARY_BUTTON } from '../_components/ui';
import type { CashReceiptSource, ConcertView, SessionView } from '@/lib/api-types';
import { formatDateTime, formatKrw } from '@/lib/format';

const AGREEMENT_TEXT =
  '입금자명은 본인확인 실명과 일치해야 하며, 마감 시각까지 미입금 시 자동 취소됩니다.';

const PHONE_PATTERN = /^01\d{8,9}$/;
const PHONE_ERROR = '휴대폰 번호를 숫자만 정확히 입력해 주세요.';

export interface CheckoutSubmitInput {
  qty: number;
  wantsCashReceipt: boolean;
  cashReceiptSource: CashReceiptSource;
  cashReceiptPhone: string;
}

interface CheckoutFormProps {
  concert: ConcertView;
  session: SessionView;
  /** 1인 한도·잔여 좌석을 반영한 최대 예매 매수 */
  maxQty: number;
  heldQty: number;
  /** 본인확인 휴대폰 번호(마스킹) — 원문은 서버에서만 다룬다. */
  verifiedPhoneMasked: string;
  errorMessage: string;
  busy: boolean;
  onSubmit: (input: CheckoutSubmitInput) => void;
}

/** A4 1단계 — 예매 신청 폼 */
export function CheckoutForm({
  concert,
  session,
  maxQty,
  heldQty,
  verifiedPhoneMasked,
  errorMessage,
  busy,
  onSubmit,
}: CheckoutFormProps) {
  const [qty, setQty] = useState(1);
  const [wantsCashReceipt, setWantsCashReceipt] = useState(false);
  const [cashReceiptSource, setCashReceiptSource] = useState<CashReceiptSource>('verified');
  const [cashReceiptPhone, setCashReceiptPhone] = useState('');
  const [isAgreed, setAgreed] = useState(false);

  // 본인확인 번호를 쓸 수 없는 예외 상황에서는 직접 입력만 허용한다.
  const source: CashReceiptSource = verifiedPhoneMasked === '' ? 'manual' : cashReceiptSource;
  const needsManualPhone = wantsCashReceipt && source === 'manual';
  const isPhoneValid = PHONE_PATTERN.test(cashReceiptPhone);
  const phoneError = needsManualPhone && cashReceiptPhone !== '' && !isPhoneValid ? PHONE_ERROR : '';

  const amount = concert.priceKrw * qty;
  const canSubmit =
    isAgreed && qty >= 1 && qty <= maxQty && !busy && (!needsManualPhone || isPhoneValid);

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
        <div className="mt-3 flex items-center justify-between border-t border-[#E5E8EB] pt-3">
          <span className={`text-[14px] ${MUTED}`}>결제 예정 금액</span>
          <span className={`text-[22px] font-extrabold text-[#191F28] ${NUMERIC}`}>
            {formatKrw(amount)}
          </span>
        </div>
      </SectionCard>

      <SectionCard title="현금영수증">
        <CashReceiptField
          wants={wantsCashReceipt}
          source={source}
          phone={cashReceiptPhone}
          verifiedPhoneMasked={verifiedPhoneMasked}
          phoneError={phoneError}
          onWantsChange={setWantsCashReceipt}
          onSourceChange={setCashReceiptSource}
          onPhoneChange={(value) => setCashReceiptPhone(value.replace(/\D/g, ''))}
        />
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
        onClick={() => onSubmit({ qty, wantsCashReceipt, cashReceiptSource: source, cashReceiptPhone })}
        className={PRIMARY_BUTTON}
      >
        {busy ? '신청 중…' : '입금 안내 받기'}
      </button>
    </div>
  );
}
