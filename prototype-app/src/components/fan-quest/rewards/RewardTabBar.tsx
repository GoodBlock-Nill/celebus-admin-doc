'use client';

import { useFQStore } from '@/stores/useFQStore';
import { REWARD_CATEGORY_CONFIG } from '@/lib/fq-constants';
import type { RewardCategory } from '@/lib/fq-types';

const TABS: RewardCategory[] = ['TICKET', 'BADGE_THEME', 'CONTENT', 'GOODS', 'EVENT'];

export default function RewardTabBar() {
  const { activeRewardTab, setActiveRewardTab, rewards } = useFQStore();

  return (
    <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar py-2">
      {TABS.map((tab) => {
        const config = REWARD_CATEGORY_CONFIG[tab];
        const count = rewards.filter((r) => r.category === tab).length;
        const isActive = activeRewardTab === tab;

        return (
          <button
            key={tab}
            onClick={() => setActiveRewardTab(tab)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isActive
                ? 'bg-violet-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {config.emoji} {config.label} ({count})
          </button>
        );
      })}
    </div>
  );
}
