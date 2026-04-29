'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import { useMemories, useMonthlyMemoryCount } from '@/lib/hooks/useMemory';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';
import PresetSelector from '@/components/dev/PresetSelector';
import { MEMORY_PRESET_OPTIONS, getMemoryPresetState } from '@/lib/presets/memory';
import EmptyState from '@/components/ui/EmptyState';
import CalendarView from '@/components/memory/CalendarView';

type ViewMode = 'calendar' | 'grid' | 'map';

const TYPE_ICON: Record<string, string> = { photo: '📸', letter: '✉️', memo: '📝' };

interface Memory {
  id: string;
  date: string;
  day: number;
  emoji: string;
  title: string;
  type: 'photo' | 'letter' | 'memo';
  images: number;
  location?: string;
}

export default function MemoryPage() {
  const router = useRouter();
  // TODO: 1년 전 오늘 푸시 알림 → ?yearAgo=true 쿼리 파라미터로 진입 시 해당 날짜 자동 확장
  const { artistName, activeArtistId } = useActiveArtist();
  const addToast = useUIStore((s) => s.addToast);
  const [view, setView] = useState<ViewMode>('calendar');

  // Fix #24: 월 네비게이션 state hoisted early so useMemories can use it
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(4); // 1-indexed

  const { data: rawMemories } = useMemories(activeArtistId, calendarYear, calendarMonth);

  const [preset, setPreset] = useState('many');
  const presetState = getMemoryPresetState(preset);

  // 프리셋 클라이언트 사이드 필터링: DB 시드 데이터를 그대로 두고 표시 상태만 토글
  const memories: Memory[] = useMemo(() => {
    if (presetState.forceEmpty) return [];
    const source = rawMemories ?? [];
    const filtered = presetState.forceSingle ? source.slice(0, 1) : source;
    return filtered.map((m) => {
      const dateObj = new Date(m.date);
      const day = dateObj.getDate();
      const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const imageCount = m.images.length;
      const type: Memory['type'] = imageCount > 0 ? 'photo' : m.text?.startsWith('편지') ? 'letter' : 'memo';
      return {
        id: m.id,
        date: `${monthStr}.${dayStr}`,
        day,
        emoji: m.emojis[0] ?? '💜',
        title: m.text ?? m.emojiLabels[0] ?? '기억',
        type,
        images: imageCount,
        location: m.location ?? undefined,
      };
    });
  }, [rawMemories, presetState.forceEmpty, presetState.forceSingle]);

  // (Full behavior: navigate to last year's month and expand that day.
  //  Currently the calendar is hardcoded to April 2026, so we auto-select
  //  the day from the yearAgo param when present.)
  // const yearAgoParam = false; // TODO: URL 파라미터 ?yearAgo=true 처리 (Suspense 필요)
  const [selectedDay, setSelectedDay] = useState<number | null>(14);

  const goToPrevMonth = () => {
    if (calendarMonth === 1) { setCalendarYear((y) => y - 1); setCalendarMonth(12); }
    else { setCalendarMonth((m) => m - 1); }
    setSelectedDay(null);
  };
  const goToNextMonth = () => {
    if (calendarMonth === 12) { setCalendarYear((y) => y + 1); setCalendarMonth(1); }
    else { setCalendarMonth((m) => m + 1); }
    setSelectedDay(null);
  };

  // Fix #26: 온보딩 트리거 — 기억 0건 + 첫 방문
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return memories.length === 0 && !localStorage.getItem('celebus-memory-onboarding-done');
  });
  const dismissOnboarding = () => {
    if (typeof window !== 'undefined') localStorage.setItem('celebus-memory-onboarding-done', 'true');
    setShowOnboarding(false);
  };

  // Fix 1: monthly count for FAB gate
  const { data: monthlyCount } = useMonthlyMemoryCount(activeArtistId);
  const forceLimit = presetState.forceLimit;

  const handlePreset = (key: string) => {
    setPreset(key);
  };

  return (
    <div className="min-h-dvh bg-white pb-20">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-top">
        <div className="flex items-center h-12 px-4">
          <button onClick={() => router.back()} className="mr-3 -ml-1 p-1"><span className="text-gray-900">←</span></button>
          <h1 className="text-base font-semibold text-gray-900 flex-1">기억저장소</h1>
          <div className="flex gap-1">
            {[
              { key: 'calendar' as ViewMode, icon: '📅' },
              { key: 'grid' as ViewMode, icon: '🖼️' },
              { key: 'map' as ViewMode, icon: '🗺️' },
            ].map((v) => (
              <button key={v.key} onClick={() => setView(v.key)}
                className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-sm', view === v.key ? 'bg-violet-100' : 'bg-gray-50')}>
                {v.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 온보딩 가이드 */}
      {showOnboarding && memories.length === 0 && (
        <EmptyState
          emoji="📸"
          title="기억저장소에 오신 걸 환영해요!"
          description={`${artistName}와의 소중한 기억을 사진, 편지, 메모로 남겨보세요`}
          ctaLabel="첫 기억 남기기"
          onCtaClick={() => { dismissOnboarding(); router.push('/memory-create'); }}
        />
      )}

      {/* 캘린더 뷰 */}
      {view === 'calendar' && !showOnboarding && (
        <CalendarView
          memories={memories}
          calendarYear={calendarYear}
          calendarMonth={calendarMonth}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          goToPrevMonth={goToPrevMonth}
          goToNextMonth={goToNextMonth}
        />
      )}

      {/* 그리드 뷰 */}
      {view === 'grid' && !showOnboarding && (
        <div className="px-4 mt-4">
          {memories.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {memories.map((mem) => (
                <button key={mem.id} onClick={() => router.push('/memory-detail')}
                  className={cn('aspect-square rounded-xl flex flex-col items-center justify-center relative active:scale-[0.97] transition-transform',
                    mem.type === 'photo' ? 'bg-gray-100' : mem.type === 'letter' ? 'bg-pink-50' : 'bg-blue-50')}>
                  <span className="text-2xl">{mem.type === 'photo' ? '📸' : TYPE_ICON[mem.type]}</span>
                  <span className="absolute top-1.5 right-1.5 text-xs">{mem.emoji}</span>
                  <p className="text-[9px] text-gray-500 mt-1 px-1 truncate w-full text-center">{mem.date}</p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="📸"
              title="기억이 없어요"
            />
          )}
        </div>
      )}

      {/* 지도 뷰 */}
      {view === 'map' && !showOnboarding && (
        <div className="px-4 mt-4">
          {/* Fix 3: 지도 뷰 개선 — 위치 핀 표시 */}
          <div className="bg-gradient-to-br from-green-50 via-blue-50 to-green-100 rounded-2xl h-72 relative overflow-hidden border border-gray-200">
            {/* 지도 그리드 배경 */}
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            {/* 도로 표시 (시각적 요소) */}
            <div className="absolute inset-0 flex flex-col justify-center gap-8 px-4 opacity-30 pointer-events-none">
              <div className="h-1 bg-yellow-400 rounded-full" />
              <div className="h-0.5 bg-gray-400 rounded-full" />
            </div>
            {/* 위치 핀 */}
            {memories.filter((m) => m.location).map((mem, i) => {
              const positions = [
                { top: '25%', left: '30%' },
                { top: '55%', left: '60%' },
                { top: '35%', left: '70%' },
                { top: '65%', left: '20%' },
              ];
              const pos = positions[i % positions.length];
              return (
                <button
                  key={mem.id}
                  onClick={() => router.push('/memory-detail')}
                  className="absolute flex flex-col items-center active:scale-110 transition-transform"
                  style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)' }}
                >
                  <div className="bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-md border-2 border-violet-400 text-lg">
                    {mem.emoji}
                  </div>
                  <div className="w-0.5 h-2 bg-violet-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <div className="mt-1 bg-white/90 rounded px-1.5 py-0.5 text-[9px] font-medium text-gray-700 shadow text-center max-w-[80px] truncate">
                    {mem.location}
                  </div>
                </button>
              );
            })}
            {memories.filter((m) => m.location).length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <EmptyState
                  emoji="🗺️"
                  title="위치 정보가 있는 기억이 없어요"
                />
              </div>
            )}
          </div>
          {/* Fix 3: 위치 없는 기억 배너 */}
          {(() => {
            const noLoc = memories.filter((m) => !m.location).length;
            return noLoc > 0 ? (
              <button
                onClick={() => setView('grid')}
                className="mt-3 w-full text-center text-xs text-gray-500 bg-gray-50 rounded-xl py-2.5 border border-gray-200 active:bg-gray-100 transition-colors"
              >
                📷 위치 없는 기억 {noLoc}건 → 갤러리에서 보기
              </button>
            ) : null;
          })()}
        </div>
      )}

      {/* [+] FAB */}
      {!showOnboarding && (
        <button
          onClick={() => {
            // Fix 1: 월간 한도 50건 체크 (forceLimit은 limitReached 프리셋 시 강제 활성화)
            if (forceLimit || (monthlyCount ?? 0) >= 50) {
              addToast('info', '이번 달 업로드 한도에 도달했어요. 다음 달에 다시 기록해 주세요!');
              return;
            }
            router.push('/memory-create');
          }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center text-2xl active:scale-95 transition-transform z-40"
        >
          +
        </button>
      )}

      <PresetSelector presets={MEMORY_PRESET_OPTIONS} current={preset} onSelect={handlePreset} />
    </div>
  );
}
