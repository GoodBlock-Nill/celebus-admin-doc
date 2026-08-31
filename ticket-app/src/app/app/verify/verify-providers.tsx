'use client';

/** 간편인증 수단 — 실제 연동 없이 모의로 동작한다. */
export const AUTH_PROVIDERS = [
  { key: 'PASS', label: 'PASS', initial: 'P', markClass: 'bg-[#E8462E] text-white' },
  { key: 'KAKAO', label: '카카오', initial: '카', markClass: 'bg-[#FEE500] text-[#191A20]' },
  { key: 'TOSS', label: '토스', initial: '토', markClass: 'bg-[#3182F6] text-white' },
  { key: 'NAVER', label: '네이버', initial: 'N', markClass: 'bg-[#03C75A] text-white' },
] as const;

export type AuthProviderKey = (typeof AUTH_PROVIDERS)[number]['key'];

type AuthProvider = (typeof AUTH_PROVIDERS)[number];

/** 선택된 인증 수단 정보 */
export function findProvider(key: AuthProviderKey): AuthProvider {
  return AUTH_PROVIDERS.find((provider) => provider.key === key) ?? AUTH_PROVIDERS[0];
}

/** 인증 수단 표기 (예: 카카오) */
export function providerLabel(key: AuthProviderKey): string {
  return findProvider(key).label;
}

/** 원형 이니셜 마크 */
export function ProviderMark({
  provider,
  size = 'md',
}: {
  provider: AuthProvider;
  size?: 'md' | 'lg';
}) {
  const sizeClass = size === 'lg' ? 'h-11 w-11 text-[16px]' : 'h-8 w-8 text-[13px]';
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-extrabold ${sizeClass} ${provider.markClass}`}
    >
      {provider.initial}
    </span>
  );
}

interface ProviderSelectorProps {
  selected?: AuthProviderKey;
  onSelect: (key: AuthProviderKey) => void;
}

/** 2×2 간편인증 수단 선택 */
export function ProviderSelector({ selected, onSelect }: ProviderSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {AUTH_PROVIDERS.map((provider) => {
        const isSelected = provider.key === selected;
        return (
          <button
            key={provider.key}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(provider.key)}
            className={`flex min-h-[56px] items-center gap-2.5 rounded-xl border px-3 text-[13.5px] font-semibold transition ${
              isSelected
                ? 'border-[#F0426E] bg-[#F0426E1A] text-[#F1F0EC]'
                : 'border-[#2A2C34] bg-[#20222A] text-[#C9C8CE]'
            }`}
          >
            <ProviderMark provider={provider} />
            <span className="flex-1 text-left">{provider.label}</span>
            <span
              className={`h-4 w-4 shrink-0 rounded-full border ${
                isSelected ? 'border-[#F0426E] bg-[#F0426E]' : 'border-[#3A3C46]'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
