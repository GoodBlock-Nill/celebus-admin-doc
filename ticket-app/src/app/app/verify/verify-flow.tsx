'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { ErrorBanner } from '../_components/feedback';
import { useMemberSession } from '../_components/member-session';
import { VerifyLockedStep } from './verify-locked-step';
import { providerLabel, type AuthProviderKey } from './verify-providers';
import {
  VerifyBlockedStep,
  VerifyDoneStep,
  VerifyFormStep,
  VerifyRequestStep,
  type IdentityForm,
} from './verify-steps';
import { api } from '@/lib/api-client';

type VerifyStep = 'FORM' | 'REQUESTED' | 'BLOCKED' | 'LOCKED' | 'DONE';

const NAME_PATTERN = /^[가-힣a-zA-Z]{2,20}$/;
const BIRTH_PATTERN = /^\d{8}$/;
const PHONE_PATTERN = /^01\d{8,9}$/;

const DUPLICATE_STATUS = 409;

/** 진행 중인 예매가 있어 실명을 바꿀 수 없는 경우 서버가 알려 주는 구분값 */
const ACTIVE_ORDER_CODE = 'ACTIVE_ORDER';

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

/** A3 본인확인 흐름 — 정보 입력·수단 선택 → 간편인증 요청 → 결과 */
export function VerifyFlow() {
  const searchParams = useSearchParams();
  const nextHref = searchParams.get('next') ?? '/app';
  const { refreshMe } = useMemberSession();

  const [step, setStep] = useState<VerifyStep>('FORM');
  const [form, setForm] = useState<IdentityForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof IdentityForm, string>>>({});
  const [provider, setProvider] = useState<AuthProviderKey | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof IdentityForm, value: string) => {
    const nextValue = field === 'realName' ? value : digitsOnly(value);
    setForm((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleRequestAuth = () => {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !provider) return;
    setErrorMessage('');
    setStep('REQUESTED');
  };

  const handleConfirmAuth = async () => {
    if (!provider || isSubmitting) return;

    setSubmitting(true);
    const result = await api.verify({
      realName: form.realName.trim(),
      birth: form.birth,
      phone: form.phone,
      provider: providerLabel(provider),
    });
    setSubmitting(false);

    if (result.ok) {
      await refreshMe();
      setStep('DONE');
      return;
    }

    if (result.status === DUPLICATE_STATUS) {
      setStep('BLOCKED');
      return;
    }
    // 진행 중인 예매가 있어 실명을 바꿀 수 없는 경우 — 사유와 다음 행동을 함께 안내한다.
    if (result.body?.code === ACTIVE_ORDER_CODE) {
      setStep('LOCKED');
      return;
    }
    setErrorMessage(result.reason);
  };

  const handleRetry = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setProvider(undefined);
    setErrorMessage('');
    setStep('FORM');
  };

  return (
    <div className="flex flex-col gap-4 px-4 pb-5">
      {step === 'FORM' ? (
        <VerifyFormStep
          form={form}
          errors={errors}
          provider={provider}
          onChange={handleChange}
          onSelectProvider={setProvider}
          onSubmit={handleRequestAuth}
        />
      ) : null}

      {step === 'REQUESTED' && provider ? (
        <VerifyRequestStep
          provider={provider}
          realName={form.realName.trim()}
          phone={form.phone}
          busy={isSubmitting}
          onSubmit={() => void handleConfirmAuth()}
          onBack={() => setStep('FORM')}
        />
      ) : null}

      {step === 'BLOCKED' ? <VerifyBlockedStep onRetry={handleRetry} /> : null}

      {step === 'LOCKED' ? <VerifyLockedStep onRetry={handleRetry} /> : null}

      {step === 'DONE' ? (
        <VerifyDoneStep realName={form.realName.trim()} nextHref={nextHref} />
      ) : null}

      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
    </div>
  );
}
