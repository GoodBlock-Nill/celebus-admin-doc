'use client';

import Link from 'next/link';
import { useFQStore } from '@/stores/useFQStore';

export default function StoryQuestCard() {
  const chapters = useFQStore((s) => s.chapters);
  const completedCount = chapters.filter((c) => c.status === 'COMPLETED').length;
  const currentChapter = chapters.find(
    (c) => c.status === 'IN_PROGRESS' || c.status === 'AVAILABLE'
  );
  const totalChapters = chapters.length;
  const progress = completedCount / totalChapters;
  const totalEarnedTickets = chapters
    .filter((c) => c.status === 'COMPLETED')
    .reduce((sum, c) => sum + c.reward.tickets, 0);

  // SVG circle math
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="mx-4 p-4 bg-white rounded-2xl border border-violet-100 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Progress Ring */}
        <div className="relative flex-shrink-0">
          <svg width="88" height="88" className="-rotate-90">
            <circle cx="44" cy="44" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="6" />
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              stroke="url(#violet-gradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="violet-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#A78BFA" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-violet-700">{completedCount}</span>
            <span className="text-[10px] text-gray-400">/ {totalChapters}장</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-violet-500 font-semibold tracking-wide mb-0.5">
            ✨ V01D 팬싸 퀘스트
          </p>
          {currentChapter ? (
            <>
              <p className="text-sm font-bold text-gray-900 truncate">
                {currentChapter.number}장: {currentChapter.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{currentChapter.subtitle}</p>
              <div className="flex items-center gap-2 mt-2">
                <Link
                  href="/quest"
                  className="inline-block px-4 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-full active:bg-violet-700 transition-colors"
                >
                  계속하기 →
                </Link>
                {totalEarnedTickets > 0 && (
                  <span className="text-[10px] text-pink-500 font-semibold">
                    🎫 +{totalEarnedTickets} 획득
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-emerald-600">🎉 전체 클리어!</p>
              {totalEarnedTickets > 0 && (
                <p className="text-xs text-pink-500 font-semibold mt-0.5">
                  🎫 총 {totalEarnedTickets}장 획득
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chapter dots */}
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
        {chapters.map((ch) => (
          <div
            key={ch.id}
            className={`flex-1 h-1 rounded-full transition-all duration-500 ${
              ch.status === 'COMPLETED'
                ? 'bg-violet-500'
                : ch.status === 'IN_PROGRESS'
                  ? 'bg-violet-300 animate-pulse'
                  : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
