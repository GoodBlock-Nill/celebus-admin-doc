'use client';

import { useRef, useState } from 'react';
import { MapPinIcon } from '@heroicons/react/20/solid';
import { SAMPLE_PLACES } from '@/mock/feed';

// 구글 장소 검색 UX 목업 — 입력은 검색어일 뿐이며, 장소명은 제안 목록에서 "선택"해야 확정된다.
// (운영자가 임의 텍스트로 직접 입력하지 않고, 구글에 등록된 장소명을 그대로 사용)
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
        // 타이핑은 검색어일 뿐 — 장소는 제안 선택(pick) 시에만 확정. 단, 비우면 선택 해제로 처리.
        onChange={(e) => { setQuery(e.target.value); if (e.target.value === '') onChange(''); setOpen(true); }}
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
