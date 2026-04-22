'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';
import PresetSelector from '@/components/dev/PresetSelector';
import { INFO_PRESET_OPTIONS, getInfoPresetFilter } from '@/lib/presets/info';

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

interface Notice {
  title: string;
  date: string;
  body?: string;
}

const MOCK_ITEMS: TimelineItem[] = [
  { id: 'i1', type: 'schedule', title: 'MBC 음악중심 출연', date: '04.22', time: '14:00', location: '잠실 MBC 방송센터', group: '오늘', alarmOn: true, description: 'V01D 음악중심 생방송 출연. 신곡 "Tug of War" 무대 예정.' },
  { id: 'i2', type: 'news', title: 'V01D 신곡 뮤비 티저 공개', date: '04.22', image: '/v01d/logo.png', group: '오늘' },
  { id: 'i3', type: 'schedule', title: '팬미팅 서울', date: '04.25', time: '18:00', location: '서울 올림픽홀', group: '이번 주', exclusive: true, alarmOn: false, description: 'V01D 데뷔 기념 첫 공식 팬미팅. CELEBUS 단독 사전 공개 일정.' },
  { id: 'i4', type: 'schedule', title: '인기가요 출연', date: '04.27', time: '15:30', location: 'SBS', group: '이번 주', alarmOn: false, description: 'SBS 인기가요 생방송 출연.' },
  { id: 'i5', type: 'news', title: '[CELEBUS 단독] 멤버 인터뷰 공개', date: '04.24', group: '이번 주', exclusive: true },
  { id: 'i8', type: 'schedule', title: '라디오 스타 출연', date: '04.29', time: '23:00', location: 'MBC', group: '다음 주', alarmOn: false, description: 'MBC 라디오 스타 출연.' },
  { id: 'i9', type: 'schedule', title: 'V01D 팬미팅 도쿄', date: '05.10', time: '18:00', location: '도쿄 부도칸', group: '이후', exclusive: true, alarmOn: false, description: 'V01D 해외 팬미팅 도쿄 공연.' },
  { id: 'i6', type: 'news', title: 'V01D, 음악방송 1위 수상', date: '04.17', group: '지난 주' },
  { id: 'i7', type: 'news', title: 'V01D "Tug of War" 스트리밍 1억 돌파', date: '04.15', group: '이전' },
];

const MOCK_NOTICES: Notice[] = [
  { title: 'V01D 팬미팅 좌석 배치 변경 안내', date: '04.21', body: 'V01D 팬미팅(4/25) 좌석 배치가 일부 변경되었습니다. 변경된 좌석은 CELEBUS 앱 Event 탭에서 확인하세요. 문의사항은 고객센터로 연락해주세요.' },
  { title: 'V01D 콘서트 MD 사전예약 안내', date: '04.18', body: '5월 공연 MD 사전예약이 시작됩니다. 자세한 내용은 공지를 확인하세요.' },
];

