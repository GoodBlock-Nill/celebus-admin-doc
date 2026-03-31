'use client';

import RewardTabBar from '@/components/fan-quest/rewards/RewardTabBar';
import RewardGrid from '@/components/fan-quest/rewards/RewardGrid';
import EventBanner from '@/components/fan-quest/rewards/EventBanner';
import { useFQStore } from '@/stores/useFQStore';

export default function RewardsPage() {
  const rewards = useFQStore((s) => s.rewards);
  const claimedCount = rewards.filter((r) => r.claimStatus === 'CLAIMED').length;
  const claimableCount = rewards.filter((r) => r.claimStatus === 'CLAIMABLE').length;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0F0A1A] via-violet-900 to-violet-700 px-5 pt-10 pb-6">
        <p className="text-violet-300 text-xs font-medium tracking-wider">🎁 보상 수집</p>
        <h1 className="text-2xl font-black text-white mt-1">내 보상함</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-violet-200">
            수집 {claimedCount}/{rewards.length}
          </span>
          {claimableCount > 0 && (
            <span className="text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
              {claimableCount}개 수령 가능!
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 -mt-2 pt-2">
        <EventBanner />
        <RewardTabBar />
        <RewardGrid />
      </div>
    </div>
  );
}
