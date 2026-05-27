'use client';

import { useRef, useState } from 'react';
import { LockClosedIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from '@/components/ui/Toast';
import type { DukLangText, DukRewardPrize, DukRewardTargetType, DukRewardTier } from '@/mock/duk';
import PrizeForm, { PrizeSummary } from './PrizeForm';

// [CEB-BO-ART-401] v1.6 §2-1-E §E-4 — 월별 보상 폼
// - 정산 완료 월: 잠금 (조회만 — PrizeSummary 사용)
// - 미정산 월: 1구간 = 복수 상품 nested 구조 + PrizeForm 5종 분기

interface Props {
  yearMonth: string; // YYYY.MM
  initialTiers: DukRewardTier[];
  isLocked: boolean;
  settledAt?: string;
}

const TARGET_TYPES: DukRewardTargetType[] = ['등수', '퍼센트', '등수범위'];

function emptyTitle(): DukLangText {
  return { ko: '', en: '', ja: '' };
}

function isLangFilled(t: DukLangText): boolean {
  return t.ko.trim() !== '' && t.en.trim() !== '' && t.ja.trim() !== '';
}

function validateTargetValue(tier: DukRewardTier): string | null {
  if (!tier.targetValue.trim()) return '대상 값을 입력하세요';
  if (tier.targetType === '등수') {
    if (!/^\d+$/.test(tier.targetValue) || Number(tier.targetValue) < 1) return '등수는 양의 정수';
  } else if (tier.targetType === '퍼센트') {
    const n = Number(tier.targetValue);
    if (!/^\d+$/.test(tier.targetValue) || n < 1 || n > 100) return '퍼센트는 1~100';
  } else if (tier.targetType === '등수범위') {
    const m = tier.targetValue.match(/^(\d+)-(\d+)$/);
    if (!m || Number(m[1]) >= Number(m[2])) return '등수범위 형식: N-M (N<M)';
  }
  return null;
}

function validatePrize(p: DukRewardPrize): string | null {
  if (!isLangFilled(p.title)) return '상품명 KO/EN/JP 모두 입력';
  if (p.type === '배송 수령') {
    if (!p.deliveryDeadlineDt || !p.deliveryDeadlineTime) return '배송 마감일·시간 필수';
    if (!p.deliveryFormUrl.trim()) return '배송 폼 URL 필수';
  } else if (p.type === '현장 수령') {
    if (!p.pickupStartDt || !p.pickupEndDt) return '수령 시작·종료일 필수';
    if (p.pickupStartDt > p.pickupEndDt) return '시작일 ≤ 종료일';
    if (!p.openTime || !p.closeTime) return '운영 시간 필수';
    if (!isLangFilled(p.location)) return '장소 KO/EN/JP 모두 입력';
    if (!isLangFilled(p.items)) return '지참물 KO/EN/JP 모두 입력';
  } else if (p.type === '응모권') {
    if (!Number.isFinite(p.count) || p.count < 1) return '응모권 수량 양의 정수';
  } else if (p.type === '덕력') {
    if (!Number.isFinite(p.amount) || p.amount < 1) return '덕력 수량 양의 정수';
  }
  return null;
}

export default function MonthRewardForm({ yearMonth, initialTiers, isLocked, settledAt }: Props) {
  const [tiers, setTiers] = useState<DukRewardTier[]>(initialTiers);
  const nextLocalIdRef = useRef(-1);
  const nextPrize = () => nextLocalIdRef.current--;

  const addTier = () => {
    setTiers((prev) => [
      ...prev,
      { id: nextPrize(), targetType: '등수', targetValue: '', prizes: [] },
    ]);
  };

  const removeTier = (tierId: number) => {
    setTiers((prev) => prev.filter((t) => t.id !== tierId));
  };

  const updateTier = (tierId: number, patch: Partial<DukRewardTier>) => {
    setTiers((prev) => prev.map((t) => (t.id === tierId ? { ...t, ...patch } : t)));
  };

  const addPrize = (tierId: number) => {
    setTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? {
              ...t,
              prizes: [
                ...t.prizes,
                {
                  id: nextPrize(),
                  type: '배송 수령',
                  title: emptyTitle(),
                  deliveryDeadlineDt: '',
                  deliveryDeadlineTime: '',
                  deliveryFormUrl: '',
                },
              ],
            }
          : t,
      ),
    );
  };

  const updatePrize = (tierId: number, prizeId: number, next: DukRewardPrize) => {
    setTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? { ...t, prizes: t.prizes.map((p) => (p.id === prizeId ? next : p)) }
          : t,
      ),
    );
  };

  const removePrize = (tierId: number, prizeId: number) => {
    setTiers((prev) =>
      prev.map((t) =>
        t.id === tierId ? { ...t, prizes: t.prizes.filter((p) => p.id !== prizeId) } : t,
      ),
    );
  };

  const handleSave = () => {
    for (const tier of tiers) {
      const tErr = validateTargetValue(tier);
      if (tErr) {
        toast.error(`[${yearMonth}] ${tErr}`);
        return;
      }
      if (tier.prizes.length < 1) {
        toast.error(`[${yearMonth}] 구간에 상품 최소 1개 필수`);
        return;
      }
      for (const prize of tier.prizes) {
        const pErr = validatePrize(prize);
        if (pErr) {
          toast.error(`[${yearMonth}] ${pErr}`);
          return;
        }
      }
    }
    const totalPrizes = tiers.reduce((sum, t) => sum + t.prizes.length, 0);
    toast.success(`${yearMonth} 보상 저장 (구간 ${tiers.length}개 · 상품 ${totalPrizes}개)`);
  };

  // ─ 정산 완료 월 (잠금) ─
  if (isLocked) {
    return (
      <section className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
        <header className="flex items-center justify-between px-5 py-3 bg-gray-100 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-700">{yearMonth}</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">
              <LockClosedIcon className="w-3 h-3" />
              정산 완료
            </span>
          </div>
          {settledAt && <span className="text-xs text-gray-500">{settledAt}</span>}
        </header>
        <div className="px-5 py-4 space-y-4">
          {tiers.length === 0 ? (
            <p className="text-sm text-gray-400">보상 미설정 (정산 시 보상 미지급)</p>
          ) : (
            tiers.map((tier) => (
              <div key={tier.id} className="border-l-2 border-gray-300 pl-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  {tier.targetType === '등수' && `${tier.targetValue}위`}
                  {tier.targetType === '퍼센트' && `상위 ${tier.targetValue}%`}
                  {tier.targetType === '등수범위' && `${tier.targetValue}위`}
                  <span className="ml-2 font-normal text-gray-400">· 상품 {tier.prizes.length}개</span>
                </p>
                <ul className="space-y-1.5">
                  {tier.prizes.map((p) => (
                    <li key={p.id}>
                      <PrizeSummary prize={p} />
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </section>
    );
  }

  // ─ 미정산 월 (편집 가능) ─
  return (
    <section className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">{yearMonth}</h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
            <PencilSquareIcon className="w-3 h-3" />
            수정 가능
          </span>
        </div>
      </header>
      <div className="px-5 py-4 space-y-4">
        {tiers.length === 0 ? (
          <p className="text-sm text-gray-400">
            구간이 없습니다. [+ 구간 추가] 버튼으로 시작하세요.
          </p>
        ) : (
          tiers.map((tier, tIdx) => (
            <div key={tier.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              {/* 구간 헤더 — 대상 기준 + 구간 삭제 */}
              <div className="flex items-end gap-2 mb-4">
                <div className="w-28">
                  <label className="block text-xs font-medium text-gray-600 mb-1">대상 기준</label>
                  <select
                    value={tier.targetType}
                    onChange={(e) =>
                      updateTier(tier.id, { targetType: e.target.value as DukRewardTargetType })
                    }
                    className="h-10 w-full px-2 pr-7 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {TARGET_TYPES.map((tt) => (
                      <option key={tt} value={tt}>{tt}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">값</label>
                  <input
                    value={tier.targetValue}
                    onChange={(e) => updateTier(tier.id, { targetValue: e.target.value })}
                    placeholder={
                      tier.targetType === '등수범위'
                        ? '2-10'
                        : tier.targetType === '퍼센트'
                          ? '10'
                          : '1'
                    }
                    className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <span className="h-10 inline-flex items-center text-xs text-gray-500 mx-2">
                  구간 {tIdx + 1} · 상품 {tier.prizes.length}개
                </span>
                <button
                  onClick={() => removeTier(tier.id)}
                  className="h-10 inline-flex items-center gap-1 px-3 text-xs font-medium text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  구간 삭제
                </button>
              </div>

              {/* 구간 안 상품 N개 */}
              <div className="space-y-3">
                {tier.prizes.map((prize) => (
                  <PrizeForm
                    key={prize.id}
                    prize={prize}
                    onChange={(next) => updatePrize(tier.id, prize.id, next)}
                    onRemove={() => removePrize(tier.id, prize.id)}
                  />
                ))}
                <button
                  onClick={() => addPrize(tier.id)}
                  className="inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                >
                  <PlusIcon className="w-4 h-4" />
                  상품 추가
                </button>
              </div>
            </div>
          ))
        )}

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={addTier}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50"
          >
            <PlusIcon className="w-4 h-4" />
            구간 추가
          </button>
          <button
            onClick={handleSave}
            className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            월 보상 저장
          </button>
        </div>
      </div>
    </section>
  );
}
