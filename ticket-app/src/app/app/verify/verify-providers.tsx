'use client';

import { CheckIcon } from '../_components/icons';

/**
 * 간편인증 수단 — 실제 연동 없이 모의로 동작한다.
 *
 * 원형 마크는 각 수단의 브랜드 색을 그대로 쓰고, 선택 상태는 같은 브랜드 색의
 * 옅은 배경으로 표시한다.
 */
export const AUTH_PROVIDERS = [
  {
    key: 'KAKAO',
    label: '카카오',
    initial: '카',
    markClass: 'bg-[#FEE500] text-[#3C1E1E]',
    selectedClass: 'border-[#F2CE00] bg-[#FFFBE6]',
    toneClass: 'text-[#7A6100]',
  },
  {
    key: 'TOSS',
    label: '토스',
    initial: '토',
    markClass: 'bg-[#0064FF] text-white',
    selectedClass: 'border-[#0064FF] bg-[#EFF5FF]',
    toneClass: 'text-[#0052D4]',
  },
  {
    key: 'NAVER',
    label: '네이버',
    initial: 'N',
    markClass: 'bg-[#03C75A] text-white',
    selectedClass: 'border-[#03C75A] bg-[#EDFBF2]',
    toneClass: 'text-[#028A3F]',
  },
] as const;

export type AuthProviderKey = (typeof AUTH_PROVIDERS)[number]['key'];

export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

/** 선택된 인증 수단 정보 */
export function findProvider(key: AuthProviderKey): AuthProvider {
  return AUTH_PROVIDERS.find((provider) => provider.key === key) ?? AUTH_PROVIDERS[0];
}

/** 인증 수단 표기 (예: 카카오) */
export function providerLabel(key: AuthProviderKey): string {
  return findProvider(key).label;
}

/** 원형 브랜드 마크 */
export function ProviderMark({
  provider,
  size = 'md',
}: {
  provider: AuthProvider;
  size?: 'md' | 'lg';
}) {
  const sizeClass = size === 'lg' ? 'h-11 w-11 text-[16px]' : 'h-9 w-9 text-[14px]';
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-extrabold ${sizeClass} ${provider.markClass}`}
    >
      {provider.initial}
    </span>
  );
}

/** 선택 표시 — 미선택은 빈 원, 선택은 브랜드 색 체크 */
function SelectIndicator({ provider, selected }: { provider: AuthProvider; selected: boolean }) {
  if (!selected) {
    return <span aria-hidden="true" className="h-5 w-5 shrink-0 rounded-full border border-[#D1D6DB]" />;
  }
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${provider.markClass}`}
    >
      <CheckIcon className="h-3.5 w-3.5" />
    </span>
  );
}

interface ProviderSelectorProps {
  selected?: AuthProviderKey;
  onSelect: (key: AuthProviderKey) => void;
}

/** 세로 목록형 간편인증 수단 선택 — 선택한 수단은 브랜드 색으로 강조된다. */
export function ProviderSelector({ selected, onSelect }: ProviderSelectorProps) {
  return (
    <div role="radiogroup" aria-label="간편인증 수단" className="flex flex-col gap-2.5">
      {AUTH_PROVIDERS.map((provider) => {
        const isSelected = provider.key === selected;
        return (
          <button
            key={provider.key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(provider.key)}
            className={`flex min-h-[56px] w-full items-center gap-3 rounded-xl border px-3.5 text-[15px] font-semibold transition ${
              isSelected
                ? `${provider.selectedClass} text-[#191F28]`
                : 'border-[#E5E8EB] bg-white text-[#4E5968]'
            }`}
          >
            <ProviderMark provider={provider} />
            <span className="flex-1 text-left">{provider.label}</span>
            <SelectIndicator provider={provider} selected={isSelected} />
          </button>
        );
      })}
    </div>
  );
}
