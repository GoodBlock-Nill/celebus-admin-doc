'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type ItemType = 'photo' | 'letter' | 'memo';

interface Memory {
  id: string;
  date: string;
  day: number;
  emoji: string;
  title: string;
  type: ItemType;
  images: number;
  location?: string;
}

const TYPE_ICON = { photo: '📸', letter: '✉️', memo: '📝' };

interface CalendarViewProps {
  memories: Memory[];
  calendarYear: number;
  calendarMonth: number;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
}

export default function CalendarView({
  memories,
  calendarYear,
  calendarMonth,
  selectedDay,
  onSelectDay,
  goToPrevMonth,
  goToNextMonth,
}: CalendarViewProps) {
  const router = useRouter();

  const daysInMonth = 30;
  const firstDayOffset = 2; // 4월 1일 = 수요일 (offset 2)

  const getMemoriesForDay = (day: number) => memories.filter((m) => m.day === day);
  const dayMemories = selectedDay ? getMemoriesForDay(selectedDay) : [];

  return (
    <div className="px-4 mt-4">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={goToPrevMonth} className="text-gray-400 px-1">◀</button>
        <span className="text-sm font-bold text-gray-900">{calendarYear}년 {calendarMonth}월</span>
        <button onClick={goToNextMonth} className="text-gray-400 px-1">▶</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
          <span key={d} className="text-[10px] text-gray-400 font-medium">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dayMems = getMemoriesForDay(day);
          const isSelected = selectedDay === day;
          const today = new Date();
          const isToday =
            calendarYear === today.getFullYear() &&
            calendarMonth === today.getMonth() + 1 &&
            day === today.getDate();
          return (
            <button
              key={day}
              onClick={() => onSelectDay(isSelected ? null : day)}
              className={cn(
                'aspect-square min-h-[44px] rounded-lg flex flex-col items-center justify-center text-xs relative',
                isSelected ? 'bg-violet-100 border border-violet-300' : isToday ? 'border border-violet-200' : 'hover:bg-gray-50'
              )}
            >
              <span className={cn('font-medium', isSelected ? 'text-violet-700' : isToday ? 'text-violet-600' : 'text-gray-700')}>{day}</span>
              {dayMems.length > 0 && (
                <span className="text-[9px] leading-none mt-0.5">
                  {dayMems[0].emoji}{dayMems.length > 1 && <span className="text-gray-400">+{dayMems.length - 1}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 선택 날짜 확장 */}
      {selectedDay && dayMemories.length > 0 && (
        <div className="mt-4 animate-slideInUp">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-gray-400">{calendarMonth}월 {selectedDay}일</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="space-y-2">
            {dayMemories.map((mem) => (
              <button
                key={mem.id}
                onClick={() => router.push('/memory-detail')}
                className="w-full flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-3 text-left active:scale-[0.98] transition-transform"
              >
                <span className="text-lg">{mem.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{mem.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400">
                      {TYPE_ICON[mem.type]} {mem.type === 'photo' ? `사진 ${mem.images}장` : mem.type === 'letter' ? '편지' : '메모'}
                    </span>
                    {mem.location && <span className="text-[10px] text-gray-400">📍{mem.location}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedDay && dayMemories.length === 0 && (
        <div className="mt-4 text-center py-6 text-xs text-gray-400">이 날의 기억이 없어요</div>
      )}
    </div>
  );
}
