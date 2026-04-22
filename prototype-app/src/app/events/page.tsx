'use client';

import { useState } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import PresetSelector from '@/components/dev/PresetSelector';
import GuestBanner from '@/components/ui/GuestBanner';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';
import { EVENTS_PRESET_OPTIONS, getEventsPresetState } from '@/lib/presets/events';
import { useEvents } from '@/lib/hooks/useEvents';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import EmptyState from '@/components/ui/EmptyState';

interface EventItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'raffle' | 'support' | 'event';
  emoji: string;
  dDay?: number;
  active: boolean;
  endDate?: string;
}

// TODO: 다른 아티스트 이벤트 탭 시 팔로우 유도 인라인 배너
export default function EventsPage() {
  const addToast = useUIStore((s) => s.addToast);
  const { activeArtistId } = useActiveArtist();
  const { data: rawEvents } = useEvents(activeArtistId);
  const [tab, setTab] = useState<'active' | 'closing' | 'ended'>('active');
  const [preset, setPreset] = useState('content');
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const events: EventItem[] = (rawEvents ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    subtitle: e.subtitle ?? '',
    type: e.type,
    emoji: e.emoji ?? '🎉',
    dDay: e.dDay ?? undefined,
    active: e.isActive,
    endDate: e.endDate ?? undefined,
  }));

  const handlePreset = (key: string) => {
    setPreset(key);
    if (key === 'guest' || key === 'guestEmpty') {
      setIsLoggedIn(false);
    } else {
      setIsLoggedIn(true);
    }
    const state = getEventsPresetState(key);
    if (state.emptyTab === 'active') setTab('active');
    else if (state.emptyTab === 'closed') setTab('ended');
  };

  const presetState = getEventsPresetState(preset);
  const filtered = presetState.forceEmpty
    ? []
    : events.filter((e) => {
        if (tab === 'active') return e.active && (e.dDay === undefined || e.dDay > 3);
        if (tab === 'closing') return e.active && e.dDay !== undefined && e.dDay >= 0 && e.dDay <= 3;
        return !e.active;
      // Fix #3: 마감됨 탭 — 마감일 최신순 정렬
      }).sort((a, b) => {
        if (tab !== 'ended') return 0;
        const dateA = a.endDate ?? '';
        const dateB = b.endDate ?? '';
        return dateB.localeCompare(dateA);
      });

  return (
    <div className="min-h-dvh bg-white pb-20">
      {!isLoggedIn && <GuestBanner />}
      <SubPageHeader title="이벤트" backHref="/home" />

      {/* 필터 탭 */}
      <div className="px-4 pt-3 pb-2 flex gap-2 border-b border-gray-100">
        {([
          { key: 'active' as const, label: '진행중' },
          { key: 'closing' as const, label: '마감중' },
          { key: 'ended' as const, label: '마감됨' },
        ]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-semibold transition-colors',
              tab === t.key ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 이벤트 리스트 */}
      <div className="px-4 mt-3 space-y-2">
        {filtered.length > 0 ? (
          filtered.map((event) => (
            <button key={event.id}
              onClick={() => addToast('info', `${event.title} 상세 (딥링크 이동)`)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left active:scale-[0.98] transition-transform',
                event.type === 'raffle' ? 'bg-violet-50/50' : event.type === 'support' ? 'bg-green-50/50' : 'bg-blue-50/50'
              )}>
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <span className="text-xl">{event.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                  {event.active && event.dDay !== undefined && (
                    <span className="text-[9px] font-bold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded-full shrink-0">D-{event.dDay}</span>
                  )}
                  {!event.active && (
                    <span className="text-[9px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">마감</span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">{event.subtitle}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">→</span>
            </button>
          ))
        ) : (
          <EmptyState
            emoji={tab === 'ended' ? '📋' : '📭'}
            title={tab === 'ended' ? '마감된 이벤트가 없어요' : '곧 새로운 이벤트가 찾아올 거예요!'}
            ctaLabel={tab !== 'ended' ? '홈으로 돌아가기' : undefined}
            ctaHref={tab !== 'ended' ? '/home' : undefined}
          />
        )}
      </div>

      {/* Fix #4: 전체 이벤트 확인 완료 메시지 */}
      {filtered.length > 0 && (
        <p className="text-center text-xs text-gray-400 py-4">모든 이벤트를 확인했어요</p>
      )}

      <PresetSelector presets={EVENTS_PRESET_OPTIONS} current={preset} onSelect={handlePreset} />
    </div>
  );
}
