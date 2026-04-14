'use client';

import { useUIStore } from '@/stores/useUIStore';

interface CompleteBannerProps {
  onViewStory: () => void;
  onClaimReward: () => void;
  rewardClaimed: boolean;
}

export default function CompleteBanner({ onViewStory, onClaimReward, rewardClaimed }: CompleteBannerProps) {
  return (
    <div className="mx-4 mt-4 bg-gradient-to-br from-violet-50 to-green-50 border border-green-200 rounded-2xl px-5 py-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🎉</span>
        <div>
          <h3 className="text-sm font-bold text-gray-900">V01D 챌린지 완료!</h3>
          <p className="text-xs text-gray-500 mt-0.5">5장의 스토리를 모두 완주했어요</p>
        </div>
      </div>

      <div className="flex gap-2">
        {rewardClaimed ? (
          <span className="flex-1 text-center py-2.5 bg-gray-100 text-gray-400 rounded-xl text-xs font-medium">
            보상 수령 완료 ✅
          </span>
        ) : (
          <button
            onClick={onClaimReward}
            className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-semibold hover:bg-violet-700 transition-colors"
          >
            보상 받기 🎁
          </button>
        )}
        <button
          onClick={onViewStory}
          className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors"
        >
          더보기
        </button>
      </div>
    </div>
  );
}
