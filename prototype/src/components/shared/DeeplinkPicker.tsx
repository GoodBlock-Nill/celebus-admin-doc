'use client';

import { ChevronUpDownIcon } from '@heroicons/react/24/outline';
import {
  DEEPLINK_SOURCE_META,
  DEEPLINK_SOURCES,
  type Deeplink,
  type DeeplinkSourceType,
} from '@/types/deeplink';

interface Props {
  value: Deeplink;
  onChange: (v: Deeplink) => void;
  disabled?: boolean;
  /** 컴팩트 모드: 한 줄로 노출 (배너 폼 등 좁은 영역) */
  compact?: boolean;
}

export default function DeeplinkPicker({ value, onChange, disabled = false, compact = false }: Props) {
  const meta = DEEPLINK_SOURCE_META[value.source];
  const isNone = value.source === 'NONE';

  const setSource = (source: DeeplinkSourceType) => {
    // 소스 변경 시 NONE이면 값 초기화
    onChange({ source, value: source === 'NONE' ? '' : value.value });
  };

  const setValue = (v: string) => onChange({ source: value.source, value: v });

  if (compact) {
    return (
      <div className="flex gap-3">
        <SourceSelect value={value.source} onChange={setSource} disabled={disabled} minWidth="160px" />
        <input
          disabled={disabled || isNone}
          value={value.value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={meta.placeholder}
          className="flex-1 h-10 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SourceSelect value={value.source} onChange={setSource} disabled={disabled} minWidth="200px" />
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{meta.hint}</label>
        <input
          disabled={disabled || isNone}
          value={value.value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={meta.placeholder}
          className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
        />
      </div>
    </div>
  );
}

function SourceSelect({
  value,
  onChange,
  disabled,
  minWidth,
}: {
  value: DeeplinkSourceType;
  onChange: (v: DeeplinkSourceType) => void;
  disabled?: boolean;
  minWidth: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as DeeplinkSourceType)}
        style={{ minWidth }}
        className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer disabled:bg-gray-50"
      >
        {DEEPLINK_SOURCES.map((s) => (
          <option key={s} value={s}>
            {DEEPLINK_SOURCE_META[s].label}
          </option>
        ))}
      </select>
      <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
