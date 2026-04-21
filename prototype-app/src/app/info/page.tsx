'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import { useUIStore } from '@/stores/useUIStore';
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
}

const MOCK_ITEMS: TimelineItem[] = [
  { id: 'i1', type: 'schedule', title: 'MBC 음악중심 출연', date: '04.14', time: '14:00', location: '잠실 MBC 방송센터', group: '오늘', alarmOn: true },
  { id: 'i2', type: 'news', title: 'V01D 신곡 뮤비 티저 공개', date: '04.14', image: '/v01d/logo.png', group: '오늘' },
  { id: 'i3', type: 'schedule', title: '팬미팅 서울', date: '04.18', time: '18:00', location: '서울 올림픽홀', group: '이번 주', exclusive: true, alarmOn: false },
  { id: 'i4', type: 'schedule', title: '인기가요 출연', date: '04.20', time: '15:30', location: 'SBS', group: '이번 주', alarmOn: false },
  { id: 'i5', type: 'news', title: '[CELEBUS 단독] 멤버 인터뷰 공개', date: '04.17', group: '이번 주', exclusive: true },
  { id: 'i6', type: 'news', title: 'V01D, 음악방송 1위 수상', date: '04.10', group: '지난 주' },
  { id: 'i7', type: 'news', title: 'V01D "Tug of War" 스트리밍 1억 돌파', date: '04.08', group: '지난 주' },
];

const MOCK_NOTICE = { title: '서버 점검 안내 04.15 02:00~06:00', date: '04.13' };

export default function InfoPage() {
  const router = useRouter();
  const { artistName } = useActiveArtist();
  const addToast = useUIStore((s) => s.addToast);
  const [items, setItems] = useState(MOCK_ITEMS);
  const [notice] = useState<typeof MOCK_NOTICE | null>(MOCK_NOTICE);

  const groups = ['오늘', '이번 주', '지난 주'];

  const toggleAlarm = (id: string) => {
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, alarmOn: !item.alarmOn } : item
    ));
    const item = items.find((i) => i.id === id);
    if (item?.alarmOn) addToast('info', '알림이 해제되었습니다');
    else addToast('success', '알림이 설정되었습니다. D-1과 당일에 알려드릴게요');
  };

  return (
    <div className="min-h-dvh bg-white pb-8">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-top">
        <div className="flex items-center h-12 px-4">
          <button onClick={() => router.back()} className="mr-3 -ml-1 p-1"><span className="text-gray-900">←</span></button>
          <h1 className="text-base font-semibold text-gray-900">{artistName} 정보</h1>
        </div>
      </div>

      {/* 공지 배너 */}
      {notice && (
        <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-sm">⚠️</span>
          <span className="text-xs text-amber-800 flex-1 truncate">{notice.title}</span>
          <span className="text-[10px] text-amber-500">{notice.date}</span>
        </div>
      )}

      {/* 타임라인 */}
      <div className="px-4 mt-4">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-3xl">📋</span>
            <p className="text-sm font-semibold text-gray-900 mt-3">아직 등록된 소식이 없습니다</p>
            <p className="text-xs text-gray-500 mt-1">새 소식이 올 때 알려드릴게요!</p>
            <button
              onClick={() => addToast('success', '알림이 설정되었습니다')}
              className="mt-4 text-xs font-medium text-violet-600 bg-violet-50 px-4 py-2 rounded-lg"
            >
              알림 설정하기
            </button>
          </div>
        ) : (
          groups.map((group) => {
            const groupItems = items.filter((i) => i.group === group);
            if (groupItems.length === 0) return null;
            return (
              <div key={group} className="mb-5">
                <div className={cn(
                  'flex items-center gap-2 mb-3 px-2 py-1 rounded-lg -mx-2',
                  group === '오늘' ? 'bg-violet-50' : ''
                )}>
                  <span className={cn('text-xs font-semibold', group === '오늘' ? 'text-violet-700' : 'text-gray-400')}>
                    {group} {group === '오늘' && items.find((i) => i.group === '오늘')?.date}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <div className="space-y-3">
                  {groupItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <span className="text-sm mt-0.5 shrink-0">{item.type === 'schedule' ? '📅' : '📰'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {item.exclusive && (
                            <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                              CELEBUS 단독
                            </span>
                          )}
                          <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
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
                        <button onClick={() => toggleAlarm(item.id)} className="shrink-0 mt-0.5">
                          <span className={cn('text-lg', item.alarmOn ? 'text-violet-600' : 'text-gray-300')}>
                            {item.alarmOn ? '🔔' : '🔕'}
                          </span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
