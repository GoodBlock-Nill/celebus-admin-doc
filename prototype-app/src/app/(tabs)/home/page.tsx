'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import { useBanners } from '@/lib/hooks/useEvents';
import { useArtistStore } from '@/stores/useArtistStore';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';
import PresetSelector from '@/components/dev/PresetSelector';
import ArtistAvatar from '@/components/artist/ArtistAvatar';
import AppHeader from '@/components/layout/AppHeader';
import GuestBanner from '@/components/ui/GuestBanner';
import { HOME_PRESET_OPTIONS, getHomePresetState } from '@/lib/presets/home';

interface BiveItem {
  name: string;
  grade: string;
  emoji: string;
  owned: boolean;
  howToGet: string;
}

const BIVE_LIST: Omit<BiveItem, 'owned'>[] = [
  { name: 'V01D 데뷔 포토', grade: 'Grade 1', emoji: '📸', howToGet: 'Quest 1장 완료 시 획득' },
  { name: 'V01D 콘서트 메모리', grade: 'Grade 2', emoji: '🎤', howToGet: 'Quest 2장 완료 시 획득' },
  { name: 'V01D 음방 1위', grade: 'Grade 3', emoji: '🏆', howToGet: 'Quest 3장 완료 시 획득' },
  { name: 'V01D 스페셜 에디션', grade: '스페셜', emoji: '✨', howToGet: 'Grade 1~5 전체 합성으로 획득' },
];


