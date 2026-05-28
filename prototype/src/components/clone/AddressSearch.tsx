'use client';

import { useRef, useState } from 'react';
import { MapPinIcon } from '@heroicons/react/20/solid';
import { SAMPLE_PLACES } from '@/mock/feed';

// 구글 장소 검색 UX 목업 — 입력 시 샘플 장소 목록에서 부분 일치 제안.
// 실제 연동 시 Google Places Autocomplete로 대체.
interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function AddressSearch({ value, onChange, placeholder = '장소 검색 (예: 잠실 종합운동장)' }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = query.trim()
    ? SAMPLE_PLACES.filter((p) => p.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : [];

  const pick = (place: string) => {
    onChange(place);
    setQuery(place);
    setOpen(false);
  };

  return (
    <div className="relative">
      <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 150); }}
        placeholder={placeholder}
        className="w-full h-11 pl-9 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((p) => (
            <li key={p}>
              <button
                type="button"
                onMouseDown={() => { if (blurTimer.current) clearTimeout(blurTimer.current); }}
                onClick={() => pick(p)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50"
              >
                <MapPinIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{p}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
