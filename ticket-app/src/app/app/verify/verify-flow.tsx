'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { DemoTip } from '../_components/feedback';
import {
  VerifyBlockedStep,
  VerifyCodeStep,
  VerifyDoneStep,
  VerifyFormStep,
  type IdentityForm,
} from './verify-steps';
import { useTicketStore } from '@/lib/store';

type VerifyStep = 'FORM' | 'CODE' | 'BLOCKED' | 'DONE';

const NAME_PATTERN = /^[가-힣a-zA-Z]{2,20}$/;
const BIRTH_PATTERN = /^\d{8}$/;
const PHONE_PATTERN = /^01\d{8,9}$/;
const CODE_PATTERN = /^\d{6}$/;

const EMPTY_FORM: IdentityForm = { realName: '', birth: '', phone: '' };

/** 입력값 형식 검증 — 통과 시 빈 객체 */
function validateForm(form: IdentityForm): Partial<Record<keyof IdentityForm, string>> {
  const errors: Partial<Record<keyof IdentityForm, string>> = {};
  if (!NAME_PATTERN.test(form.realName.trim())) errors.realName = '실명을 정확히 입력해 주세요.';
  if (!BIRTH_PATTERN.test(form.birth)) errors.birth = '생년월일 8자리를 숫자로 입력해 주세요.';
  if (!PHONE_PATTERN.test(form.phone)) errors.phone = '휴대폰 번호를 숫자만 입력해 주세요.';
  return errors;
}

/** 숫자만 남긴다. */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** A3 본인확인 흐름 — 정보 입력 → 인증번호 → 결과 */
export function VerifyFlow() {
  const searchParams = useSearchParams();
  const nextHref = searchParams.get('next') ?? '/app';

  const verifyIdentity = useTicketStore((state) => state.verifyIdentity);

  const [step, setStep] = useState<VerifyStep>('FORM');
  const [form, setForm] = useState<IdentityForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof IdentityForm, string>>>({});
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [resendNotice, setResendNotice] = useState('');

  const handleChange = (field: keyof IdentityForm, value: string) => {
    const nextValue = field === 'realName' ? value : digitsOnly(value);
    setForm((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleRequestCode = () => {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setCode('');
    setCodeError('');
    setResendNotice('');
    setStep('CODE');
  };

  const handleConfirmCode = () => {
    if (!CODE_PATTERN.test(code)) {
      setCodeError('인증번호 6자리를 입력해 주세요.');
      return;
    }

    const result = verifyIdentity({
      realName: form.realName.trim(),
      birth: form.birth,
      phone: form.phone,
    });

    setStep(result.ok ? 'DONE' : 'BLOCKED');
  };

  const handleRetry = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setCode('');
    setCodeError('');
    setStep('FORM');
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      {step === 'FORM' ? (
        <VerifyFormStep
          form={form}
          errors={errors}
          onChange={handleChange}
          onSubmit={handleRequestCode}
        />
      ) : null}

      {step === 'CODE' ? (
        <VerifyCodeStep
          phone={form.phone}
          code={code}
          error={codeError}
          resendNotice={resendNotice}
          onChangeCode={(value) => {
            setCode(digitsOnly(value));
            setCodeError('');
          }}
          onResend={() => setResendNotice('인증번호를 다시 보냈습니다.')}
          onSubmit={handleConfirmCode}
          onBack={() => setStep('FORM')}
        />
      ) : null}

      {step === 'BLOCKED' ? <VerifyBlockedStep onRetry={handleRetry} /> : null}

      {step === 'DONE' ? (
        <VerifyDoneStep realName={form.realName.trim()} nextHref={nextHref} />
      ) : null}

      <DemoTip>
        데모: 허브에서 사용자를 전환해 같은 정보로 인증하면 중복 차단을 확인할 수 있습니다.
      </DemoTip>
    </div>
  );
}
