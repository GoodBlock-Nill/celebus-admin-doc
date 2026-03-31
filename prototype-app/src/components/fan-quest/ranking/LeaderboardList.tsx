'use client';

import { useFQStore } from '@/stores/useFQStore';
import LeaderboardItem from './LeaderboardItem';

export default function LeaderboardList() {
  const leaderboard = useFQStore((s) => s.leaderboard);

  return (
    <div className="mx-4 bg-white rounded-2xl border border-violet-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500">TOP 50 리더보드</p>
      </div>
      <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto no-scrollbar">
        {leaderboard.map((entry) => (
          <LeaderboardItem key={entry.uid} entry={entry} />
        ))}
      </div>
    </div>
  );
}
