'use client';

import Link from 'next/link';
import { useFQStore } from '@/stores/useFQStore';
import FQBadge from '@/components/fan-quest/ui/FQBadge';
import StreakFlame from '@/components/fan-quest/ui/StreakFlame';

export default function SeasonRankCard() {
  const { myStats, season } = useFQStore();

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(season.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <Link href="/ranking" className="block mx-4">
      <div className="p-4 bg-white rounded-2xl border border-violet-100 shadow-sm active:bg-violet-50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-violet-500 font-semibold tracking-wide">
            🏆 {season.seasonName}
          </p>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              daysLeft <= 3
                ? 'bg-red-100 text-red-500'
                : daysLeft <= 7
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-gray-100 text-gray-400'
            }`}
          >
            D-{daysLeft}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Rank number */}
            <div className="flex flex-col items-center min-w-[40px]">
              <span className="text-2xl font-black text-violet-700 leading-none">
                {myStats.rank}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">위</span>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-200" />

            {/* Details */}
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <FQBadge tier={myStats.tier} size="sm" />
                <StreakFlame currentStreak={myStats.currentStreak} size="sm" />
              </div>
              <p className="text-xs text-gray-500">
                {myStats.totalPoints.toLocaleString()} pt · 상위 {myStats.percentile}%
              </p>
            </div>
          </div>

          {/* Arrow */}
          <span className="text-gray-300 text-xl font-light">›</span>
        </div>
      </div>
    </Link>
  );
}
