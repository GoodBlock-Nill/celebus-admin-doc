'use client';

import { formatGP } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ResultCardProps {
  result: 'YES' | 'NO';
  isCorrect: boolean;
  rewardGP?: number;
  hasBoosted?: boolean;
  gameId: string;
  onViewDetail?: () => void;
}

export default function ResultCard({
  result,
  isCorrect,
  rewardGP,
  hasBoosted,
  gameId,
  onViewDetail,
}: ResultCardProps) {
  if (isCorrect) {
    return (
      <div className="bg-gradient-to-br from-green-900/60 to-emerald-900/60 border border-green-700/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🎉</span>
          <span className="text-green-400 font-bold text-base">예측 성공!</span>
          {hasBoosted && (
            <span className="bg-purple-800 text-purple-200 text-xs font-semibold px-2 py-0.5 rounded-full">
              부스팅 효과
            </span>
          )}
        </div>
        {rewardGP !== undefined && rewardGP > 0 && (
          <p className="text-white text-lg font-bold">
            총 보상 <span className="text-amber-400">{formatGP(rewardGP)}</span> 획득
          </p>
        )}
        {onViewDetail && (
          <button
            onClick={onViewDetail}
            className="mt-3 text-green-400 text-sm font-semibold underline"
          >
            결과 자세히 보기 &gt;
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">😔</span>
        <span className="text-gray-300 font-bold text-sm">
          아쉽게도 정답을 맞추지 못하셨네요
        </span>
      </div>
      <p className="text-gray-500 text-xs leading-relaxed">
        정답 여부와 관계없이 예측에 사용한 GP는 모두 환불돼요.
      </p>
      {onViewDetail && (
        <button
          onClick={onViewDetail}
          className="mt-3 text-gray-400 text-sm font-semibold underline"
        >
          결과 자세히 보기 &gt;
        </button>
      )}
    </div>
  );
}
