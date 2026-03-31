'use client';

import MyRankCard from '@/components/fan-quest/ranking/MyRankCard';
import PointTracker from '@/components/fan-quest/ranking/PointTracker';
import LeaderboardList from '@/components/fan-quest/ranking/LeaderboardList';
import { useFQStore } from '@/stores/useFQStore';

export default function RankingPage() {
  const season = useFQStore((s) => s.season);
  const daysLeft = Math.max(0, Math.ceil(
    (new Date(season.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ));

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0F0A1A] via-violet-900 to-violet-700 px-5 pt-10 pb-6">
        <p className="text-violet-300 text-xs font-medium tracking-wider">🏆 덕력 시즌 랭킹</p>
        <h1 className="text-2xl font-black text-white mt-1">{season.seasonName}</h1>
        <p className="text-violet-200/70 text-xs mt-1">
          시즌 종료까지 D-{daysLeft} · 1위 = 사인 앨범 확정
        </p>
      </div>

      <div className="space-y-4 -mt-2 pt-4">
        <MyRankCard />
        <PointTracker />
        <LeaderboardList />
      </div>
    </div>
  );
}
