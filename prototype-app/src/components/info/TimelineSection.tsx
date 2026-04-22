'use client';

import { cn } from '@/lib/utils';

type ItemType = 'schedule' | 'news';

interface TimelineItem {
  id: string;
  type: ItemType;
  title: string;
  date: string;
  time?: string;
  location?: string;
  image?: string;
  exclusive?: boolean;
  alarmOn?: boolean;
  group: string;
  description?: string;
}

interface TimelineSectionProps {
  items: TimelineItem[];
  groups: string[];
  onItemClick: (item: TimelineItem) => void;
  onAlarmToggle: (id: string) => void;
  isLoggedIn: boolean;
  artistName: string;
}

const FUTURE_GROUPS = new Set(['이번 주', '다음 주', '이후']);
const PAST_GROUPS = new Set(['지난 주', '이전']);

function getGroupStyle(group: string) {
  if (group === '오늘') return { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500', borderColor: 'border-violet-400' };
  if (FUTURE_GROUPS.has(group)) return { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400', borderColor: 'border-blue-300' };
  return { bg: 'bg-gray-50', text: 'text-gray-400', dot: '', borderColor: '' };
}

export default function TimelineSection({
  items,
  groups,
  onItemClick,
  onAlarmToggle,
}: TimelineSectionProps) {
  const renderedGroups = groups.filter((g) => items.some((i) => i.group === g));
  const todayIdx = renderedGroups.indexOf('오늘');

  return (
    <>
      {renderedGroups.map((group, groupIdx) => {
        const groupItems = items.filter((i) => i.group === group);
        if (groupItems.length === 0) return null;

        const style = getGroupStyle(group);
        const isPast = PAST_GROUPS.has(group);
        const isFuture = FUTURE_GROUPS.has(group);
        const isToday = group === '오늘';

        // 구분선: 미래→오늘, 오늘→과거 전환 시
        const showDividerBefore = (isToday && groupIdx > 0) || (isPast && todayIdx >= 0 && groupIdx === todayIdx + 1);
        const dividerLabel = isToday ? '오늘' : isPast ? '지난 일정' : '';

        return (
          <div key={group} className="mb-5">
            {/* 시간대 전환 구분선 */}
            {showDividerBefore && (
              <div className="flex items-center gap-3 mb-4 mt-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className={cn('text-[10px] font-bold uppercase tracking-wider', isToday ? 'text-violet-600' : 'text-gray-400')}>
                  ── {dividerLabel} ──
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}

            {/* 그룹 라벨 */}
            <div className={cn('flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg -mx-2', style.bg)}>
              {style.dot && <span className={cn('w-2 h-2 rounded-full', style.dot)} />}
              <span className={cn('text-xs font-bold', style.text)}>
                {group}
              </span>
              {isFuture && <span className="text-[9px] text-blue-400 font-medium">예정</span>}
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[9px] text-gray-300">{groupItems.length}건</span>
            </div>

            {/* 아이템 리스트 */}
            <div className={cn(
              'space-y-3',
              isToday && 'border-l-2 border-violet-400 pl-3 ml-1',
              isFuture && 'border-l-2 border-blue-300 pl-3 ml-1',
            )}>
              {groupItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className={cn('w-full flex gap-3 text-left', isPast && 'opacity-60')}
                >
                  <span className="text-sm mt-0.5 shrink-0">{item.type === 'schedule' ? '📅' : '📰'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.exclusive && item.type === 'schedule' && (
                        <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                          ⭐ CELEBUS 단독
                        </span>
                      )}
                      <p className={cn('text-sm font-medium truncate', isPast ? 'text-gray-500' : 'text-gray-900')}>
                        {item.exclusive && item.type === 'news' ? `[CELEBUS 단독] ${item.title}` : item.title}
                      </p>
                    </div>
                    {item.type === 'schedule' && (
                      <p className={cn('text-xs mt-0.5', isPast ? 'text-gray-400' : 'text-gray-500')}>
                        {item.date} {item.time} {item.location && `· ${item.location}`}
                      </p>
                    )}
                    {item.type === 'news' && (
                      <div className="flex items-center gap-2 mt-1">
                        {item.image && (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="text-[10px] text-gray-400">{item.date}</span>
                      </div>
                    )}
                  </div>
                  {item.type === 'schedule' && item.alarmOn !== undefined && !isPast && (
                    <span
                      onClick={(e) => { e.stopPropagation(); onAlarmToggle(item.id); }}
                      className={cn('shrink-0 mt-0.5 text-lg cursor-pointer', item.alarmOn ? 'text-violet-600' : 'text-gray-300')}
                    >
                      {item.alarmOn ? '🔔' : '🔕'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
