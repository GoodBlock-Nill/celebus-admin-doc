'use client';

import { useFQStore } from '@/stores/useFQStore';
import FQProgressBar from '@/components/fan-quest/ui/FQProgressBar';
import { LEVEL_REWARDS } from '@/lib/fq-constants';
import type { FandomLevel } from '@/lib/fq-types';

export default function FandomLevelCard() {
  const { fandomProgress, myContribution, season } = useFQStore();
  const nextLevel = Math.min(5, fandomProgress.currentLevel + 1) as FandomLevel;
  const nextReward = LEVEL_REWARDS[nextLevel];

  return (
    <div className="mx-4 p-4 bg-white rounded-2xl border border-violet-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] text-violet-500 font-semibold tracking-wide">
          🚀 V01D 팬덤 레벨업
        </p>
        <div className="flex items-center gap-1 bg-violet-100 px-2 py-0.5 rounded-full">
          <span className="text-xs font-black text-violet-700">Lv.{fandomProgress.currentLevel}</span>
        </div>
      </div>

      {/* Progress */}
      <FQProgressBar
        current={fandomProgress.totalActivities}
        max={fandomProgress.nextLevelTarget}
        showLabel
        size="lg"
      />

      {/* Next level reward preview */}
      <div className="mt-3 p-2.5 bg-violet-50 rounded-xl">
        <p className="text-[10px] text-violet-600 font-semibold mb-1">
          다음 Lv.{nextLevel} 해금 보상
        </p>
        <p className="text-xs text-gray-700">📦 {nextReward.always}</p>
        {season.isEventActive && (
          <p className="text-xs text-pink-600 mt-0.5">🎪 {nextReward.event}</p>
        )}
      </div>

      {/* My contribution */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">내 기여도</span>
        <span className="text-xs font-bold text-violet-700">
          {myContribution.activityCount}건 ({myContribution.percentage}%) · {myContribution.rank}위
        </span>
      </div>
    </div>
  );
}
