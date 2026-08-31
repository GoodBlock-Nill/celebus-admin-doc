'use client';

import Link from 'next/link';

import { CheckIcon, ShieldIcon } from '../_components/icons';
import { Field, TextInput } from '../_components/form-controls';
import { NoticeBox, SectionCard } from '../_components/section';
import { GHOST_BUTTON, MUTED, PRIMARY_BUTTON } from '../_components/ui';

/** 본인확인 시 수집하는 항목 고지 */
const COLLECTED_ITEMS = [
  '실명 — 예매자 확인 및 입금자명 대조',
  '생년월일 — 미성년자 관람 제한 확인',
  '휴대폰 번호 — 예매 안내 및 본인 연락',
  '중복가입확인정보 — 1인 1계정 확인(중복 예매 차단)',
];

export interface IdentityForm {
  realName: string;
  birth: string;
  phone: string;
}

interface FormStepProps {
  form: IdentityForm;
  errors: Partial<Record<keyof IdentityForm, string>>;
  onChange: (field: keyof IdentityForm, value: string) => void;
  onSubmit: () => void;
}

/** 스텝 1 — 안내 + 정보 입력 */
export function VerifyFormStep({ form, errors, onChange, onSubmit }: FormStepProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-start gap-3 rounded-2xl border border-[#2A2C34] bg-[#191A20] p-4">
        <ShieldIcon className="mt-0.5 h-6 w-6 shrink-0 text-[#F0426E]" />
        <div>
          <p className="text-[14px] font-bold">티켓 예매에는 최초 1회 휴대폰 본인확인이 필요합니다.</p>
          <p className={`mt-1.5 text-[12.5px] leading-relaxed ${MUTED}`}>
            암표·부정 예매를 막기 위해 실명으로 확인된 계정만 예매할 수 있습니다. 확인된 정보는 예매 확인과
            입금자명 대조에만 사용됩니다.
          </p>
        </div>
      </div>

      <SectionCard title="수집 항목">
        <ul className={`flex flex-col gap-1.5 text-[12.5px] leading-relaxed ${MUTED}`}>
          {COLLECTED_ITEMS.map((item) => (
            <li key={item} className="flex gap-1.5">
              <span aria-hidden="true">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="본인 정보 입력">
        <div className="flex flex-col gap-3.5">
          <Field label="실명" error={errors.realName} hint="예매자 본인 명의로만 확인할 수 있습니다.">
            <TextInput
              value={form.realName}
              onChange={(value) => onChange('realName', value)}
              placeholder="홍길동"
              maxLength={20}
            />
          </Field>
          <Field label="생년월일" error={errors.birth} hint="숫자 8자리 (예: 19990101)">
            <TextInput
              value={form.birth}
              onChange={(value) => onChange('birth', value)}
              placeholder="19990101"
              inputMode="numeric"
              maxLength={8}
              numeric
            />
          </Field>
          <Field label="휴대폰 번호" error={errors.phone} hint="숫자만 입력 (예: 01012345678)">
            <TextInput
              value={form.phone}
              onChange={(value) => onChange('phone', value)}
              placeholder="01012345678"
              inputMode="tel"
              maxLength={11}
              numeric
            />
          </Field>
        </div>
      </SectionCard>

      <button type="button" onClick={onSubmit} className={PRIMARY_BUTTON}>
        인증번호 받기
      </button>
    </div>
  );
}

interface CodeStepProps {
  phone: string;
  code: string;
  error?: string;
  resendNotice: string;
  onChangeCode: (value: string) => void;
  onResend: () => void;
  onSubmit: () => void;
  onBack: () => void;
}

/** 스텝 2 — 인증번호 확인 */
export function VerifyCodeStep({
  phone,
  code,
  error,
  resendNotice,
  onChangeCode,
  onResend,
  onSubmit,
  onBack,
}: CodeStepProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <NoticeBox tone="accent">
        {phone} 번호로 인증번호를 보냈습니다. 3분 이내에 입력해 주세요.
      </NoticeBox>

      <SectionCard title="인증번호 입력">
        <Field label="인증번호 6자리" error={error} hint="데모에서는 임의의 숫자 6자리를 입력하면 통과합니다.">
          <TextInput
            value={code}
            onChange={onChangeCode}
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
            numeric
          />
        </Field>
        <button
          type="button"
          onClick={onResend}
          className="mt-3 min-h-[44px] w-full rounded-xl border border-[#2A2C34] text-[13px] font-semibold text-[#9A9AA4]"
        >
          인증번호 재전송
        </button>
        {resendNotice ? (
          <p className="mt-2 text-center text-[11.5px] text-[#3DC98A]">{resendNotice}</p>
        ) : null}
      </SectionCard>

      <button type="button" onClick={onSubmit} className={PRIMARY_BUTTON}>
        인증 확인
      </button>
      <button type="button" onClick={onBack} className={GHOST_BUTTON}>
        정보 다시 입력
      </button>
    </div>
  );
}

/** 중복 본인확인 차단 화면 */
export function VerifyBlockedStep({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="rounded-2xl border border-[#F0654855] bg-[#F065481A] p-5 text-center">
        <p className="text-[16px] font-extrabold text-[#F06548]">이미 본인확인된 계정이 있습니다</p>
        <p className="mt-2 text-[12.5px] leading-relaxed text-[#E3B0A6]">
          동일한 명의로 이미 본인확인을 마친 계정이 있어 이 계정에서는 본인확인을 완료할 수 없습니다.
        </p>
      </div>

      <SectionCard title="왜 차단되나요?">
        <ul className={`flex flex-col gap-1.5 text-[12.5px] leading-relaxed ${MUTED}`}>
          <li>· 티켓 예매는 1인 1계정 원칙으로 운영됩니다.</li>
          <li>· 여러 계정으로 나눠 구매하는 행위를 막기 위해 명의 중복을 차단합니다.</li>
          <li>· 기존에 본인확인을 마친 계정으로 로그인해 예매를 진행해 주세요.</li>
        </ul>
      </SectionCard>

      <button type="button" className={PRIMARY_BUTTON}>
        고객센터 문의
      </button>
      <button type="button" onClick={onRetry} className={GHOST_BUTTON}>
        다른 정보로 다시 시도
      </button>
    </div>
  );
}

/** 본인확인 완료 화면 */
export function VerifyDoneStep({ realName, nextHref }: { realName: string; nextHref: string }) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#3DC98A55] bg-[#3DC98A14] px-5 py-9 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3DC98A] text-[#0F1014]">
          <CheckIcon className="h-7 w-7" />
        </span>
        <p className="text-[17px] font-extrabold text-[#3DC98A]">본인확인이 완료되었습니다</p>
        <p className="text-[12.5px] leading-relaxed text-[#9CC9B6]">
          {realName} 님 명의로 확인되었습니다. 이제 티켓을 예매할 수 있습니다.
        </p>
      </div>

      <Link href={nextHref} className={PRIMARY_BUTTON}>
        {nextHref === '/app' ? '홈으로 이동' : '예매 이어서 진행'}
      </Link>
    </div>
  );
}
