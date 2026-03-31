'use client';

import type { RewardItem } from '@/lib/fq-types';
import { useFQStore } from '@/stores/useFQStore';

interface RewardCardProps {
  reward: RewardItem;
}

export default function RewardCard({ reward }: RewardCardProps) {
  const claimReward = useFQStore((s) => s.claimReward);

  return (
    <div className={`p-3 rounded-xl border ${
      reward.claimStatus === 'CLAIMED'
        ? 'bg-violet-50 border-violet-200'
        : reward.claimStatus === 'CLAIMABLE'
        ? 'bg-white border-violet-300'
        : 'bg-gray-50 border-gray-200 opacity-60'
    }`}>
      {/* Emoji + type badge */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-3xl">{reward.emoji}</span>
        {reward.rewardType === 'EVENT' && (
          <span className="text-[9px] px-1.5 py-0.5 bg-pink-100 text-pink-600 rounded-full font-semibold">
            이벤트
          </span>
        )}
      </div>

      {/* Name */}
      <p className="text-xs font-bold text-gray-900 mb-0.5 line-clamp-2">{reward.name}</p>
      <p className="text-[10px] text-gray-400">{reward.source}</p>

      {/* Action */}
      <div className="mt-2">
        {reward.claimStatus === 'CLAIMED' && (
          <span className="text-[10px] text-violet-600 font-semibold">✅ 수령 완료</span>
        )}
        {reward.claimStatus === 'CLAIMABLE' && (
          <button
            onClick={() => claimReward(reward.id)}
            className="w-full py-1.5 bg-violet-600 text-white text-[10px] font-bold rounded-lg active:bg-violet-700"
          >
            수령하기
          </button>
        )}
        {reward.claimStatus === 'LOCKED' && (
          <span className="text-[10px] text-gray-400">🔒 미해금</span>
        )}
      </div>
    </div>
  );
}
