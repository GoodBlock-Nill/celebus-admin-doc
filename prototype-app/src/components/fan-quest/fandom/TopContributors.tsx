'use client';

import { useFQStore } from '@/stores/useFQStore';

export default function TopContributors() {
  const topContributors = useFQStore((s) => s.topContributors);

  return (
    <div className="p-4 bg-white rounded-2xl border border-violet-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500">기여도 TOP 10</p>
        <span className="text-[10px] text-pink-500 font-semibold">TOP 3 = 팬싸 보너스 응모권</span>
      </div>
      <div className="space-y-2">
        {topContributors.map((contributor) => (
          <div
            key={contributor.uid}
            className={`flex items-center gap-3 p-2 rounded-lg ${
              contributor.rank <= 3 ? 'bg-amber-50' : ''
            } ${contributor.nickname.includes('(나)') ? 'bg-violet-50 border border-violet-200' : ''}`}
          >
            <span className={`w-6 text-center text-sm font-bold ${
              contributor.rank <= 3 ? 'text-amber-600' : 'text-gray-400'
            }`}>
              {contributor.rank <= 3 ? ['🥇', '🥈', '🥉'][contributor.rank - 1] : contributor.rank}
            </span>
            <div className="w-7 h-7 rounded-full bg-violet-100 overflow-hidden flex-shrink-0">
              <img src={contributor.profileImage} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="flex-1 text-sm font-medium text-gray-900 truncate">
              {contributor.nickname}
            </span>
            <div className="text-right flex-shrink-0">
              <span className="text-xs font-bold text-violet-700">{contributor.activityCount}건</span>
              <span className="text-[10px] text-gray-400 ml-1">{contributor.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
