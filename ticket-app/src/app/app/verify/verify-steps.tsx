'use client';

import Link from 'next/link';

import { CheckIcon, ShieldIcon } from '../_components/icons';
import { Field, TextInput } from '../_components/form-controls';
import { CollapsibleSection, NoticeBox, SectionCard } from '../_components/section';
import { GHOST_BUTTON, MUTED, PRIMARY_BUTTON } from '../_components/ui';
import {
  ProviderMark,
  ProviderSelector,
  findProvider,
  providerLabel,
  type AuthProviderKey,
} from './verify-providers';

/** 본인확인 시 수집하는 항목 고지 */
const COLLECTED_ITEMS = [
  '실명 — 예매자 확인 및 입금자명 대조',
  '생년월일 — 미성년자 관람 제한 확인',
  '휴대폰 번호 — 예매 안내 및 본인 연락',
  '중복가입확인정보 — 1인 1계정 확인(중복 예매 차단)',
];

const PROVIDER_NOTICE = '간편인증 사업자를 통해 본인확인이 진행됩니다.';

export interface IdentityForm {
  realName: string;
  birth: string;
  phone: string;
}

interface FormStepProps {
  form: IdentityForm;
  errors: Partial<Record<keyof IdentityForm, string>>;
  provider?: AuthProviderKey;
  onChange: (field: keyof IdentityForm, value: string) => void;
  onSelectProvider: (key: AuthProviderKey) => void;
  onSubmit: () => void;
}

/** 스텝 1 — 안내 + 인증 수단 선택 + 정보 입력 (공공 간편인증 표준창 순서) */
export function VerifyFormStep({
  form,
  errors,
  provider,
  onChange,
  onSelectProvider,
  onSubmit,
}: FormStepProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-start gap-3 rounded-2xl border border-[#2A2C34] bg-[#191A20] p-4">
        <ShieldIcon className="mt-0.5 h-6 w-6 shrink-0 text-[#F0426E]" />
        <div>
          <p className="text-[14px] font-bold">티켓 예매에는 최초 1회 간편인증 본인확인이 필요합니다.</p>
          <p className={`mt-1.5 text-[12.5px] leading-relaxed ${MUTED}`}>
            암표·부정 예매를 막기 위해 실명으로 확인된 계정만 예매할 수 있습니다. 확인된 정보는 예매 확인과
            입금자명 대조에만 사용됩니다.
          </p>
        </div>
      </div>

      {/* 공공 간편인증 표준창 관행에 따라 수단 선택을 정보 입력보다 먼저 배치 */}
      <SectionCard title="인증 수단 선택" description="사용 중인 간편인증 앱을 먼저 선택해 주세요.">
        <ProviderSelector selected={provider} onSelect={onSelectProvider} />
        {!provider ? (
          <p className={`mt-2.5 text-[11.5px] ${MUTED}`}>인증 수단을 선택한 뒤 본인 정보를 입력해 주세요.</p>
        ) : null}
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

      {/* 첫 화면 부담을 줄이기 위해 고지 항목은 접어 두고, 필요할 때 펼쳐 보게 한다. */}
      <CollapsibleSection title="수집 항목 안내 보기">
        <ul className="flex flex-col gap-1.5">
          {[...COLLECTED_ITEMS, PROVIDER_NOTICE].map((item) => (
            <li key={item} className="flex gap-1.5">
              <span aria-hidden="true">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      <button type="button" disabled={!provider} onClick={onSubmit} className={PRIMARY_BUTTON}>
        간편인증 요청
      </button>
    </div>
  );
}

interface RequestStepProps {
  provider: AuthProviderKey;
  realName: string;
  phone: string;
  busy: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

/** 스텝 2 — 간편인증 앱 요청 후 완료 확인 */
export function VerifyRequestStep({ provider, realName, phone, busy, onSubmit, onBack }: RequestStepProps) {
  const selected = findProvider(provider);
  const label = providerLabel(provider);

  return (
    <div className="flex flex-col gap-3.5">
      <NoticeBox tone="accent">
        {label} 앱으로 인증 요청을 보냈습니다. 인증을 완료한 뒤 아래 버튼을 눌러 주세요.
      </NoticeBox>

      <SectionCard title="인증 요청 정보">
        {/* 수단 선택 화면과 같은 브랜드 톤을 이어 붙여 어떤 수단으로 요청했는지 한눈에 보이게 한다. */}
        <div className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${selected.selectedClass}`}>
          <ProviderMark provider={selected} size="lg" />
          <div className="min-w-0">
            <p className={`text-[13px] font-extrabold ${selected.toneClass}`}>{label} 간편인증</p>
            <p className="mt-0.5 text-[12.5px] font-semibold text-[#F1F0EC]">
              {realName} · {phone}
            </p>
          </div>
        </div>
        <p className={`mt-3 text-[12px] leading-relaxed ${MUTED}`}>
          {label} 앱의 인증 요청 알림을 확인하고 인증을 완료해 주세요. 요청은 5분간 유효합니다.
        </p>
      </SectionCard>

      <button type="button" disabled={busy} onClick={onSubmit} className={PRIMARY_BUTTON}>
        {busy ? '확인 중…' : '인증 완료 확인'}
      </button>
      <button type="button" disabled={busy} onClick={onBack} className={GHOST_BUTTON}>
        다른 수단으로 인증
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
