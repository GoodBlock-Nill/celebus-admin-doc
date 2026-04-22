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

export default function TimelineSection({
  items,
  groups,
  onItemClick,
  onAlarmToggle,
  isLoggedIn: _isLoggedIn,
  artistName: _artistName,
}: TimelineSectionProps) {
  return (
    <>
      {groups.map((group) => {
        const groupItems = items.filter((i) => i.group === group);
        if (groupItems.length === 0) return null;
        return (
          <div key={group} className="mb-5">
            <div className={cn(
              'flex items-center gap-2 mb-3 px-2 py-1 rounded-lg -mx-2',
              group === '오늘' ? 'bg-violet-50' : ''
            )}>
              <span className={cn('text-xs font-semibold', group === '오늘' ? 'text-violet-700' : 'text-gray-400')}>
                {group}
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="space-y-3">
              {groupItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="w-full flex gap-3 text-left"
                >
                  <span className="text-sm mt-0.5 shrink-0">{item.type === 'schedule' ? '📅' : '📰'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.exclusive && item.type === 'schedule' && (
                        <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                          ⭐ CELEBUS 단독
                        </span>
                      )}
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.exclusive && item.type === 'news' ? `[CELEBUS 단독] ${item.title}` : item.title}
                      </p>
                    </div>
                    {item.type === 'schedule' && (
                      <p className="text-xs text-gray-500 mt-0.5">
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
                  {item.type === 'schedule' && item.alarmOn !== undefined && (
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