export default function InfoPage() {
  const router = useRouter();
  const { artistName } = useActiveArtist();
  const addToast = useUIStore((s) => s.addToast);
  const [items, setItems] = useState(MOCK_ITEMS);
  const [artistAlarmOn, setArtistAlarmOn] = useState(true);
  const [preset, setPreset] = useState('rich');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showNoticeSheet, setShowNoticeSheet] = useState(false);
  const [showScheduleSheet, setShowScheduleSheet] = useState<TimelineItem | null>(null);
  const [showPrevNotices, setShowPrevNotices] = useState(false);

  const handlePreset = (key: string) => {
    setIsLoggedIn(key !== 'guest');
    setPreset(key);
  };

  const presetFilter = getInfoPresetFilter(preset);
  const notices = MOCK_NOTICES;
  const latestNotice = presetFilter.showNotice ? notices[0] : null;

  const groups = ['오늘', '이번 주', '다음 주', '이후', '지난 주', '이전'];

  const toggleItemAlarm = (id: string) => {
    if (!isLoggedIn) { addToast('info', '로그인 후 이용 가능합니다'); return; }
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, alarmOn: !item.alarmOn } : item
    ));
    const item = items.find((i) => i.id === id);
    if (item?.alarmOn) addToast('info', `${artistName} 알림이 해제되었어요`);
    else addToast('success', `${artistName} 알림이 설정되었어요. 새로운 일정과 소식을 알려드릴게요`);
  };

  const toggleArtistAlarm = () => {
    if (!isLoggedIn) { addToast('info', '로그인 후 이용 가능합니다'); return; }
    setArtistAlarmOn(!artistAlarmOn);
    if (artistAlarmOn) addToast('info', `${artistName} 알림이 해제되었어요`);
    else addToast('success', `${artistName} 알림이 설정되었어요. 새로운 일정과 소식을 알려드릴게요`);
  };

  // 타임라인 정렬: 일정(시간순) → 소식(최신순)
  const sortedItems = [...items].sort((a, b) => {
    if (a.group !== b.group) return 0;
    if (a.type === 'schedule' && b.type === 'news') return -1;
    if (a.type === 'news' && b.type === 'schedule') return 1;
    if (a.type === 'schedule' && b.type === 'schedule') return (a.time ?? '').localeCompare(b.time ?? '');
    return b.date.localeCompare(a.date);
  });

  return (
    <div className="min-h-dvh bg-white pb-8">
      {!isLoggedIn && (
        <div className="bg-violet-600 text-white text-center py-1.5 text-[10px] font-medium">
          👀 비로그인 미리보기 — 열람 가능, 참여 시 로그인 필요
        </div>
      )}

      {/* 헤더 + 🔔 아티스트별 알림 토글 */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-top">
        <div className="flex items-center h-12 px-4">
          <button onClick={() => router.back()} className="mr-3 -ml-1 p-1"><span className="text-gray-900">←</span></button>
          <h1 className="text-base font-semibold text-gray-900 flex-1">{artistName} 정보</h1>
          <button onClick={toggleArtistAlarm} className="p-1">
            <span className={cn('text-lg', artistAlarmOn ? 'text-violet-600' : 'text-gray-300')}>
              {artistAlarmOn ? '🔔' : '🔕'}
            </span>
          </button>
        </div>
      </div>

      {/* 공지 배너 (sticky) */}
      {latestNotice && (
        <div className="sticky top-12 z-30 px-4 pt-2">
          <button
            onClick={() => setShowNoticeSheet(true)}
            className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2 text-left"
          >
            <span className="text-sm">⚠️</span>
            <span className="text-xs text-amber-800 flex-1 truncate">{latestNotice.title}</span>
            <span className="text-[10px] text-amber-500">{latestNotice.date}</span>
          </button>
        </div>
      )}

      {/* 타임라인 */}
      <div className="px-4 mt-4">
        {!presetFilter.showTimeline || sortedItems.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-3xl">📋</span>
            <p className="text-sm font-semibold text-gray-900 mt-3">{artistName}의 첫 소식이 곧 올 거예요!</p>
            <p className="text-xs text-gray-500 mt-1">새 소식이 올 때 알려드릴게요!</p>
            <div className="flex gap-2 justify-center mt-4">
              <button onClick={() => { if (!isLoggedIn) { addToast('info', '로그인 후 이용 가능합니다'); return; } toggleArtistAlarm(); }}
                className="text-xs font-medium text-violet-600 bg-violet-50 px-4 py-2 rounded-lg">
                알림 설정하기
              </button>
              <button onClick={() => router.push('/quest')}
                className="text-xs font-medium text-white bg-violet-600 px-4 py-2 rounded-lg">
                V01D 챌린지 시작하기
              </button>
            </div>
          </div>
        ) : (
          groups.map((group) => {
            const groupItems = sortedItems.filter((i) => i.group === group);
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
                      onClick={() => { if (item.type === 'schedule') setShowScheduleSheet(item); else addToast('info', '소식 상세 (CEB-INF-201 추후 작성)'); }}
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
                          onClick={(e) => { e.stopPropagation(); toggleItemAlarm(item.id); }}
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
          })
        )}
      </div>

      {/* 공지 상세 바텀시트 */}
      {showNoticeSheet && (
        <div className="fixed inset-0 z-[100] flex items-end" onClick={() => setShowNoticeSheet(false)}>
          <div className="absolute inset-0 bg-black/40 animate-fadeIn" />
          <div className="relative z-10 w-full max-w-[430px] mx-auto bg-white rounded-t-2xl px-5 py-6 animate-slideInUp" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <h3 className="text-base font-bold text-gray-900 mb-1">{latestNotice?.title}</h3>
            <p className="text-[10px] text-gray-400 mb-4">{latestNotice?.date}</p>
            <p className="text-sm text-gray-700 leading-relaxed">{latestNotice?.body}</p>

            {notices.length > 1 && !showPrevNotices && (
              <button onClick={(e) => { e.stopPropagation(); setShowPrevNotices(true); }} className="mt-4 text-xs text-violet-600 font-medium">
                이전 공지 보기 ({notices.length - 1}건) →
              </button>
            )}

            {showPrevNotices && notices.slice(1).map((n, i) => (
              <div key={i} className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{n.date}</p>
                {n.body && <p className="text-xs text-gray-600 mt-2">{n.body}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 일정 상세 바텀시트 + [기억 남기기] CTA */}
      {showScheduleSheet && (
        <div className="fixed inset-0 z-[100] flex items-end" onClick={() => setShowScheduleSheet(null)}>
          <div className="absolute inset-0 bg-black/40 animate-fadeIn" />
          <div className="relative z-10 w-full max-w-[430px] mx-auto bg-white rounded-t-2xl px-5 py-6 animate-slideInUp" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            {showScheduleSheet.exclusive && (
              <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold mb-2 inline-block">
                ⭐ CELEBUS 단독
              </span>
            )}
            <h3 className="text-base font-bold text-gray-900">{showScheduleSheet.title}</h3>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>📅 {showScheduleSheet.date} {showScheduleSheet.time}</span>
              {showScheduleSheet.location && <span>📍 {showScheduleSheet.location}</span>}
            </div>
            {showScheduleSheet.description && (
              <p className="text-sm text-gray-700 mt-4 leading-relaxed">{showScheduleSheet.description}</p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowScheduleSheet(null);
                router.push(`/memory-create?date=${showScheduleSheet.date}&location=${encodeURIComponent(showScheduleSheet.location ?? '')}`);
              }}
              className="w-full mt-5 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold"
            >
              기억 남기기 💜
            </button>
          </div>
        </div>
      )}

      <PresetSelector presets={INFO_PRESET_OPTIONS} current={preset} onSelect={handlePreset} />
    </div>
  );
}
