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
    <div className="fixed bottom-20 right-4 z-50">
      {open && (
        <div className="mb-2 flex flex-col gap-1.5 animate-slideInUp">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                onSelect(p.key);
                setOpen(false);
              }}
              className={cn(
                'px-3 py-2 rounded-xl shadow-md text-[10px] font-semibold whitespace-nowrap transition-colors',
                p.key === current
                  ? 'bg-violet-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 active:bg-gray-50'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2.5 rounded-full bg-gray-900 text-white shadow-lg flex items-center gap-1.5 active:scale-95 transition-transform"
      >
        <span className="text-[10px] font-semibold">{currentLabel}</span>
        <span className="text-[8px]">{open ? '▼' : '▲'}</span>
      </button>
    </div>
  );
}
