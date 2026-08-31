'use client';

import { useEffect, useState } from 'react';

import { Button, Field, TextInput } from '../../_components/form';
import { useToast } from '../../_components/toast';
import {
  MAX_VENUE_ADDRESS_LENGTH,
  MAX_VENUE_MAP_URL_LENGTH,
  type ConcertDraft,
  type ConcertField,
  type FieldErrors,
} from './concert-form-state';
import { adminApi } from '@/lib/admin-client';
import type { VenueSearchItemView } from '@/lib/admin-types';
import { naverMapUrl } from '@/lib/venue-map';

const MAX_VENUE_NAME_LENGTH = 60;

/** 검색 사용 가능 여부는 화면 진입 시 한 번 확인한다(검색 키가 없으면 직접 입력 모드). */
type VenueSearchMode = 'CHECKING' | 'SEARCHABLE' | 'MANUAL';

interface VenueFieldsProps {
  draft: ConcertDraft;
  errors: FieldErrors;
  onChange: (field: ConcertField, value: string) => void;
}

/** 공연장 이름 · 주소 · 지도 링크 입력 — 주소와 지도 링크는 선택 입력이다. */
export function VenueFields({ draft, errors, onChange }: VenueFieldsProps) {
  const toast = useToast();

  const [mode, setMode] = useState<VenueSearchMode>('CHECKING');
  const [items, setItems] = useState<VenueSearchItemView[]>([]);
  const [searching, setSearching] = useState(false);
  /** 지도 링크를 직접 고쳤는지 — 고친 뒤에는 주소 입력으로 덮어쓰지 않는다. */
  const [mapUrlEdited, setMapUrlEdited] = useState(false);

  useEffect(() => {
    let active = true;
    void adminApi.searchVenues('').then((result) => {
      if (active) setMode(result.ok ? 'SEARCHABLE' : 'MANUAL');
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = async () => {
    const keyword = draft.venue.trim();
    if (keyword === '') {
      toast.error('공연장 이름을 먼저 입력해 주세요.');
      return;
    }

    setSearching(true);
    const result = await adminApi.searchVenues(keyword);
    setSearching(false);

    if (!result.ok) {
      setItems([]);
      setMode('MANUAL');
      toast.error(result.reason);
      return;
    }

    setItems(result.data.items);
    if (result.data.items.length === 0) toast.info('검색 결과가 없습니다. 주소를 직접 입력해 주세요.');
  };

  const handleSelect = (item: VenueSearchItemView) => {
    onChange('venue', item.name.slice(0, MAX_VENUE_NAME_LENGTH));
    onChange('venueAddress', item.roadAddress || item.address);
    onChange('venueMapUrl', item.mapUrl);
    setMapUrlEdited(false);
    setItems([]);
    toast.success(`${item.name} 정보를 채웠습니다. 필요하면 수정해 주세요.`);
  };

  // 주소를 입력하면 지도 링크를 주소 기준으로 만들어 둔다(직접 고친 링크는 보존).
  const handleAddressChange = (value: string) => {
    onChange('venueAddress', value);
    if (!mapUrlEdited) onChange('venueMapUrl', naverMapUrl(value));
  };

  const handleMapUrlChange = (value: string) => {
    setMapUrlEdited(true);
    onChange('venueMapUrl', value);
  };

  return (
    <div className="flex flex-col gap-3 md:col-span-2">
      <div className="flex items-start gap-2">
        <Field label="공연장" required error={errors.venue} className="flex-1">
          <TextInput
            value={draft.venue}
            onChange={(event) => onChange('venue', event.target.value)}
            placeholder="예) 예스24 라이브홀"
            maxLength={MAX_VENUE_NAME_LENGTH}
          />
        </Field>
        {mode === 'SEARCHABLE' ? (
          <Button onClick={() => void handleSearch()} disabled={searching} className="mt-[26px]">
            {searching ? '검색 중…' : '네이버 지도 검색'}
          </Button>
        ) : null}
      </div>

      {items.length > 0 ? (
        <ul className="flex flex-col gap-1 rounded-lg border border-[#C9CDD6] bg-[#F8F9FB] p-2">
          {items.map((item) => (
            <li key={`${item.name}-${item.roadAddress || item.address}`}>
              <button
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full rounded-md px-3 py-2 text-left hover:bg-[#EDF1FD]"
              >
                <span className="block text-[13px] font-semibold text-[#1B1D22]">{item.name}</span>
                <span className="block text-[12px] text-[#6B7080]">
                  {item.roadAddress || item.address || '주소 정보 없음'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field
          label="공연장 주소"
          error={errors.venueAddress}
          hint={
            mode === 'MANUAL'
              ? '주소 직접 입력 — 입력하면 아래 지도 링크가 자동으로 만들어집니다. (선택 입력)'
              : '검색 결과를 고르면 자동으로 채워집니다. 직접 고쳐도 됩니다. (선택 입력)'
          }
        >
          <TextInput
            value={draft.venueAddress}
            onChange={(event) => handleAddressChange(event.target.value)}
            placeholder="예) 서울특별시 광진구 구의강변로 15"
            maxLength={MAX_VENUE_ADDRESS_LENGTH}
          />
        </Field>
        <Field
          label="지도 링크"
          error={errors.venueMapUrl}
          hint="앱 공연 상세에서 [네이버지도 보기]로 열립니다. (선택 입력)"
        >
          <TextInput
            value={draft.venueMapUrl}
            onChange={(event) => handleMapUrlChange(event.target.value)}
            placeholder="https://map.naver.com/p/search/..."
            maxLength={MAX_VENUE_MAP_URL_LENGTH}
          />
        </Field>
      </div>
    </div>
  );
}
