'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import { useInfoItems } from '@/lib/hooks/useInfo';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';
import PresetSelector from '@/components/dev/PresetSelector';
import { INFO_PRESET_OPTIONS, getInfoPresetFilter } from '@/lib/presets/info';
import GuestBanner from '@/components/ui/GuestBanner';
import BottomSheet from '@/components/ui/BottomSheet';
import EmptyState from '@/components/ui/EmptyState';
import TimelineSection from '@/components/info/TimelineSection';

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

const MOCK_NOTICES: Notice[] = [
  { title: 'V01D 팬미팅 좌석 배치 변경 안내', date: '04.21', body: 'V01D 팬미팅(4/25) 좌석 배치가 일부 변경되었습니다. 변경된 좌석은 CELEBUS 앱 Event 탭에서 확인하세요. 문의사항은 고객센터로 연락해주세요.' },
  { title: 'V01D 콘서트 MD 사전예약 안내', date: '04.18', body: '5월 공연 MD 사전예약이 시작됩니다. 자세한 내용은 공지를 확인하세요.' },
];

export default function InfoPage() {
  const router = useRouter();
  const { artistName, activeArtistId } = useActiveArtist();
  const { data: rawItems } = useInfoItems(activeArtistId);
  const addToast = useUIStore((s) => s.addToast);
  const [artistAlarmOn, setArtistAlarmOn] = useState(true);
  const [preset, setPreset] = useState('rich');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showNoticeSheet, setShowNoticeSheet] = useState(false);
  const [showScheduleSheet, setShowScheduleSheet] = useState<TimelineItem | null>(null);
  const [showPrevNotices, setShowPrevNotices] = useState(false);

  const items: TimelineItem[] = (rawItems ?? []).map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    date: item.date,
    time: item.time ?? undefined,
    location: item.location ?? undefined,
    image: item.imageUrl ?? undefined,
    exclusive: item.isExclusive,
    alarmOn: item.alarmOn,
    group: item.groupLabel ?? '이전',
  }));

  const handlePreset = (key: string) => {
    setIsLoggedIn(key !== 'guest' && key !== 'guestEmpty');
    setPreset(key);
  };

  const presetFilter = getInfoPresetFilter(preset);
  const notices = MOCK_NOTICES;
  const latestNotice = presetFilter.showNotice ? notices[0] : null;

  const groups = ['오늘', '이번 주', '다음 주', '이후', '지난 주', '이전'];

  const toggleItemAlarm = (id: string) => {
    if (!isLoggedIn) { addToast('info', '로그인 화면으로 이동합니다'); return; }
    // Capture current state BEFORE any update so the toast reflects the old value correctly
    const currentAlarm = items.find((i) => i.id === id)?.alarmOn;
    if (currentAlarm) addToast('info', `${artistName} 알림이 해제되었어요`);
    else addToast('success', `${artistName} 알림이 설정되었어요. 새로운 일정과 소식을 알려드릴게요`);
    // In a real implementation, call a mutation here to toggle the alarm server-side
    // e.g. toggleAlarmMutation.mutate(id);
  };

  const toggleArtistAlarm = () => {
    if (!isLoggedIn) { addToast('info', '로그인 화면으로 이동합니다'); return; }
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
    <div className="min-h-dvh bg-white pb-20">
      {!isLoggedIn && <GuestBanner />}

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
        {!presetFilter.showTimeline ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">타임라인이 비활성화되어 있어요</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <EmptyState
            emoji="📋"
            title={`${artistName}의 첫 소식이 곧 올 거예요!`}
            description="새 소식이 올 때 알려드릴게요!"
            ctaLabel="알림 설정하기"
            onCtaClick={() => { if (!isLoggedIn) { addToast('info', '로그인 화면으로 이동합니다'); return; } toggleArtistAlarm(); }}
            secondaryCtaLabel="V01D 챌린지 시작하기"
            secondaryCtaHref="/quest"
          />
        ) : (
          <TimelineSection
            items={sortedItems}
            groups={groups}
            onItemClick={(item) => { if (item.type === 'schedule') setShowScheduleSheet(item); else router.push('/news-detail'); }}
            onAlarmToggle={toggleItemAlarm}
            isLoggedIn={isLoggedIn}
            artistName={artistName}
          />
        )}
      </div>

      {/* 공지 상세 바텀시트 */}
      <BottomSheet open={showNoticeSheet} onClose={() => setShowNoticeSheet(false)} title="공지 상세">
        <h3 className="text-base font-bold text-gray-900 mb-1">{latestNotice?.title}</h3>
        <p className="text-[10px] text-gray-400 mb-4">{latestNotice?.date}</p>
        <p className="text-sm text-gray-700 leading-relaxed">{latestNotice?.body}</p>

        {notices.length > 1 && !showPrevNotices && (
          <button onClick={() => setShowPrevNotices(true)} className="mt-4 text-xs text-violet-600 font-medium">
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
      </BottomSheet>

      {/* 일정 상세 바텀시트 + [기억 남기기] CTA */}
      <BottomSheet open={!!showScheduleSheet} onClose={() => setShowScheduleSheet(null)} title="일정 상세">
        {showScheduleSheet && (
          <>
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
              onClick={() => {
                const item = showScheduleSheet;
                setShowScheduleSheet(null);
                router.push(`/memory-create?date=${item.date}&location=${encodeURIComponent(item.location ?? '')}`);
              }}
              className="w-full mt-5 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold"
            >
              기억 남기기 💜
            </button>
          </>
        )}
      </BottomSheet>

      <PresetSelector presets={INFO_PRESET_OPTIONS} current={preset} onSelect={handlePreset} />
    </div>
  );
}
