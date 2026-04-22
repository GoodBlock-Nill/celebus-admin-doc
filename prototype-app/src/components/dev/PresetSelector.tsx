'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorFallback from '@/components/ui/ErrorFallback';

export interface PresetOption {
  key: string;
  label: string;
}

const BUILT_IN_PRESETS: PresetOption[] = [
  { key: '__loading__', label: '⏳ 로딩' },
  { key: '__error__', label: '❌ 에러' },
];

interface PresetSelectorProps {
  presets: PresetOption[];
  current: string;
  onSelect: (key: string) => void;
}

export default function PresetSelector({ presets, current, onSelect }: PresetSelectorProps) {
  const [open, setOpen] = useState(false);

  const allPresets = [...presets, ...BUILT_IN_PRESETS];
  const currentLabel = allPresets.find((p) => p.key === current)?.label ?? current;

  const handleSelect = (key: string) => {
    onSelect(key);
    setOpen(false);
  };

  return (
    <div className="fixed bottom-24 right-3 z-[90]">
      {/* 프리셋 옵션 목록 */}
      {open && (
        <>
          <div className="fixed inset-0 z-[89]" onClick={() => setOpen(false)} />
          <div className="relative z-[90] mb-2 flex flex-col gap-1.5 animate-slideInUp" role="menu">
            {allPresets.map((p) => (
              <button
                key={p.key}
                role="menuitem"
                onClick={() => handleSelect(p.key)}
                className={cn(
                  'px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold whitespace-nowrap transition-all',
                  p.key === current
                    ? 'bg-violet-600 text-white ring-2 ring-violet-300'
                    : 'bg-white border border-gray-200 text-gray-700 active:bg-violet-50'
                )}
              >
                {p.key === current && '✓ '}{p.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* 플로팅 토글 버튼 */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="프리셋 선택"
        className={cn(
          'px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 active:scale-95 transition-all',
          'bg-violet-600 text-white border-2 border-violet-400',
          'hover:bg-violet-700 hover:shadow-violet-500/30',
          open && 'bg-violet-800 border-violet-500'
        )}
      >
        <span className="text-sm">🎛️</span>
        <span className="text-xs font-bold">{currentLabel}</span>
        <span className="text-[10px]">{open ? '▼' : '▲'}</span>
      </button>

      {/* 로딩 오버레이 */}
      {current === '__loading__' && (
        <div className="fixed inset-0 z-[80] bg-white">
          <div className="px-4 pt-16 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
      )}

      {/* 에러 오버레이 */}
      {current === '__error__' && (
        <div className="fixed inset-0 z-[80] bg-white flex items-center justify-center">
          <ErrorFallback onRetry={() => onSelect(presets[0]?.key ?? 'default')} />
        </div>
      )}
    </div>
  );
}