export default function HomePage() {
  const router = useRouter();
  const { activeArtist: artist, artists, activeArtistId } = useActiveArtist();
  const { data: rawBanners } = useBanners(activeArtistId);
  const setActiveArtist = useArtistStore((s) => s.setActiveArtist);
  const addToast = useUIStore((s) => s.addToast);

  const [bannerFilter, setBannerFilter] = useState<'active' | 'closing' | 'ended'>('active');
  const [bannerIdx, setBannerIdx] = useState(0);
  const [carouselTouchX, setCarouselTouchX] = useState(0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [missionDone, setMissionDone] = useState(false);
  const [streak, setStreak] = useState(12);
  const [selectedBive, setSelectedBive] = useState<(typeof BIVE_LIST)[number] | null>(null);
  const [preset, setPreset] = useState('loginContent');
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const handlePreset = (key: string) => {
    const state = getHomePresetState(key);
    setIsLoggedIn(state.isLoggedIn);
    if (state.isAllDone) {
      setCheckedIn(true);
      setMissionDone(true);
    } else {
      setCheckedIn(false);
      setMissionDone(false);
    }
    setPreset(key);
  };

  const homePresetState = getHomePresetState(preset);
  const hasContent = homePresetState.hasContent;
  const allDone = checkedIn && missionDone;

  // All banners from DB are active; 'closing'/'ended' tabs show empty for live data
  const allBanners = (rawBanners ?? []).map((b) => ({ id: b.id, title: b.title, subtitle: b.subtitle ?? '' }));
  const banners = hasContent ? allBanners : [];
  const filteredBanners = banners.filter(() => bannerFilter === 'active');

  const handleCarouselSwipe = useCallback((direction: 'left' | 'right') => {
    const maxIdx = filteredBanners.length - 1;
    if (direction === 'left') setBannerIdx((i) => Math.min(i + 1, maxIdx));
    else setBannerIdx((i) => Math.max(i - 1, 0));
  }, [filteredBanners.length]);

  const handleCheckIn = useCallback(() => {
    if (checkedIn) return;
    setCheckedIn(true);
    setStreak((s) => s + 1);
    addToast('success', '출석 완료! 덕력 10pt 획득');
  }, [checkedIn, addToast]);

  return (
    <div className="min-h-dvh bg-white pb-20">
      {!isLoggedIn && <GuestBanner />}
      {/* 1. 헤더 */}
      <AppHeader />

      {/* 2. 캐러셀 배너 */}
      {/* TODO (HOM-001): 다른 아티스트 이벤트 배너 탭 시 "이 아티스트를 팔로우하시겠습니까?" 인라인 배너 표시.
          현재 프로토타입은 V01D 단일 아티스트만 지원하므로 해당 분기 생략. */}
      <div className="px-4 mt-3">
        <div
          className="relative bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl overflow-hidden h-36"
          onTouchStart={(e) => setCarouselTouchX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            const diff = e.changedTouches[0].clientX - carouselTouchX;
            if (Math.abs(diff) > 50) handleCarouselSwipe(diff < 0 ? 'left' : 'right');
          }}
        >
          <button onClick={() => router.push('/events')} className="absolute top-3 right-4 z-10 text-[11px] font-semibold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full hover:bg-white/30 transition-colors">
            전체 보기 →
          </button>
          <div className="absolute inset-0 flex items-end px-5 pb-4">
            <div>
              {filteredBanners.length > 0 ? (
                <>
                  <p className="text-white text-sm font-bold">{filteredBanners[bannerIdx % filteredBanners.length]?.title}</p>
                  <p className="text-white/70 text-xs mt-0.5">{filteredBanners[bannerIdx % filteredBanners.length]?.subtitle}</p>
                </>
              ) : (
                <>
                  <p className="text-white/80 text-sm font-bold">이벤트 준비 중</p>
                  <p className="text-white/50 text-xs mt-0.5">곧 새로운 이벤트가 찾아올 거예요!</p>
                </>
              )}
            </div>
          </div>
          {filteredBanners.length > 1 && (
            <div className="absolute bottom-2 right-4 flex gap-1">
              {filteredBanners.map((_, i) => (
                <div key={i} className={cn('w-1.5 h-1.5 rounded-full', i === bannerIdx % filteredBanners.length ? 'bg-white' : 'bg-white/40')} />
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          {[
            { key: 'active' as const, label: '진행중' },
            { key: 'closing' as const, label: '마감중' },
            { key: 'ended' as const, label: '마감됨' },
          ].map((tab) => (
            <button key={tab.key} onClick={() => { setBannerFilter(tab.key); setBannerIdx(0); }}
              className={cn('px-3 py-1.5 rounded-full text-[10px] font-semibold', bannerFilter === tab.key ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500')}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 아티스트 선택 — [+] 좌측 + 팔로우 아티스트 셀렉터 */}
      <div className="px-4 mt-4 flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
        <button onClick={() => router.push('/artist-discover')} className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="w-14 h-14 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center">
            <span className="text-2xl text-gray-400">+</span>
          </div>
          <span className="text-[9px] text-gray-400 font-medium">추가</span>
        </button>
        {(artists ?? [artist]).map((a) => {
          const isActive = a.id === artist.id;
          return (
            <button key={a.id} onClick={() => setActiveArtist(a.id)} className="flex flex-col items-center gap-1.5 shrink-0">
              <ArtistAvatar artistId={a.id} size="lg" active={isActive} />
              <span className={cn('text-[10px] font-semibold max-w-[56px] truncate', isActive ? 'text-violet-700' : 'text-gray-400')}>{a.nameEn}</span>
            </button>
          );
        })}
      </div>

      {/* ── 선택된 아티스트 기준 ── */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[9px] text-gray-300">{artist.name} 기준</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
      </div>

      {/* 4. 오늘의 할 일 (컴팩트) */}
      <div className="px-4">
        {allDone ? (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
            <span className="text-sm font-semibold text-green-700">✅ 오늘 할 일 완료! 🔥{streak}일째</span>
          </div>
        ) : (
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-amber-600">🔥 {streak > 0 ? `${streak}일째` : '시작!'}</span>
              <div className="flex-1" />
              <button onClick={handleCheckIn} className="flex items-center gap-1">
                <span className="text-sm">{checkedIn ? '✅' : '☐'}</span>
                <span className={cn('text-[10px]', checkedIn ? 'text-green-600' : 'text-gray-500')}>출석</span>
              </button>
              <button onClick={() => { setMissionDone(true); addToast('success', '미션 완료! 덕력 20pt 획득'); }} className="flex items-center gap-1">
                <span className="text-sm">{missionDone ? '✅' : '☐'}</span>
                <span className={cn('text-[10px]', missionDone ? 'text-green-600' : 'text-gray-500')}>미션</span>
              </button>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-violet-700 flex-1">☐ 이번 주 퀘스트: 2/5장</span>
              <button onClick={() => router.push('/quest')} className="text-[10px] font-semibold text-violet-600">이어서 →</button>
            </div>
          </div>
        )}
      </div>

      {/* 5. 핵심 추천 1개 */}
      <div className="px-4 mt-4">
        <button onClick={() => router.push('/quest')}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {artist.name} 챌린지 2/5장 진행중
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                다음 장을 열어볼까요?
              </p>
            </div>
            <span className="text-xs font-medium text-violet-600">이어하기 →</span>
          </div>
        </button>
      </div>

      {/* 6. 바로가기 */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">바로가기</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <div className="space-y-2">

          {/* 키우기 */}
          <button onClick={() => router.push('/fandom-level')}
            className="w-full bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl px-4 py-3.5 text-left active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-lg">🏆</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">Lv.3</span>
                  <p className="text-xs font-semibold text-gray-900 truncate">{artist.name} 키우기</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '60%' }} />
                  </div>
                  <span className="text-[9px] text-amber-600 shrink-0">60%</span>
                </div>
              </div>
              <span className="text-xs text-amber-600 font-medium shrink-0">→</span>
            </div>
          </button>

          {/* 응원하기 */}
          <button onClick={() => router.push('/support')}
            className="w-full bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-200 rounded-xl px-4 py-3.5 text-left active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <span className="text-lg">💜</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-semibold text-pink-600 bg-pink-100 px-1.5 py-0.5 rounded-full">달성 임박!</span>
                  <p className="text-xs font-semibold text-gray-900 truncate">☕ 커피차 서포트</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-violet-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: '85%' }} />
                  </div>
                  <span className="text-[9px] text-violet-600 shrink-0">85%</span>
                </div>
              </div>
              <span className="text-xs text-violet-600 font-medium shrink-0">→</span>
            </div>
          </button>

          {/* 오늘의 일정/소식 */}
          <button onClick={() => router.push('/info')}
            className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl px-4 py-3.5 text-left active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-lg">📅</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">오늘</span>
                  <p className="text-xs font-semibold text-gray-900 truncate">14:00 음악중심 출연</p>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5 truncate">📰 신곡 뮤비 티저 공개 · +2건</p>
              </div>
              <span className="text-xs text-blue-500 font-medium shrink-0">→</span>
            </div>
          </button>

          {/* Raffle */}
          <button onClick={() => router.push('/raffle')}
            className="w-full bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl px-4 py-3.5 text-left active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                <span className="text-lg">🎁</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-semibold text-pink-600 bg-pink-100 px-1.5 py-0.5 rounded-full">D-5</span>
                  <p className="text-xs font-semibold text-gray-900 truncate">사인앨범 래플</p>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">128명 참여중 · 응모권 15장 보유</p>
              </div>
              <span className="text-xs text-pink-500 font-medium shrink-0">응모 →</span>
            </div>
          </button>

        </div>
      </div>

      {/* 7. BIVE 컬렉션 프리뷰 */}
      <div className="px-4 mt-6 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">🃏 이런 BIVE를 모을 수 있어요</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <>
          <div className="grid grid-cols-2 gap-2">
            {BIVE_LIST.map((bive, i) => {
              const owned = i === 0;
              return (
                <button key={bive.name}
                  onClick={() => setSelectedBive(bive)}
                  className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-3 text-left active:scale-[0.97] transition-transform relative">
                  <div className="w-full aspect-square rounded-lg bg-violet-100 flex items-center justify-center mb-2">
                    <span className="text-3xl">{bive.emoji}</span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-900 truncate">{bive.name}</p>
                  <span className="text-[8px] text-violet-500 font-medium">{bive.grade}</span>
                  {owned && (
                    <span className="absolute top-2 right-2 text-[8px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">보유 중</span>
                  )}
                </button>
              );
            })}
          </div>
          <button onClick={() => router.push('/collection')}
            className="w-full mt-3 py-2.5 text-center text-xs font-semibold text-violet-600 bg-violet-50 rounded-xl active:bg-violet-100 transition-colors">
            전체 컬렉션 보기 →
          </button>
        </>
      </div>

      <PresetSelector presets={HOME_PRESET_OPTIONS} current={preset} onSelect={handlePreset} />

      {/* BIVE 미리보기 바텀시트 */}
      {selectedBive && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={() => setSelectedBive(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-5 pb-28 animate-slideInUp" role="dialog" aria-modal="true" aria-label="BIVE 미리보기" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
                <span className="text-5xl">{selectedBive.emoji}</span>
              </div>
              <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full mb-2">{selectedBive.grade}</span>
              <p className="text-base font-bold text-gray-900">{selectedBive.name}</p>
              <p className="text-xs text-gray-500 mt-1">📋 {selectedBive.howToGet}</p>
              <span className={cn(
                'mt-2 text-[10px] font-semibold px-2.5 py-1 rounded-full',
                BIVE_LIST.indexOf(selectedBive) === 0 ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'
              )}>
                {BIVE_LIST.indexOf(selectedBive) === 0 ? '✅ 보유 중' : '미보유'}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedBive(null);
                router.push('/collection');
              }}
              className="w-full mt-5 py-3 rounded-xl bg-violet-600 text-white text-sm font-bold active:bg-violet-700 transition-colors">
              컬렉션에서 보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
