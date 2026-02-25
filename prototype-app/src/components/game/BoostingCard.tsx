'use client';

import { formatGP } from '@/lib/utils';

interface BoostingCardProps {
  cost: number;
  multiplier: number;
  onBoost: () => void;
}

export default function BoostingCard({ cost, multiplier, onBoost }: BoostingCardProps) {
  return (
    <div className="bg-gray-800 rounded-2xl p-4">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">🎯</span>
        <div>
          <p className="text-white font-bold text-sm">부스팅 = 내 당첨 지분을 키우는 선택</p>
          <p className="text-gray-400 text-xs mt-1 leading-relaxed">
            같은 정답자여도, 부스팅 여부에 따라 보상 비중이 달라져요.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-gray-700/60 rounded-xl p-3 mb-4 text-sm">
        <div className="text-center">
          <p className="text-gray-400 text-xs">비용</p>
          <p className="text-white font-semibold">{formatGP(cost)}</p>
        </div>
        <div className="text-2xl text-gray-500">→</div>
        <div className="text-center">
          <p className="text-gray-400 text-xs">배분 가중치</p>
          <p className="text-amber-400 font-bold text-base">{multiplier}배</p>
        </div>
      </div>

      <button
        onClick={onBoost}
        className="w-full h-12 rounded-xl font-semibold text-sm text-white active:opacity-70 transition-opacity"
        style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
      >
        {formatGP(cost)}로 부스팅하기
      </button>
    </div>
  );
}
