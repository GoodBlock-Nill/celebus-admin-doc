'use client';

import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { LangField, type Lang } from '@/components/clone/LangField';
import { RAFFLE_MINTING_EVENTS } from '@/mock/fanquest';
import type { DukLangText, DukPrizeType, DukRewardPrize } from '@/mock/duk';

// [CEB-BO-ART-401] v1.6 §2-1-E §E-5 — 보상 상품 5종 분기 입력 폼
// 종류: 배송 수령 / 현장 수령 / BIVE NFT / 응모권 / 덕력
// 상품명은 5종 공통 — LangField KO/EN/JP (래플 패턴 정합)

const PRIZE_TYPES: DukPrizeType[] = ['배송 수령', '현장 수령', 'BIVE NFT', '응모권', '덕력'];

interface Props {
  prize: DukRewardPrize;
  onChange: (next: DukRewardPrize) => void;
  onRemove: () => void;
  readonly?: boolean;
}

// 종류 변경 시 기본값 생성
function buildDefaultByType(id: number, type: DukPrizeType): DukRewardPrize {
  const emptyTitle: DukLangText = { ko: '', en: '', ja: '' };
  switch (type) {
    case '배송 수령':
      return { id, type, title: emptyTitle, deliveryDeadlineDt: '', deliveryDeadlineTime: '', deliveryFormUrl: '' };
    case '현장 수령':
      return {
        id, type, title: emptyTitle,
        pickupStartDt: '', pickupEndDt: '',
        openTime: '09:00', closeTime: '18:00',
        location: { ko: '', en: '', ja: '' },
        items: { ko: '', en: '', ja: '' },
      };
    case 'BIVE NFT':
      return { id, type, title: emptyTitle, mintingEventId: RAFFLE_MINTING_EVENTS[0].id };
    case '응모권':
      return { id, type, title: emptyTitle, count: 1 };
    case '덕력':
      return { id, type, title: emptyTitle, amount: 100 };
  }
}

