'use client';

import { useState } from 'react';
import { PhotoIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { LangField, LangTextarea, type Lang } from '@/components/clone/LangField';
import { RAFFLE_MINTING_EVENTS, type Raffle, type RaffleDeliveryType, type RafflePrizeUnit } from '@/mock/fanquest';

const DELIVERY_OPTIONS: RaffleDeliveryType[] = ['현장 수령', '배송 수령'];
const ARTIST_OPTIONS = ['V01D', 'iKON', 'CELEBUS'] as const;

export type RaffleFormValues = {
  artist: string;
  endDate: string;
  endTime: string;
  imageUrl: string;
  titleKO: string;
  titleEN: string;
  titleJA: string;
  descKO: string;
  descEN: string;
  descJA: string;
  winnerCount: number;
  deliveryType: RaffleDeliveryType;
  prizeUnit: RafflePrizeUnit;
  prizeKO: string;
  prizeEN: string;
  prizeJA: string;
  // 현장 수령 전용
  pickupStartDt: string;
  pickupEndDt: string;
  openTime: string;
  closeTime: string;
  locationKO: string;
  locationEN: string;
  locationJA: string;
  itemsKO: string;
  itemsEN: string;
  itemsJA: string;
  // 배송 수령 전용
  deliveryDeadlineDt: string;
  deliveryDeadlineTime: string;
  deliveryFormUrl: string;
  // 공통 유의사항
  noticeKO: string;
  noticeEN: string;
  noticeJA: string;
  /** v2.2 — 추가 보상: 당첨자에게 자동 민팅되는 BIVE NFT */
  biveRewardYn: boolean;
  mintingEventId: number | null;
};

export const EMPTY_RAFFLE_FORM: RaffleFormValues = {
  artist: '',
  endDate: '',
  endTime: '23:59',
  imageUrl: '',
  titleKO: '', titleEN: '', titleJA: '',
  descKO: '', descEN: '', descJA: '',
  winnerCount: 1,
  deliveryType: '현장 수령',
  prizeUnit: '장',
  prizeKO: '', prizeEN: '', prizeJA: '',
  pickupStartDt: '', pickupEndDt: '', openTime: '09:00', closeTime: '18:00',
  locationKO: '', locationEN: '', locationJA: '',
  itemsKO: '', itemsEN: '', itemsJA: '',
  deliveryDeadlineDt: '', deliveryDeadlineTime: '23:59', deliveryFormUrl: '',
  noticeKO: '', noticeEN: '', noticeJA: '',
  biveRewardYn: false,
  mintingEventId: null,
};

export function raffleToForm(r: Raffle): RaffleFormValues {
  const [date, time] = r.endAt.split(' ');
  return {
    artist: r.artist,
    endDate: date ?? '',
    endTime: time ?? '23:59',
    imageUrl: r.imageUrl,
    titleKO: r.titleKO, titleEN: r.titleEN, titleJA: r.titleJA,
    descKO: r.descKO, descEN: r.descEN, descJA: r.descJA,
    winnerCount: r.winnerCount,
    deliveryType: r.deliveryType,
    prizeUnit: r.prizeUnit,
    prizeKO: r.prizeKO, prizeEN: r.prizeEN, prizeJA: r.prizeJA,
    pickupStartDt: r.pickup.startDt ?? '',
    pickupEndDt: r.pickup.endDt ?? '',
    openTime: r.pickup.openTime ?? '09:00',
    closeTime: r.pickup.closeTime ?? '18:00',
    locationKO: r.pickup.locationKO ?? '', locationEN: r.pickup.locationEN ?? '', locationJA: r.pickup.locationJA ?? '',
    itemsKO: r.pickup.itemsKO ?? '', itemsEN: r.pickup.itemsEN ?? '', itemsJA: r.pickup.itemsJA ?? '',
    deliveryDeadlineDt: r.pickup.deliveryDeadlineDt ?? '',
    deliveryDeadlineTime: r.pickup.deliveryDeadlineTime ?? '23:59',
    deliveryFormUrl: r.pickup.deliveryFormUrl ?? '',
    noticeKO: r.noticeKO, noticeEN: r.noticeEN, noticeJA: r.noticeJA,
    biveRewardYn: r.biveRewardYn,
    mintingEventId: r.mintingEventId,
  };
}

/**
 * 임시저장 저장 가능 조건.
 * 다국어 필드는 한국어/영어/일본어 중 1개 언어 이상 입력이면 통과.
 * 수령 가이드는 deliveryType별로 분기 검증 (현장 수령 vs 배송 수령).
 * 게시 시점에는 별도로 3개 언어 모두 검증 (래플 상세에서 처리).
 */
export function canSubmitRaffle(v: RaffleFormValues): boolean {
  const biveValid = !v.biveRewardYn || v.mintingEventId !== null;
  const anyLang = (ko: string, en: string, ja: string) =>
    ko.trim() !== '' || en.trim() !== '' || ja.trim() !== '';
  const pickupValid = v.deliveryType === '배송 수령'
    ? Boolean(v.deliveryDeadlineDt && v.deliveryDeadlineTime && v.deliveryFormUrl.trim())
    : Boolean(
        v.pickupStartDt &&
        v.pickupEndDt &&
        v.openTime &&
        v.closeTime &&
        anyLang(v.locationKO, v.locationEN, v.locationJA) &&
        anyLang(v.itemsKO, v.itemsEN, v.itemsJA),
      );
  return Boolean(
    v.artist &&
    v.endDate &&
    v.imageUrl.trim() &&
    anyLang(v.titleKO, v.titleEN, v.titleJA) &&
    anyLang(v.descKO, v.descEN, v.descJA) &&
    v.winnerCount > 0 &&
    anyLang(v.prizeKO, v.prizeEN, v.prizeJA) &&
    pickupValid &&
    anyLang(v.noticeKO, v.noticeEN, v.noticeJA) &&
    biveValid,
  );
}

interface Props {
  values: RaffleFormValues;
  onChange: (next: RaffleFormValues) => void;
  /** Active 상태 수정 시 일부 필드 잠금 (아티스트/마감일/당첨수/배송타입) */
  activeLocks?: boolean;
  closedReadonly?: boolean;
}

export default function RaffleForm({ values, onChange, activeLocks = false, closedReadonly = false }: Props) {
  const [titleLang, setTitleLang] = useState<Lang>('KO');
  const [descLang, setDescLang] = useState<Lang>('KO');
  const [prizeLang, setPrizeLang] = useState<Lang>('KO');
  const [locationLang, setLocationLang] = useState<Lang>('KO');
  const [itemsLang, setItemsLang] = useState<Lang>('KO');
  const [noticeLang, setNoticeLang] = useState<Lang>('KO');

  const set = <K extends keyof RaffleFormValues>(k: K, v: RaffleFormValues[K]) =>
    onChange({ ...values, [k]: v });

  const lockedByActive = activeLocks || closedReadonly;
  const lockedFull = closedReadonly;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* 좌 — Raffle 정보 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Raffle 정보</h3>

        <div className="space-y-5">
          <Field label="아티스트" required>
            <select
              value={values.artist}
              onChange={(e) => set('artist', e.target.value)}
              disabled={lockedByActive}
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm bg-white disabled:bg-gray-50"
            >
              <option value="">아티스트 선택</option>
              {ARTIST_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>

          <Field label="마감일시" required>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={values.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                disabled={lockedByActive}
                className="h-11 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
              />
              <input
                type="time"
                value={values.endTime}
                onChange={(e) => set('endTime', e.target.value)}
                disabled={lockedByActive}
                className="h-11 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
              />
            </div>
          </Field>

          <Field label="대표 이미지" required>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center bg-gray-50">
              <PhotoIcon className="w-8 h-8 mx-auto text-gray-400 mb-1" />
              <div className="text-xs text-gray-600 mb-1.5">클릭하거나 파일을 드래그하세요</div>
              <p className="text-[10px] text-gray-400">권장: 686×332px (약 2:1) · jpeg, png, jpg, webp, gif, svg (최대 5MB)</p>
              {values.imageUrl && (
                <p className="mt-2 text-[10px] text-gray-500 truncate">현재 파일: {values.imageUrl}</p>
              )}
            </div>
          </Field>

          <LangField
            label="타이틀" required
            lang={titleLang} onLangChange={setTitleLang}
            value={values[`title${titleLang}` as const]}
            onChange={(v) => set(`title${titleLang}` as keyof RaffleFormValues, v as never)}
            placeholder="타이틀을 입력하세요"
            maxLength={100}
            values={{ KO: values.titleKO, EN: values.titleEN, JA: values.titleJA }}
            disabled={lockedFull}
          />

          <LangTextarea
            label="설명" required
            lang={descLang} onLangChange={setDescLang}
            value={values[`desc${descLang}` as const]}
            onChange={(v) => set(`desc${descLang}` as keyof RaffleFormValues, v as never)}
            placeholder="설명을 입력하세요"
            maxLength={200}
            rows={4}
            values={{ KO: values.descKO, EN: values.descEN, JA: values.descJA }}
            disabled={lockedFull}
          />
        </div>
      </div>

      {/* 중 — 보상 기본 설정 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">보상 기본 설정</h3>

        <div className="space-y-5">
          <Field label="당첨 추첨 수" required>
            <input
              type="number"
              min={1}
              value={values.winnerCount}
              onChange={(e) => set('winnerCount', Math.max(1, parseInt(e.target.value || '1', 10)))}
              disabled={lockedByActive}
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
            />
          </Field>

          <Field label="보상지급 타입" required>
            <select
              value={values.deliveryType}
              onChange={(e) => set('deliveryType', e.target.value as RaffleDeliveryType)}
              disabled={lockedByActive}
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm bg-white disabled:bg-gray-50"
            >
              {DELIVERY_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              보상 상세 <span className="text-red-500">*</span>
            </label>
            <div className="text-xs text-gray-500 mb-2">경품 단위</div>
            <div className="inline-flex bg-gray-50 rounded-lg p-0.5 mb-3">
              {(['장', '개'] as RafflePrizeUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => !lockedFull && set('prizeUnit', u)}
                  disabled={lockedFull}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md ${
                    values.prizeUnit === u ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >{u}</button>
              ))}
            </div>
            <div className="text-xs text-gray-500 mb-2">경품 내역</div>
            <LangTextarea
              label=""
              lang={prizeLang} onLangChange={setPrizeLang}
              value={values[`prize${prizeLang}` as const]}
              onChange={(v) => set(`prize${prizeLang}` as keyof RaffleFormValues, v as never)}
              placeholder="경품 내역을 입력하세요"
              maxLength={50}
              rows={2}
              values={{ KO: values.prizeKO, EN: values.prizeEN, JA: values.prizeJA }}
              disabled={lockedFull}
            />
          </div>

          {/* v2.2 — 추가 보상 설정 (BIVE) */}
          <div className="border-t border-gray-100 pt-4 mt-1">
            <div className="flex items-center gap-1.5 mb-3">
              <SparklesIcon className="w-4 h-4 text-indigo-500" />
              <h4 className="text-sm font-semibold text-gray-900">추가 보상 설정</h4>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={values.biveRewardYn}
                onChange={(e) => {
                  const on = e.target.checked;
                  onChange({ ...values, biveRewardYn: on, mintingEventId: on ? values.mintingEventId : null });
                }}
                disabled={lockedByActive}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
              />
              <span className="text-sm text-gray-900">BIVE 보상 지급</span>
            </label>

            <div className={`mt-3 transition-opacity ${values.biveRewardYn ? 'opacity-100' : 'opacity-50'}`}>
              <label className="block text-xs text-gray-500 mb-1.5">민팅 이벤트</label>
              <select
                value={values.mintingEventId ?? ''}
                onChange={(e) => set('mintingEventId', e.target.value ? parseInt(e.target.value, 10) : null)}
                disabled={!values.biveRewardYn || lockedByActive}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                <option value="">민팅 이벤트 선택...</option>
                {RAFFLE_MINTING_EVENTS.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
              <p className="mt-2 text-[11px] text-indigo-700 bg-indigo-50 rounded px-2.5 py-1.5 leading-relaxed">
                추첨 확정 시 <strong>당첨자에게 BIVE NFT가 자동 민팅</strong>됩니다. 경품과 함께 지급됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 우 — 수령 가이드 및 유의사항 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">수령 가이드 및 유의사항</h3>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {values.deliveryType === '배송 수령' ? '배송 가이드' : '수령 가이드'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              {values.deliveryType === '배송 수령' ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">배송지 입력 마감일</div>
                      <input type="date" value={values.deliveryDeadlineDt} onChange={(e) => set('deliveryDeadlineDt', e.target.value)} disabled={lockedFull}
                        className="w-full h-10 px-2 border border-gray-200 rounded-md text-xs disabled:bg-gray-50" />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">배송지 입력 마감 시간</div>
                      <input type="time" value={values.deliveryDeadlineTime} onChange={(e) => set('deliveryDeadlineTime', e.target.value)} disabled={lockedFull}
                        className="w-full h-10 px-2 border border-gray-200 rounded-md text-xs disabled:bg-gray-50" />
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 mb-1">배송지 입력 폼 URL</div>
                    <input type="url" value={values.deliveryFormUrl} onChange={(e) => set('deliveryFormUrl', e.target.value)} disabled={lockedFull}
                      placeholder="https://"
                      className="w-full h-10 px-2 border border-gray-200 rounded-md text-xs disabled:bg-gray-50" />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">수령 시작일</div>
                      <input type="date" value={values.pickupStartDt} onChange={(e) => set('pickupStartDt', e.target.value)} disabled={lockedFull}
                        className="w-full h-10 px-2 border border-gray-200 rounded-md text-xs disabled:bg-gray-50" />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">수령 마감일</div>
                      <input type="date" value={values.pickupEndDt} onChange={(e) => set('pickupEndDt', e.target.value)} disabled={lockedFull}
                        className="w-full h-10 px-2 border border-gray-200 rounded-md text-xs disabled:bg-gray-50" />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">운영 시작 시간</div>
                      <input type="time" value={values.openTime} onChange={(e) => set('openTime', e.target.value)} disabled={lockedFull}
                        className="w-full h-10 px-2 border border-gray-200 rounded-md text-xs disabled:bg-gray-50" />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">운영 마감 시간</div>
                      <input type="time" value={values.closeTime} onChange={(e) => set('closeTime', e.target.value)} disabled={lockedFull}
                        className="w-full h-10 px-2 border border-gray-200 rounded-md text-xs disabled:bg-gray-50" />
                    </div>
                  </div>
                  <LangField
                    label="수령 장소"
                    lang={locationLang} onLangChange={setLocationLang}
                    value={values[`location${locationLang}` as const]}
                    onChange={(v) => set(`location${locationLang}` as keyof RaffleFormValues, v as never)}
                    placeholder="수령 장소를 입력하세요"
                    maxLength={100}
                    values={{ KO: values.locationKO, EN: values.locationEN, JA: values.locationJA }}
                    disabled={lockedFull}
                  />
                  <LangField
                    label="지참물"
                    lang={itemsLang} onLangChange={setItemsLang}
                    value={values[`items${itemsLang}` as const]}
                    onChange={(v) => set(`items${itemsLang}` as keyof RaffleFormValues, v as never)}
                    placeholder="지참물을 입력하세요"
                    maxLength={50}
                    values={{ KO: values.itemsKO, EN: values.itemsEN, JA: values.itemsJA }}
                    disabled={lockedFull}
                  />
                </>
              )}
            </div>
          </div>

          <LangTextarea
            label="유의사항" required
            lang={noticeLang} onLangChange={setNoticeLang}
            value={values[`notice${noticeLang}` as const]}
            onChange={(v) => set(`notice${noticeLang}` as keyof RaffleFormValues, v as never)}
            placeholder="유의사항을 입력하세요"
            maxLength={500}
            rows={6}
            values={{ KO: values.noticeKO, EN: values.noticeEN, JA: values.noticeJA }}
            disabled={lockedFull}
          />
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
