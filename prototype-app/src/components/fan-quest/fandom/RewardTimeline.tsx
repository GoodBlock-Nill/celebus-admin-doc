import { LEVEL_REWARDS, LEVEL_THRESHOLDS } from '@/lib/fq-constants';
import { useFQStore } from '@/stores/useFQStore';
import type { FandomLevel } from '@/lib/fq-types';

export default function RewardTimeline() {
  const { fandomProgress, season } = useFQStore();
  const levels = [1, 2, 3, 4, 5] as FandomLevel[];

  return (
    <div className="p-4 bg-white rounded-2xl border border-violet-100">
      <p className="text-xs font-semibold text-gray-500 mb-3">레벨별 보상</p>
      <div className="space-y-3">
        {levels.map((lv) => {
          const isUnlocked = lv <= fandomProgress.currentLevel;
          const isCurrent = lv === fandomProgress.currentLevel + 1;
          const reward = LEVEL_REWARDS[lv];
          const threshold = LEVEL_THRESHOLDS[lv];

          return (
            <div
              key={lv}
              className={`p-3 rounded-xl border ${
                isUnlocked
                  ? 'bg-violet-50 border-violet-200'
                  : isCurrent
                  ? 'bg-white border-violet-300 border-dashed'
                  : 'bg-gray-50 border-gray-200 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${isUnlocked ? 'text-violet-700' : 'text-gray-500'}`}>
                  Lv.{lv} {isUnlocked ? '✅' : isCurrent ? '👈 다음 목표' : '🔒'}
                </span>
                <span className="text-[10px] text-gray-400">{threshold.toLocaleString()}건</span>
              </div>
              <p className="text-xs text-gray-700">📦 {reward.always}</p>
              {season.isEventActive && (
                <p className="text-[10px] text-pink-500 mt-0.5">🎪 {reward.event}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
