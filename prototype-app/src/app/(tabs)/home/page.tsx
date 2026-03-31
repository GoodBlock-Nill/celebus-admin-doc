'use client';

import Link from 'next/link';
import HeroBanner from '@/components/fan-quest/home/HeroBanner';
import StoryQuestCard from '@/components/fan-quest/home/StoryQuestCard';
import SeasonRankCard from '@/components/fan-quest/home/SeasonRankCard';
import FandomLevelCard from '@/components/fan-quest/home/FandomLevelCard';
import { useFQStore } from '@/stores/useFQStore';

export default function HomePage() {
  const { raffles, activeQuests, activityFeed } = useFQStore();
  const activeRaffles = raffles.filter((r) => r.status === 'ACTIVE');
  const availableQuests = activeQuests.filter(
    (q) => q.submissionStatus === 'AVAILABLE' || q.submissionStatus === 'REJECTED',
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroBanner />

      <div className="space-y-4 pt-3 pb-20">
        {/* NOW RAFFLE */}
        {activeRaffles.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-4 mb-2">
              <p className="text-xs font-bold text-gray-700">🎪 NOW RAFFLE</p>
              <Link href="/event" className="text-[10px] text-violet-600 font-semibold">
                전체보기
              </Link>
            </div>
            <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar">
              {activeRaffles.map((raffle) => (
                <Link key={raffle.id} href={`/raffle/${raffle.id}`} className="flex-shrink-0 w-[260px]">
                  <div className="p-3 bg-white rounded-xl border border-violet-200 active:bg-violet-50">
                    <div className="flex items-center gap-2">
                      <img src={raffle.thumbnailUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-violet-500 font-semibold">[{raffle.artistName}]</span>
                        <p className="text-sm font-bold text-gray-900 truncate">{raffle.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400">{raffle.totalUsers}명 참여</span>
                      <span className="text-[10px] font-semibold text-pink-500">
                        내 응모: {raffle.myTickets}장
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* QUESTS */}
        {availableQuests.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-4 mb-2">
              <p className="text-xs font-bold text-gray-700">📋 QUESTS</p>
              <Link href="/event" className="text-[10px] text-violet-600 font-semibold">
                전체보기
              </Link>
            </div>
            <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar">
              {availableQuests.map((quest) => (
                <Link key={quest.id} href={`/quest-submit/${quest.id}`} className="flex-shrink-0 w-[260px]">
                  <div className="p-3 bg-white rounded-xl border border-violet-200 active:bg-violet-50">
                    <span className="text-[10px] text-violet-500 font-semibold">
                      [{quest.artistName}] QUEST
                    </span>
                    <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{quest.title}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400">D-{quest.dDay}</span>
                      <span className="text-[10px] font-semibold text-pink-500">
                        🎫 +{quest.rewardTickets}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

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
