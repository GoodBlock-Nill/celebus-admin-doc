'use client';

import { cn } from '@/lib/utils';
import type { StreakBonus } from '@/lib/types';

interface StreakHeaderProps {
  streak: number;
  bonuses: StreakBonus[];
}

export default function StreakHeader({ streak, bonuses }: StreakHeaderProps) {
  const nextBonus = bonuses.find((b) => !b.claimed);
  const progress = nextBonus ? Math.min((streak / nextBonus.days) * 100, 100) : 100;
  const remaining = nextBonus ? nextBonus.days - streak : 0;

  return (
    <div className="mx-4 mt-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl px-5 py-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🔥</span>
        <span className="text-base font-bold text-gray-900">
          {streak > 0 ? `${streak}일째 연속 달성!` : '오늘부터 시작!'}
        </span>
      </div>
      {nextBonus && (
        <>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            {nextBonus.days}일 보너스까지 {remaining}일
          </p>
        </>
      )}
    </div>
  );
}
