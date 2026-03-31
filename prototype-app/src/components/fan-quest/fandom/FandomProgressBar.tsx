'use client';

import { useFQStore } from '@/stores/useFQStore';
import { LEVEL_THRESHOLDS } from '@/lib/fq-constants';
import type { FandomLevel } from '@/lib/fq-types';

export default function FandomProgressBar() {
  const { fandomProgress } = useFQStore();
  const { currentLevel, totalActivities, nextLevelTarget } = fandomProgress;
  const prevTarget = currentLevel > 1 ? LEVEL_THRESHOLDS[(currentLevel) as FandomLevel] : 0;
  const progressInLevel = totalActivities - prevTarget;
  const levelRange = nextLevelTarget - prevTarget;
  const percentage = Math.min(100, (progressInLevel / levelRange) * 100);

  return (
    <div className="p-4 bg-gradient-to-br from-violet-600 to-violet-800 rounded-2xl text-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-violet-200">V01D 팬덤 레벨</span>
        <div className="bg-white/20 px-2.5 py-0.5 rounded-full">
          <span className="text-sm font-black">Lv.{currentLevel}</span>
        </div>
      </div>

      {/* Big number */}
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-3xl font-black">{totalActivities.toLocaleString()}</span>
        <span className="text-violet-300 text-sm">/ {nextLevelTarget.toLocaleString()}건</span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-pink-400 rounded-full transition-all duration-700"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Level milestones */}
      <div className="flex justify-between">
        {([1, 2, 3, 4, 5] as FandomLevel[]).map((lv) => (
          <div key={lv} className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${
              lv <= currentLevel ? 'bg-amber-400' : 'bg-white/20'
            }`} />
            <span className={`text-[9px] mt-0.5 ${
              lv <= currentLevel ? 'text-amber-300 font-bold' : 'text-white/40'
            }`}>
              Lv.{lv}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
