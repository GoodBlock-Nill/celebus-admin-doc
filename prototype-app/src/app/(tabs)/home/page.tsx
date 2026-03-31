'use client';

import HeroBanner from '@/components/fan-quest/home/HeroBanner';
import StoryQuestCard from '@/components/fan-quest/home/StoryQuestCard';
import SeasonRankCard from '@/components/fan-quest/home/SeasonRankCard';
import FandomLevelCard from '@/components/fan-quest/home/FandomLevelCard';
import { useFQStore } from '@/stores/useFQStore';

export default function HomePage() {
  const activityFeed = useFQStore((s) => s.activityFeed);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroBanner />

      <div className="space-y-4 -mt-2 pb-6">
        {/* Story Quest */}
        <StoryQuestCard />

        {/* Season Ranking */}
        <SeasonRankCard />

        {/* Fandom Level */}
        <FandomLevelCard />

        {/* Activity Feed */}
        <div className="mx-4">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wide mb-2">
            📡 실시간 팬덤 활동
          </p>
          <div className="overflow-hidden h-8 relative">
            <div className="animate-marquee flex gap-8 whitespace-nowrap">
              {[...activityFeed, ...activityFeed].map((item, i) => (
                <span key={`${item.id}-${i}`} className="text-xs text-gray-500">
                  <span className="font-semibold text-violet-600">{item.nickname}</span>
                  {' '}
                  {item.action}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
