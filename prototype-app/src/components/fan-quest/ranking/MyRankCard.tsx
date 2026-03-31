'use client';

import { useFQStore } from '@/stores/useFQStore';
import TierBadge from './TierBadge';
import StreakFlame from '@/components/fan-quest/ui/StreakFlame';

export default function MyRankCard() {
  const { myStats, season } = useFQStore();

  return (
    <div className="mx-4 p-4 bg-gradient-to-br from-violet-600 to-violet-800 rounded-2xl text-white">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-violet-200 font-medium">{season.seasonName}</p>
        <StreakFlame currentStreak={myStats.currentStreak} size="sm" />
      </div>

      <div className="flex items-center gap-4">
        <TierBadge tier={myStats.tier} />
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black">{myStats.rank}</span>
            <span className="text-violet-300 text-sm">위</span>
            <span className="text-violet-300 text-xs">/ {myStats.totalParticipants}명</span>
          </div>
          <p className="text-violet-200 text-xs mt-1">
            {myStats.totalPoints.toLocaleString()} 포인트 · 상위 {myStats.percentile}%
          </p>
        </div>
      </div>

      {/* Event indicator */}
      {season.isEventActive && (
        <div className="mt-3 p-2 bg-white/10 rounded-lg">
          <p className="text-[10px] text-pink-300 font-semibold">
            🎪 팬싸 시즌 활성! 1위 = 팬싸 확정, TOP10 = 추첨 3배
          </p>
        </div>
      )}
    </div>
  );
}
