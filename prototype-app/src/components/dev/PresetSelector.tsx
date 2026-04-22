'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface PresetOption {
  key: string;
  label: string;
}

interface PresetSelectorProps {
  presets: PresetOption[];
  current: string;
  onSelect: (key: string) => void;
}

export default function PresetSelector({ presets, current, onSelect }: PresetSelectorProps) {
  const [open, setOpen] = useState(false);

  const currentLabel = presets.find((p) => p.key === current)?.label ?? current;

  return (
    <div className="fixed bottom-24 right-3 z-[90]">
      {/* 프리셋 옵션 목록 */}
      {open && (
        <>
          <div className="fixed inset-0 z-[89]" onClick={() => setOpen(false)} />
          <div className="relative z-[90] mb-2 flex flex-col gap-1.5 animate-slideInUp">
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  onSelect(p.key);
                  setOpen(false);
                }}
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
    </div>
  );
}
