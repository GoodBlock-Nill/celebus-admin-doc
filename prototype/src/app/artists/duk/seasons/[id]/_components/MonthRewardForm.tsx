'use client';

import { useState } from 'react';
import { LockClosedIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from '@/components/ui/Toast';
import type { DukRewardTargetType, DukRewardTier } from '@/mock/duk';

// [CEB-BO-ART-401] v1.5 §2-1-E 시즌 상세 페이지 — 월별 보상 폼
// - 정산 완료 월: 잠금 (조회만)
// - 미정산 월: 구간 N개 입력 폼 (+ 구간 추가 · 삭제 · 저장)

interface Props {
  yearMonth: string; // YYYY.MM
  initialTiers: DukRewardTier[];
  isLocked: boolean;
  settledAt?: string;
}

const TARGET_TYPES: DukRewardTargetType[] = ['등수', '퍼센트', '등수범위'];

function validateTier(t: DukRewardTier): string | null {
  if (!t.targetValue.trim()) return '값을 입력하세요';
  if (!t.rewardText.trim()) return '상품을 입력하세요';
  if (t.targetType === '등수') {
    if (!/^\d+$/.test(t.targetValue) || Number(t.targetValue) < 1) return '등수는 양의 정수';
  } else if (t.targetType === '퍼센트') {
    const n = Number(t.targetValue);
    if (!/^\d+$/.test(t.targetValue) || n < 1 || n > 100) return '퍼센트는 1~100';
  } else if (t.targetType === '등수범위') {
    const m = t.targetValue.match(/^(\d+)-(\d+)$/);
    if (!m || Number(m[1]) >= Number(m[2])) return '등수범위 형식: N-M (N<M)';
  }
  if (t.rewardText.length > 200) return '상품 200자 이하';
  return null;
}

export default function MonthRewardForm({ yearMonth, initialTiers, isLocked, settledAt }: Props) {
  const [tiers, setTiers] = useState<DukRewardTier[]>(initialTiers);
  const [nextLocalId, setNextLocalId] = useState(() => -1); // 신규 행은 음수 id 임시 사용

  const addTier = () => {
    const newTier: DukRewardTier = {
      id: nextLocalId,
      targetType: '등수',
      targetValue: '',
      rewardText: '',
    };
    setTiers((prev) => [...prev, newTier]);
    setNextLocalId((n) => n - 1);
  };

  const removeTier = (id: number) => {
    setTiers((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTier = (id: number, patch: Partial<DukRewardTier>) => {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const handleSave = () => {
    for (const t of tiers) {
      const err = validateTier(t);
      if (err) {
        toast.error(`[${yearMonth}] ${err}`);
        return;
      }
    }
    toast.success(`${yearMonth} 보상이 저장되었습니다. (구간: ${tiers.length}개)`);
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
        <div className="px-5 py-4">
          {tiers.length === 0 ? (
            <p className="text-sm text-gray-400">보상 미설정 (정산 시 보상 미지급)</p>
          ) : (
            <ul className="space-y-2">
              {tiers.map((t) => (
                <li key={t.id} className="flex items-center gap-3 text-sm">
                  <span className="inline-flex items-center justify-center min-w-[80px] px-2 py-1 rounded bg-white border border-gray-200 text-xs font-medium text-gray-700">
                    {t.targetType === '등수' && `${t.targetValue}위`}
                    {t.targetType === '퍼센트' && `상위 ${t.targetValue}%`}
                    {t.targetType === '등수범위' && `${t.targetValue}위`}
                  </span>
                  <span className="flex-1 text-gray-800">{t.rewardText}</span>
                </li>
              ))}
            </ul>
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
      <div className="px-5 py-4 space-y-3">
        {tiers.length === 0 ? (
          <p className="text-sm text-gray-400">구간이 없습니다. [+ 구간 추가] 버튼으로 추가하세요.</p>
        ) : (
          tiers.map((t) => (
            <div key={t.id} className="flex items-end gap-2">
              <div className="w-28">
                <label className="block text-xs font-medium text-gray-500 mb-1">대상 기준</label>
                <select
                  value={t.targetType}
                  onChange={(e) => updateTier(t.id, { targetType: e.target.value as DukRewardTargetType })}
                  className="h-10 w-full px-2 pr-7 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {TARGET_TYPES.map((tt) => (
                    <option key={tt} value={tt}>
                      {tt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium text-gray-500 mb-1">값</label>
                <input
                  value={t.targetValue}
                  onChange={(e) => updateTier(t.id, { targetValue: e.target.value })}
                  placeholder={t.targetType === '등수범위' ? '2-10' : t.targetType === '퍼센트' ? '10' : '1'}
                  className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">상품</label>
                <input
                  value={t.rewardText}
                  onChange={(e) => updateTier(t.id, { rewardText: e.target.value })}
                  placeholder="예: 사인 앨범 + 디지털 포카"
                  maxLength={200}
                  className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={() => removeTier(t.id)}
                className="h-10 w-10 inline-flex items-center justify-center text-rose-500 bg-white border border-rose-200 rounded-lg hover:bg-rose-50"
                aria-label="삭제"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={addTier}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
          >
            <PlusIcon className="w-4 h-4" />
            구간 추가
          </button>
          <button
            onClick={handleSave}
            className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            저장
          </button>
        </div>
      </div>
    </section>
  );
}
