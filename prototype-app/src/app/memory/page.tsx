'use client';

import { useState } from 'react';
import Toast from '@/components/ui/Toast';
import { useArtistStore } from '@/stores/useArtistStore';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

type ViewMode = 'calendar' | 'grid' | 'map';
type DebugPreset = 'has-memories' | 'empty' | 'many';

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

const EMOJIS = ['😍', '😭', '🎉', '💜', '🤩', '✨'];
const TYPE_ICON = { photo: '📸', letter: '✉️', memo: '📝' };

export default function MemoryPage() {
  const artistName = useArtistStore((s) => s.activeArtist.name);
  const addToast = useUIStore((s) => s.addToast);
  const [view, setView] = useState<ViewMode>('calendar');
  const [memories, setMemories] = useState(MOCK_MEMORIES);
  const [selectedDay, setSelectedDay] = useState<number | null>(14);
  const [preset, setPreset] = useState<DebugPreset>('has-memories');
  const [debugOpen, setDebugOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const daysInMonth = 30;
  const firstDayOffset = 2; // 4월 1일 = 수요일 (offset 2)

  const getMemoriesForDay = (day: number) => memories.filter((m) => m.day === day);

  const switchPreset = (p: DebugPreset) => {
    setPreset(p);
    setDebugOpen(false);
    if (p === 'has-memories') { setMemories(MOCK_MEMORIES); setSelectedDay(14); setShowOnboarding(false); }
    else if (p === 'empty') { setMemories([]); setSelectedDay(null); setShowOnboarding(true); }
    else {
      const many = Array.from({ length: 20 }, (_, i) => ({
        id: `mx${i}`, date: `04.${String(i + 1).padStart(2, '0')}`, day: i + 1,
        emoji: EMOJIS[i % 6], title: `기억 ${i + 1}`, type: 'photo' as const, images: i % 4 + 1,
        location: i % 3 === 0 ? '서울' : undefined,
      }));
      setMemories(many);
      setSelectedDay(null);
      setShowOnboarding(false);
    }
  };

  const dayMemories = selectedDay ? getMemoriesForDay(selectedDay) : [];

  return (
    <div className="min-h-dvh bg-white pb-8">
      <Toast />
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-top">
        <div className="flex items-center h-12 px-4">
          <a href="/artist" className="mr-3 -ml-1 p-1"><span className="text-gray-900">←</span></a>
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
          <button onClick={() => { setShowOnboarding(false); addToast('success', '기억이 저장되었어요! 덕력 30pt 획득'); }}
            className="mt-6 px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold">
            첫 기억 남기기
          </button>
        </div>
      )}

      {/* 캘린더 뷰 */}
      {view === 'calendar' && !showOnboarding && (
        <div className="px-4 mt-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <button className="text-gray-400">◀</button>
            <span className="text-sm font-bold text-gray-900">2026년 4월</span>
            <button className="text-gray-400">▶</button>
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
              const isToday = day === 15;
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
                <span className="text-xs font-semibold text-gray-400">4월 {selectedDay}일</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="space-y-2">
                {dayMemories.map((mem) => (
                  <button key={mem.id} onClick={() => addToast('info', `${mem.title} 상세 (준비 중)`)}
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
                <button key={mem.id} onClick={() => addToast('info', `${mem.title} 상세 (준비 중)`)}
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
          <div className="bg-gray-100 rounded-2xl h-64 flex items-center justify-center relative">
            <span className="text-gray-400 text-sm">지도 영역 (피그마 참조)</span>
            {memories.filter((m) => m.location).map((mem, i) => (
              <div key={mem.id} className="absolute" style={{ top: `${30 + i * 40}px`, left: `${50 + i * 60}px` }}>
                <span className="text-lg">📍{mem.emoji}</span>
              </div>
            ))}
          </div>
          {(() => {
            const noLoc = memories.filter((m) => !m.location).length;
            return noLoc > 0 ? (
              <button onClick={() => setView('grid')} className="mt-3 w-full text-center text-xs text-gray-500 bg-gray-50 rounded-xl py-2.5">
                위치 없는 기억 {noLoc}건 → 갤러리에서 보기
              </button>
            ) : null;
          })()}
        </div>
      )}

      {/* [+] FAB */}
      {!showOnboarding && (
        <button
          onClick={() => addToast('success', '기억이 저장되었어요! 덕력 30pt 획득')}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center text-2xl active:scale-95 transition-transform z-40"
        >
          +
        </button>
      )}

      {/* 플로팅 디버그 */}
      <div className="fixed bottom-20 right-4 z-50">
        {debugOpen && (
          <div className="mb-2 flex flex-col gap-1.5 animate-slideInUp">
            {[
              { key: 'has-memories' as const, icon: '📸', label: '기억있음' },
              { key: 'empty' as const, icon: '🔒', label: '첫진입' },
              { key: 'many' as const, icon: '🔥', label: '기억많음' },
            ].map((p) => (
              <button key={p.key} onClick={() => switchPreset(p.key)}
                className={cn('w-12 h-10 rounded-xl shadow-md flex items-center justify-center text-sm', p.key === preset ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200')}>
                {p.icon}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setDebugOpen(!debugOpen)} className="w-12 h-12 rounded-full bg-gray-900 text-white shadow-lg flex flex-col items-center justify-center active:scale-95 transition-transform">
          <span className="text-base">{preset === 'has-memories' ? '📸' : preset === 'empty' ? '🔒' : '🔥'}</span>
          <span className="text-[8px] leading-none">{preset === 'has-memories' ? '기억' : preset === 'empty' ? '첫진입' : '많음'}</span>
        </button>
      </div>
    </div>
  );
}
