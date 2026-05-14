'use client';

import { useState, useMemo } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import ConfirmModal from '@/app/fanquest/_components/ConfirmModal';
import {
  initialGpExchangePolicy,
  type GpExchangePolicy,
} from '@/mock/rft';

type LimitMode = 'limited' | 'unlimited';

export default function RftPolicyPage() {
  const [policy, setPolicy] = useState<GpExchangePolicy>(initialGpExchangePolicy);

  // 입력 상태 (저장 전까지 정책에 미반영)
  const [rateInput, setRateInput] = useState<string>(String(policy.rate));
  const [limitMode, setLimitMode] = useState<LimitMode>(
    policy.dailyLimitPerMember === null ? 'unlimited' : 'limited',
  );
  const [limitInput, setLimitInput] = useState<string>(
    policy.dailyLimitPerMember === null ? '50' : String(policy.dailyLimitPerMember),
  );

  const [confirmOpen, setConfirmOpen] = useState(false);

  // 입력값 파싱·검증
  const rateNum = Number(rateInput);
  const limitNum = Number(limitInput);
  const isRateValid = Number.isInteger(rateNum) && rateNum >= 1;
  const isLimitValid = limitMode === 'unlimited' || (Number.isInteger(limitNum) && limitNum >= 1);

  // 변경사항 비교
  const newDailyLimit: number | null = limitMode === 'unlimited' ? null : limitNum;
  const rateChanged = isRateValid && rateNum !== policy.rate;
  const limitChanged = isLimitValid && newDailyLimit !== policy.dailyLimitPerMember;
  const canSave = isRateValid && isLimitValid && (rateChanged || limitChanged);

  // 확인 모달 메시지
  const confirmMessage = useMemo(() => {
    const lines: string[] = [];
    if (rateChanged) {
      lines.push(`GP 환율을 ${policy.rate} GP → ${rateNum} GP로 변경합니다.`);
    }
    if (limitChanged) {
      const prev = policy.dailyLimitPerMember === null ? '무제한' : `${policy.dailyLimitPerMember}장`;
      const next = newDailyLimit === null ? '무제한' : `${newDailyLimit}장`;
      lines.push(`회원당 1일 교환 한도를 ${prev} → ${next}으로 변경합니다.`);
    }
    return lines.join('\n');
  }, [rateChanged, limitChanged, policy.rate, rateNum, policy.dailyLimitPerMember, newDailyLimit]);

  const handleSave = () => {
    if (!canSave) return;
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    const now = new Date();
    const updatedAt = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setPolicy({
      rate: rateNum,
      dailyLimitPerMember: newDailyLimit,
      lastUpdatedBy: 'nill',
      lastUpdatedAt: updatedAt,
    });
    setConfirmOpen(false);
    alert(`[Mock] 응모권 발급 정책이 변경되었습니다.\n\n${confirmMessage}`);
  };

  return (
    <div>
      <PageHeader
        title="응모권 발급 정책"
        breadcrumbItems={[{ label: '래플' }, { label: '응모권 관리' }]}
      />

      <p className="text-sm text-gray-600 -mt-2 mb-5">
        GP를 응모권으로 교환할 때 적용되는 환율과 회원당 1일 교환 한도를 운영자가 직접 조정합니다.
      </p>

      {/* 1일 기준 안내 박스 */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg px-4 py-3 mb-5 flex items-start gap-2.5">
        <ClockIcon className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
        <div className="text-xs text-indigo-900 leading-relaxed">
          <strong className="font-semibold">1일 기준</strong>: KST 자정(00:00 ~ 23:59:59). 매일 자정에 회원별 한도가 자동 리셋됩니다.
        </div>
      </div>

      {/* 카드 1 — GP → 응모권 환율 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">GP → 응모권 환율</h3>
          <span className="text-xs text-gray-400">필수</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            min="1"
            step="1"
            value={rateInput}
            onChange={(e) => setRateInput(e.target.value)}
            className={`h-11 w-32 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              !isRateValid ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
            }`}
            placeholder="100"
          />
          <span className="text-sm text-gray-700">GP → 응모권 1장</span>
        </div>
        {!isRateValid && (
          <p className="text-xs text-rose-600 mb-2">최소 1 이상의 양의 정수만 입력 가능합니다.</p>
        )}
        <p className="text-xs text-gray-500">
          변경 즉시 회원 앱의 GP 교환 화면에 반영됩니다.
        </p>
      </div>

      {/* 카드 2 — 회원당 1일 교환 한도 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">회원당 1일 교환 한도</h3>
          <span className="text-xs text-gray-400">필수</span>
        </div>

        {/* 라디오 그룹: 한도 적용 / 무제한 */}
        <div className="flex items-center gap-5 mb-3">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="limitMode"
              value="limited"
              checked={limitMode === 'limited'}
              onChange={() => setLimitMode('limited')}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-900">한도 적용</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="limitMode"
              value="unlimited"
              checked={limitMode === 'unlimited'}
              onChange={() => setLimitMode('unlimited')}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-900">무제한</span>
          </label>
        </div>

        {/* 숫자 입력 (한도 적용 모드에서만 활성) */}
        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            min="1"
            step="1"
            value={limitInput}
            disabled={limitMode === 'unlimited'}
            onChange={(e) => setLimitInput(e.target.value)}
            className={`h-11 w-32 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${
              limitMode === 'limited' && !isLimitValid ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
            }`}
            placeholder="50"
          />
          <span className={`text-sm ${limitMode === 'unlimited' ? 'text-gray-400' : 'text-gray-700'}`}>장 / 1일</span>
        </div>
        {limitMode === 'limited' && !isLimitValid && (
          <p className="text-xs text-rose-600 mb-2">최소 1 이상의 양의 정수만 입력 가능합니다.</p>
        )}
        <p className="text-xs text-gray-500 leading-relaxed">
          회원 1명이 KST 자정 기준 1일에 교환받을 수 있는 응모권 최대 장수. 한도 초과 시 회원 앱에서 교환이 차단되고 &quot;오늘 한도 도달. 내일 00:00에 리셋&quot; 안내가 노출됩니다.
          <br />
          <strong className="font-semibold">무제한 선택 시</strong> 한도 검증을 우회하여 회원이 GP만 충분하면 제한 없이 교환 가능합니다.
        </p>
      </div>

      {/* 저장 버튼 */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          마지막 수정: <strong className="text-gray-700">{policy.lastUpdatedBy}</strong> · {policy.lastUpdatedAt}
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="h-11 px-6 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-200 disabled:cursor-not-allowed"
        >
          저장하기
        </button>
      </div>

      {confirmOpen && (
        <ConfirmModal
          title="응모권 발급 정책을 변경하시겠어요?"
          message={confirmMessage}
          confirmLabel="변경하기"
          size="md"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