export default function PrizeForm({ prize, onChange, onRemove, readonly }: Props) {
  const [titleLang, setTitleLang] = useState<Lang>('KO');
  const [locationLang, setLocationLang] = useState<Lang>('KO');
  const [itemsLang, setItemsLang] = useState<Lang>('KO');

  const titleValues = { KO: prize.title.ko, EN: prize.title.en, JA: prize.title.ja };
  const setTitle = (l: Lang, v: string) => {
    const next: DukLangText = { ...prize.title };
    if (l === 'KO') next.ko = v;
    else if (l === 'EN') next.en = v;
    else next.ja = v;
    onChange({ ...prize, title: next } as DukRewardPrize);
  };

  const handleTypeChange = (nextType: DukPrizeType) => {
    if (nextType === prize.type) return;
    onChange(buildDefaultByType(prize.id, nextType));
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      {/* 헤더 — 종류 Dropdown + 삭제 */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">상품 종류</span>
          <select
            value={prize.type}
            onChange={(e) => handleTypeChange(e.target.value as DukPrizeType)}
            disabled={readonly}
            className="h-9 px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
          >
            {PRIZE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        {!readonly && (
          <button
            onClick={onRemove}
            className="h-9 w-9 inline-flex items-center justify-center text-rose-500 bg-white border border-rose-200 rounded-lg hover:bg-rose-50"
            aria-label="상품 삭제"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 공통 — 상품명 (다국어) */}
      <div className="mb-4">
        <LangField
          label="상품명"
          required
          lang={titleLang}
          onLangChange={setTitleLang}
          value={titleValues[titleLang]}
          onChange={(v) => setTitle(titleLang, v)}
          values={titleValues}
          maxLength={50}
          placeholder="예: V01D 사인 앨범"
          disabled={readonly}
        />
      </div>

      {/* 종류별 분기 폼 */}
      {prize.type === '배송 수령' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">배송 마감일</label>
            <input
              type="date"
              value={prize.deliveryDeadlineDt}
              onChange={(e) => onChange({ ...prize, deliveryDeadlineDt: e.target.value })}
              disabled={readonly}
              className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">배송 마감 시간</label>
            <input
              type="time"
              value={prize.deliveryDeadlineTime}
              onChange={(e) => onChange({ ...prize, deliveryDeadlineTime: e.target.value })}
              disabled={readonly}
              className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">배송 폼 URL</label>
            <input
              type="url"
              value={prize.deliveryFormUrl}
              onChange={(e) => onChange({ ...prize, deliveryFormUrl: e.target.value })}
              placeholder="https://forms.gle/..."
              disabled={readonly}
              className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
            />
          </div>
        </div>
      )}

      {prize.type === '현장 수령' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">수령 시작일</label>
              <input
                type="date"
                value={prize.pickupStartDt}
                onChange={(e) => onChange({ ...prize, pickupStartDt: e.target.value })}
                disabled={readonly}
                className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">수령 종료일</label>
              <input
                type="date"
                value={prize.pickupEndDt}
                onChange={(e) => onChange({ ...prize, pickupEndDt: e.target.value })}
                disabled={readonly}
                className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">운영 시작 시간</label>
              <input
                type="time"
                value={prize.openTime}
                onChange={(e) => onChange({ ...prize, openTime: e.target.value })}
                disabled={readonly}
                className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">운영 종료 시간</label>
              <input
                type="time"
                value={prize.closeTime}
                onChange={(e) => onChange({ ...prize, closeTime: e.target.value })}
                disabled={readonly}
                className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
              />
            </div>
          </div>
          <LangField
            label="장소"
            required
            lang={locationLang}
            onLangChange={setLocationLang}
            value={prize.type === '현장 수령' ? { KO: prize.location.ko, EN: prize.location.en, JA: prize.location.ja }[locationLang] : ''}
            onChange={(v) => {
              if (prize.type !== '현장 수령') return;
              const next = { ...prize.location };
              if (locationLang === 'KO') next.ko = v;
              else if (locationLang === 'EN') next.en = v;
              else next.ja = v;
              onChange({ ...prize, location: next });
            }}
            values={{ KO: prize.location.ko, EN: prize.location.en, JA: prize.location.ja }}
            maxLength={100}
            placeholder="예: 서울시 강남구 도산대로 123"
            disabled={readonly}
          />
          <LangField
            label="지참물"
            required
            lang={itemsLang}
            onLangChange={setItemsLang}
            value={prize.type === '현장 수령' ? { KO: prize.items.ko, EN: prize.items.en, JA: prize.items.ja }[itemsLang] : ''}
            onChange={(v) => {
              if (prize.type !== '현장 수령') return;
              const next = { ...prize.items };
              if (itemsLang === 'KO') next.ko = v;
              else if (itemsLang === 'EN') next.en = v;
              else next.ja = v;
              onChange({ ...prize, items: next });
            }}
            values={{ KO: prize.items.ko, EN: prize.items.en, JA: prize.items.ja }}
            maxLength={50}
            placeholder="예: 신분증·티켓 QR"
            disabled={readonly}
          />
        </div>
      )}

      {prize.type === 'BIVE NFT' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">민팅 이벤트</label>
          <select
            value={prize.mintingEventId}
            onChange={(e) => onChange({ ...prize, mintingEventId: Number(e.target.value) })}
            disabled={readonly}
            className="h-10 w-full px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
          >
            {RAFFLE_MINTING_EVENTS.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
        </div>
      )}

      {prize.type === '응모권' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">수량 (장)</label>
          <input
            type="number"
            min={1}
            value={prize.count}
            onChange={(e) => onChange({ ...prize, count: Number(e.target.value) })}
            disabled={readonly}
            className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
          />
        </div>
      )}

      {prize.type === '덕력' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">수량 (DUK)</label>
          <input
            type="number"
            min={1}
            value={prize.amount}
            onChange={(e) => onChange({ ...prize, amount: Number(e.target.value) })}
            disabled={readonly}
            className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
          />
        </div>
      )}
    </div>
  );
}

// 상품 1건 요약 (잠금 모드 — 정산 완료 월 조회용)
export function PrizeSummary({ prize }: { prize: DukRewardPrize }) {
  const titleKo = prize.title.ko || '(상품명 없음)';
  let detail = '';
  if (prize.type === '배송 수령') detail = `배송 마감 ${prize.deliveryDeadlineDt} ${prize.deliveryDeadlineTime}`;
  else if (prize.type === '현장 수령') detail = `현장 수령 ${prize.pickupStartDt}~${prize.pickupEndDt}`;
  else if (prize.type === 'BIVE NFT') {
    const ev = RAFFLE_MINTING_EVENTS.find((e) => e.id === prize.mintingEventId);
    detail = `민팅: ${ev?.name ?? '-'}`;
  } else if (prize.type === '응모권') detail = `${prize.count}장`;
  else if (prize.type === '덕력') detail = `${prize.amount.toLocaleString()} DUK`;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
        {prize.type}
      </span>
      <span className="font-medium text-gray-800">{titleKo}</span>
      <span className="text-xs text-gray-500">· {detail}</span>
    </div>
  );
}
