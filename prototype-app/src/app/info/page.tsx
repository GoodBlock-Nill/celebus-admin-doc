'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/ui/Toast';
import { useArtistStore } from '@/stores/useArtistStore';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

type ItemType = 'schedule' | 'news';
type DebugPreset = 'normal' | 'empty' | 'busy' | 'guest';

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
  const artistName = useArtistStore((s) => s.activeArtist.name);
  const addToast = useUIStore((s) => s.addToast);
  const [items, setItems] = useState(MOCK_ITEMS);
  const [notice, setNotice] = useState<typeof MOCK_NOTICE | null>(MOCK_NOTICE);
  const [preset, setPreset] = useState<DebugPreset>('normal');
  const [debugOpen, setDebugOpen] = useState(false);

  const isLoggedIn = preset !== 'guest';

  const groups = ['오늘', '이번 주', '지난 주'];

  const toggleAlarm = (id: string) => {
    if (!isLoggedIn) { addToast('info', '로그인 후 이용 가능합니다'); return; }
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, alarmOn: !item.alarmOn } : item
    ));
    const item = items.find((i) => i.id === id);
    if (item?.alarmOn) addToast('info', '알림이 해제되었습니다');
    else addToast('success', '알림이 설정되었습니다. D-1과 당일에 알려드릴게요');
  };

  const switchPreset = (p: DebugPreset) => {
    setPreset(p);
    setDebugOpen(false);
    if (p === 'normal' || p === 'guest') { setItems(MOCK_ITEMS); setNotice(MOCK_NOTICE); }
    else if (p === 'empty') { setItems([]); setNotice(null); }
    else {
      setItems([
        ...MOCK_ITEMS,
        { id: 'x1', type: 'schedule', title: '뮤직뱅크 출연', date: '04.14', time: '17:00', location: 'KBS', group: '오늘', alarmOn: false },
        { id: 'x2', type: 'schedule', title: '라디오 생방송', date: '04.14', time: '22:00', location: 'MBC 라디오', group: '오늘', alarmOn: false },
        { id: 'x3', type: 'news', title: 'V01D 2nd 미니앨범 컴백 확정', date: '04.14', group: '오늘', exclusive: true },
      ]);
      setNotice(MOCK_NOTICE);
    }
  };

  return (
    <div className="min-h-dvh bg-white pb-8">
      <Toast />
      {!isLoggedIn && (
        <div className="bg-violet-600 text-white text-center py-1.5 text-[10px] font-medium">
          👀 비로그인 미리보기 — 열람 가능, 참여 시 로그인 필요
        </div>
      )}
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
              onClick={() => {
                if (!isLoggedIn) { addToast('info', '로그인 후 이용 가능합니다'); return; }
                addToast('success', '알림이 설정되었습니다');
              }}
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

      {/* 플로팅 디버그 */}
      <div className="fixed bottom-20 right-4 z-50">
        {debugOpen && (
          <div className="mb-2 flex flex-col gap-1.5 animate-slideInUp">
            {[
              { key: 'normal' as const, label: '일반' },
              { key: 'empty' as const, label: '빈 상태' },
              { key: 'busy' as const, label: '컴백 시즌' },
              { key: 'guest' as const, label: '비로그인' },
            ].map((p) => (
              <button key={p.key} onClick={() => switchPreset(p.key)}
                className={cn('px-3 py-2 rounded-xl shadow-md text-[10px] font-semibold whitespace-nowrap', p.key === preset ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-700')}>
                {p.label}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setDebugOpen(!debugOpen)} className="px-3 py-2.5 rounded-full bg-gray-900 text-white shadow-lg flex items-center gap-1.5 active:scale-95 transition-transform">
          <span className="text-[10px] font-semibold">{preset === 'normal' ? '일반' : preset === 'empty' ? '빈 상태' : preset === 'busy' ? '컴백 시즌' : '비로그인'}</span>
          <span className="text-[8px]">▲</span>
        </button>
      </div>
    </div>
  );
}
