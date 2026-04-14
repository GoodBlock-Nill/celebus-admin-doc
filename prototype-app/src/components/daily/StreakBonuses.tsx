'use client';

import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';
import type { StreakBonus } from '@/lib/types';

interface StreakBonusesProps {
  bonuses: StreakBonus[];
  streak: number;
}

export default function StreakBonuses({ bonuses, streak }: StreakBonusesProps) {
  return (
    <div className="mx-4 mt-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">스트릭 보너스</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <div className="flex justify-between">
        {bonuses.map((bonus) => {
          const achieved = streak >= bonus.days;
          return (
            <div key={bonus.days} className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-lg',
                bonus.claimed ? 'bg-green-100' : achieved ? 'bg-amber-100' : 'bg-gray-50 border border-gray-200'
              )}>
                {bonus.claimed ? '✅' : achieved ? '🎁' : '🔒'}
              </div>
              <span className="text-[10px] font-semibold text-gray-700">{bonus.days}일</span>
              <span className="text-[9px] text-gray-400">{formatNumber(bonus.rewardPt)}pt</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
