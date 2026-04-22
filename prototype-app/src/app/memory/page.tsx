'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import { useMonthlyMemoryCount } from '@/lib/hooks/useMemory';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';
import PresetSelector from '@/components/dev/PresetSelector';
import { MEMORY_PRESET_OPTIONS, applyMemoryPreset } from '@/lib/presets/memory';

type ViewMode = 'calendar' | 'grid' | 'map';

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

const MOCK_MEMORIES: Memory[] = [
  { id: 'm1', date: '04.14', day: 14, emoji: '😍', title: 'V01D 콘서트 다녀왔다!', type: 'photo', images: 3, location: '잠실 올림픽홀' },
  { id: 'm2', date: '04.10', day: 10, emoji: '🎉', title: 'V01D 음방 1위 축하!', type: 'photo', images: 5 },
  { id: 'm3', date: '04.07', day: 7, emoji: '💜', title: 'V01D에게 쓰는 편지', type: 'letter', images: 0 },
  { id: 'm4', date: '04.03', day: 3, emoji: '✨', title: '오늘 V01D 노래 들으며 행복했다', type: 'memo', images: 0 },
  { id: 'm5', date: '04.14', day: 14, emoji: '🤩', title: '콘서트 포카 교환 성공!', type: 'photo', images: 2, location: '잠실 올림픽홀' },
];

const TYPE_ICON = { photo: '📸', letter: '✉️', memo: '📝' };

export default function MemoryPage() {
  const router = useRouter();
  // TODO: 1년 전 오늘 푸시 알림 → ?yearAgo=true 쿼리 파라미터로 진입 시 해당 날짜 자동 확장
  const { artistName, activeArtistId } = useActiveArtist();
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>('calendar');
  const [memories] = useState(MOCK_MEMORIES);
  // (Full behavior: navigate to last year's month and expand that day.
  //  Currently the calendar is hardcoded to April 2026, so we auto-select
  //  the day from the yearAgo param when present.)
  // const yearAgoParam = false; // TODO: URL 파라미터 ?yearAgo=true 처리 (Suspense 필요)
  const [selectedDay, setSelectedDay] = useState<number | null>(14);

  // Fix #24: 월 네비게이션 (baseYear/baseMonth 기준으로 캘린더 렌더)
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(4); // 1-indexed

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

  const [preset, setPreset] = useState('many');

  // Fix 1: monthly count for FAB gate
  const { data: monthlyCount } = useMonthlyMemoryCount(activeArtistId);

  const handlePreset = async (key: string) => {
    setPreset(key);
    await applyMemoryPreset(key, queryClient);
  };

  const daysInMonth = 30;
  const firstDayOffset = 2; // 4월 1일 = 수요일 (offset 2)

  const getMemoriesForDay = (day: number) => memories.filter((m) => m.day === day);

  const dayMemories = selectedDay ? getMemoriesForDay(selectedDay) : [];

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
        <div className="mx-4 mt-6 text-center py-12">
          <span className="text-4xl">📸</span>
          <h3 className="text-base font-bold text-gray-900 mt-4">기억저장소에 오신 걸 환영해요!</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            {artistName}와의 소중한 기억을<br />사진, 편지, 메모로 남겨보세요
          </p>
          <div className="flex justify-center gap-4 mt-4 text-xs text-gray-400">
            <span>📅 캘린더</span><span>🖼️ 갤러리</span><span>🗺️ 지도</span>
          </div>
          <button onClick={() => { dismissOnboarding(); router.push('/memory-create'); }}
            className="mt-6 px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold">
            첫 기억 남기기
          </button>
        </div>
      )}

      {/* 캘린더 뷰 */}
      {view === 'calendar' && !showOnboarding && (
        <div className="px-4 mt-4">
          {/* Fix #24: 월 네비게이션 */}
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
              const isToday = calendarYear === today.getFullYear() && calendarMonth === today.getMonth() + 1 && day === today.getDate();
              return (
                <button key={day} onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={cn(
                    'aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative',
                    isSelected ? 'bg-violet-100 border border-violet-300' : isToday ? 'border border-violet-200' : 'hover:bg-gray-50'
                  )}>
                  <span className={cn('font-medium', isSelected ? 'text-violet-700' : isToday ? 'text-violet-600' : 'text-gray-700')}>{day}</span>
                  {dayMems.length > 0 && (
                    <span className="text-[8px] leading-none mt-0.5">
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
                  <button key={mem.id} onClick={() => router.push('/memory-detail')}
                    className="w-full flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-3 text-left active:scale-[0.98] transition-transform">
                    <span className="text-lg">{mem.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{mem.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400">{TYPE_ICON[mem.type]} {mem.type === 'photo' ? `사진 ${mem.images}장` : mem.type === 'letter' ? '편지' : '메모'}</span>
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
            <div className="text-center py-12 text-xs text-gray-400">기억이 없어요</div>
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
                <span className="text-gray-400 text-sm">위치 정보가 있는 기억이 없어요</span>
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
            // Fix 1: 월간 한도 50건 체크
            if ((monthlyCount ?? 0) >= 50) {
              addToast('info', '이번 달 업로드 한도에 도달했어요. 다음 달에 다시 기록해 주세요!');
              return;
            }
            router.push('/memory-create');
          }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center text-2xl active:scale-95 transition-transform z-40"
        >
          +
        </button>
      )}

      <PresetSelector presets={MEMORY_PRESET_OPTIONS} current={preset} onSelect={handlePreset} />
    </div>
  );
}
