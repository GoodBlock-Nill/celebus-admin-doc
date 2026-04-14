'use client';

import { cn } from '@/lib/utils';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

interface WeekDotsProps {
  weekRecord: boolean[];
}

export default function WeekDots({ weekRecord }: WeekDotsProps) {
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1; // 월=0, 일=6

  return (
    <div className="mx-4 mt-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">이번 주</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <div className="flex justify-between">
        {DAYS.map((day, idx) => {
          const isToday = idx === todayIndex;
          const completed = weekRecord[idx];
          const isFuture = idx > todayIndex;

          return (
            <div key={day} className="flex flex-col items-center gap-1">
              <span className={cn(
                'text-[10px] font-medium',
                isToday ? 'text-violet-600' : 'text-gray-400'
              )}>
                {day}
              </span>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm',
                isToday && 'ring-2 ring-violet-300',
                completed ? 'bg-green-100' : isFuture ? 'bg-gray-50' : 'bg-gray-100'
              )}>
                {completed ? '✅' : '☐'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
