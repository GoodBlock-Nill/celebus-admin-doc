'use client';

import { useFQStore } from '@/stores/useFQStore';
import RewardCard from './RewardCard';

export default function RewardGrid() {
  const { rewards, activeRewardTab } = useFQStore();
  const filtered = rewards.filter((r) => r.category === activeRewardTab);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <span className="text-3xl mb-2">📭</span>
        <p className="text-sm">아직 보상이 없어요</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {filtered.map((reward) => (
        <RewardCard key={reward.id} reward={reward} />
      ))}
    </div>
  );
}
