'use client';

import { useEffect } from 'react';
import { formatGP } from '@/lib/utils';

interface ParticipateCompleteProps {
  choice: 'YES' | 'NO';
  participationGP: number;
  boostingCost: number;
  boostingMultiplier: number;
  gpBalance: number;
  onBoost: () => void;
  onLater: () => void;
}

export default function ParticipateComplete({
  choice,
  participationGP,
  boostingCost,
  boostingMultiplier,
  gpBalance,
  onBoost,
  onLater,
}: ParticipateCompleteProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onLater}>
      {/* Toast */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm font-semibold px-5 py-3 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
        참여가 완료되었어요
      </div>

      {/* Bottom Sheet */}
      <div
        className="w-full max-w-[430px] bg-gray-900 rounded-t-3xl px-6 pt-6 pb-8 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-6" />

        {/* Participation summary */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`text-xs font-bold px-2 py-1 rounded-full ${
              choice === 'YES' ? 'bg-blue-900 text-blue-300' : 'bg-red-900 text-red-300'
            }`}
          >
            {choice} 참여완료
          </div>
          <span className="text-gray-400 text-xs">{formatGP(participationGP)} 사용</span>
        </div>

        {/* Boosting card */}
        <div className="bg-gray-800 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="text-white font-bold text-sm">부스팅 = 내 당첨 지분을 키우는 선택</p>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                같은 정답자여도, 부스팅 여부에 따라 보상 비중이 달라져요.
              </p>
            </div>
          </div>

          <div className="mt-4 bg-gray-700/60 rounded-xl p-3 text-xs text-gray-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-400">부스팅 비용</span>
              <span className="font-semibold">{formatGP(boostingCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">부스팅 배수</span>
              <span className="font-semibold text-amber-400">{boostingMultiplier}배</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">보유 GP</span>
              <span className={`font-semibold ${gpBalance >= boostingCost ? 'text-white' : 'text-red-400'}`}>
                {formatGP(gpBalance)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onLater}
            className="flex-1 h-12 rounded-xl border border-gray-700 text-gray-300 font-semibold text-sm active:opacity-70"
          >
            나중에
          </button>
          <button
            onClick={onBoost}
            className="flex-1 h-12 rounded-xl font-semibold text-sm text-white active:opacity-70"
            style={{
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            }}
          >
            {formatGP(boostingCost)}로 부스팅
          </button>
        </div>
      </div>
    </div>
  );
}
