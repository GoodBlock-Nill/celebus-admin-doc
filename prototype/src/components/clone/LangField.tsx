'use client';

/**
 * Quest 생성 모달과 동일한 다국어 입력 컴포넌트.
 * 단일 input/textarea + 언어 탭 전환 방식.
 * - 라벨 좌측 + 탭 우측 (justify-between)
 * - 빈 언어는 우상단 빨간 점으로 알림
 * - 글자수 카운터 우측
 */

export type Lang = 'KO' | 'EN' | 'JA';

export const LANGS: Lang[] = ['KO', 'EN', 'JA'];

interface LangValues {
  KO: string;
  EN: string;
  JA: string;
}

interface LangFieldProps {
  label: string;
  required?: boolean;
  lang: Lang;
  onLangChange: (l: Lang) => void;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  values: LangValues;
  disabled?: boolean;
}

export function LangTabs({
  active,
  onChange,
  values,
}: {
  active: Lang;
  onChange: (l: Lang) => void;
  values: LangValues;
}) {
  return (
    <div className="inline-flex bg-gray-50 rounded-lg p-0.5">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`relative px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
            active === l ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {l}
          {!values[l].trim() && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

export function LangField(p: LangFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-900">
          {p.label} {p.required && <span className="text-red-500">*</span>}
        </label>
        <LangTabs active={p.lang} onChange={p.onLangChange} values={p.values} />
      </div>
      <input
        type="text"
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        placeholder={p.placeholder}
        maxLength={p.maxLength}
        disabled={p.disabled}
        className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
      />
      <div className="text-right text-xs text-gray-400 mt-1">
        {p.value.length}{p.maxLength ? ` / ${p.maxLength}` : ''}
      </div>
    </div>
  );
}

export function LangTextarea(
  p: LangFieldProps & { rows?: number },
) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-900">
          {p.label} {p.required && <span className="text-red-500">*</span>}
        </label>
        <LangTabs active={p.lang} onChange={p.onLangChange} values={p.values} />
      </div>
      <textarea
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        rows={p.rows ?? 4}
        placeholder={p.placeholder}
        maxLength={p.maxLength}
        disabled={p.disabled}
        className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
      />
      <div className="text-right text-xs text-gray-400 mt-1">
        {p.value.length}{p.maxLength ? ` / ${p.maxLength}` : ''}
      </div>
    </div>
  );
}

export function isAllLangsFilled(values: LangValues): boolean {
  return values.KO.trim() !== '' && values.EN.trim() !== '' && values.JA.trim() !== '';
}
