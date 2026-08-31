'use client';

import { Field, RadioGroup, TextInput, ToggleRow, type RadioOption } from '../_components/form-controls';
import { NoticeBox } from '../_components/section';
import type { CashReceiptSource } from '@/lib/api-types';

const PHONE_MAX_LENGTH = 11;

const NO_VERIFIED_PHONE_NOTICE =
  '본인확인 휴대폰 번호를 확인할 수 없어 발급용 번호를 직접 입력해야 합니다.';

const MANUAL_HINT = '현금영수증 발급에 사용할 번호를 숫자만 입력해 주세요.';

interface CashReceiptFieldProps {
  wants: boolean;
  source: CashReceiptSource;
  phone: string;
  /** 본인확인 휴대폰 번호(마스킹) — 원문은 서버에서만 다룬다. */
  verifiedPhoneMasked: string;
  phoneError: string;
  onWantsChange: (wants: boolean) => void;
  onSourceChange: (source: CashReceiptSource) => void;
  onPhoneChange: (phone: string) => void;
}

/**
 * 현금영수증 발급 정보 입력.
 * 기본값은 본인확인에 사용한 번호이며, 화면에는 마스킹된 번호만 보여 준다.
 */
export function CashReceiptField({
  wants,
  source,
  phone,
  verifiedPhoneMasked,
  phoneError,
  onWantsChange,
  onSourceChange,
  onPhoneChange,
}: CashReceiptFieldProps) {
  const canUseVerified = verifiedPhoneMasked !== '';

  const options: RadioOption<CashReceiptSource>[] = [
    {
      value: 'verified',
      label: '본인확인에 사용한 번호로 발급',
      description: verifiedPhoneMasked,
    },
    { value: 'manual', label: '다른 번호로 발급' },
  ];

  return (
    <>
      <ToggleRow label="현금영수증 신청" checked={wants} onChange={onWantsChange} />

      {wants && canUseVerified ? (
        <div className="mt-3">
          <RadioGroup
            name="cash-receipt-source"
            groupLabel="현금영수증 발급 번호"
            value={source}
            options={options}
            onChange={onSourceChange}
          />
        </div>
      ) : null}

      {wants && !canUseVerified ? (
        <div className="mt-3">
          <NoticeBox tone="muted">{NO_VERIFIED_PHONE_NOTICE}</NoticeBox>
        </div>
      ) : null}

      {wants && (source === 'manual' || !canUseVerified) ? (
        <div className="mt-3">
          <Field label="발급용 휴대폰 번호" hint={MANUAL_HINT} error={phoneError}>
            <TextInput
              value={phone}
              onChange={onPhoneChange}
              inputMode="tel"
              placeholder="01012345678"
              maxLength={PHONE_MAX_LENGTH}
              numeric
            />
          </Field>
        </div>
      ) : null}
    </>
  );
}
