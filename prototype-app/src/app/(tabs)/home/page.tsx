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
import BivePreviewSheet from '@/components/home/BivePreviewSheet';
import BannerCarousel from '@/components/home/BannerCarousel';
import ShortcutCards from '@/components/home/ShortcutCards';
import { BIVE_PREVIEW_LIST } from '@/lib/data/bive';
import type { BivePreviewItem } from '@/lib/data/bive';


export default function HomePage() {
  const router = useRouter();
  const { activeArtist: artist, artists, activeArtistId } = useActiveArtist();
  const { data: rawBanners } = useBanners(activeArtistId);
  const setActiveArtist = useArtistStore((s) => s.setActiveArtist);
  const addToast = useUIStore((s) => s.addToast);

  const [bannerFilter, setBannerFilter] = useState<'active' | 'closing' | 'ended'>('active');
  const [bannerIdx, setBannerIdx] = useState(0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [missionDone, setMissionDone] = useState(false);
  const [streak, setStreak] = useState(12);
  const [selectedBive, setSelectedBive] = useState<BivePreviewItem | null>(null);
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
  const handleCheckIn = useCallback(() => {
    if (!isLoggedIn) { addToast('info', '로그인 화면으로 이동합니다'); return; }
    if (checkedIn) return;
    setCheckedIn(true);
    setStreak((s) => s + 1);
    addToast('success', '출석 완료! 덕력 10pt 획득');
  }, [isLoggedIn, checkedIn, addToast]);

  return (
    <div className="min-h-dvh bg-white pb-20">
      {!isLoggedIn && <GuestBanner />}
      {/* 1. 헤더 */}
      <AppHeader isGuest={!isLoggedIn} />

      {/* 2. 캐러셀 배너 */}
      {/* TODO (HOM-001): 다른 아티스트 이벤트 배너 탭 시 "이 아티스트를 팔로우하시겠습니까?" 인라인 배너 표시.
          현재 프로토타입은 V01D 단일 아티스트만 지원하므로 해당 분기 생략. */}
      <BannerCarousel
        banners={banners}
        filter={bannerFilter}
        onFilterChange={setBannerFilter}
        bannerIdx={bannerIdx}
        onBannerChange={setBannerIdx}
        onViewAll={() => router.push('/events')}
      />

      {/* 3. 아티스트 선택 */}
      {isLoggedIn ? (
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
      ) : (
        <div className="px-4 mt-4 flex items-center gap-3 py-2">
          <button onClick={() => addToast('info', '로그인 화면으로 이동합니다')} className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-14 h-14 rounded-full bg-violet-50 border-2 border-dashed border-violet-300 flex items-center justify-center">
              <span className="text-2xl text-violet-400">+</span>
            </div>
            <span className="text-[9px] text-violet-500 font-medium">팔로우</span>
          </button>
          <p className="text-xs text-gray-400">로그인하고 아티스트를 팔로우하세요</p>
        </div>
      )}

      {/* ── 선택된 아티스트 기준 ── */}
      {isLoggedIn && (
        <div className="px-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[9px] text-gray-300">{artist.name} 기준</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
        </div>
      )}

      {/* 4. 오늘의 할 일 (컴팩트) */}
      <div className="px-4">
        {!isLoggedIn ? (
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl px-4 py-4 text-center">
            <p className="text-sm font-semibold text-gray-900">로그인하고 시작하기</p>
            <p className="text-xs text-gray-500 mt-1">출석, 미션, 응모권이 기다리고 있어요!</p>
            <button onClick={() => addToast('info', '로그인 화면으로 이동합니다')} className="mt-3 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold">
              로그인
            </button>
          </div>
        ) : allDone ? (
          <button onClick={() => router.push('/daily-mission')} className="w-full rounded-2xl overflow-hidden active:scale-[0.98] transition-transform">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-xl">🔥</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-white">{streak}일 연속 달성!</p>
                <p className="text-xs text-white/80 mt-0.5">오늘 할 일을 모두 완료했어요</p>
              </div>
              <span className="text-white/60 text-sm">→</span>
            </div>
          </button>
        ) : (
          <div className="rounded-2xl overflow-hidden">
            {/* 출석 체크인 */}
            <button onClick={handleCheckIn} disabled={checkedIn} className={cn(
              'w-full px-5 py-3.5 flex items-center gap-3 transition-all active:scale-[0.99]',
              checkedIn
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600'
            )}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', checkedIn ? 'bg-white/20' : 'bg-white/15')}>
                <span className="text-xl">{checkedIn ? '✅' : '👋'}</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-white">{checkedIn ? '출석 완료!' : '출석 체크하기'}</p>
                <p className="text-xs text-white/70 mt-0.5">{checkedIn ? `🔥 ${streak}일 연속 · +10pt 획득` : `탭하여 출석 · 덕력 +10pt`}</p>
              </div>
              {!checkedIn && (
                <span className="text-xs font-bold text-white bg-white/20 px-3 py-1.5 rounded-full">체크인</span>
              )}
            </button>

            {/* 일일 미션 */}
            <button onClick={() => router.push('/daily-mission')} className="w-full bg-gray-50 px-5 py-3.5 flex items-center gap-3 active:bg-gray-100 transition-colors">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', missionDone ? 'bg-green-100' : 'bg-violet-100')}>
                <span className="text-lg">{missionDone ? '✅' : '📋'}</span>
              </div>
              <div className="flex-1 text-left">
                <p className={cn('text-sm font-semibold', missionDone ? 'text-green-600' : 'text-gray-900')}>{missionDone ? '일일 미션 완료!' : '일일 미션'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{missionDone ? '+20pt 획득' : '오늘의 미션을 완료하고 덕력을 받으세요'}</p>
              </div>
              <span className="text-gray-300 text-sm">→</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. 핵심 추천 1개 */}
      <div className="px-4 mt-4">
        <button onClick={() => { if (!isLoggedIn) { addToast('info', '로그인 화면으로 이동합니다'); return; } router.push('/quest'); }}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-2">
            <span className="text-lg">{isLoggedIn ? '🎯' : '💜'}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {isLoggedIn ? `${artist.name} 챌린지 2/5장 진행중` : `${artist.name}의 팬이 되어보세요`}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isLoggedIn ? '다음 장을 열어볼까요?' : '로그인하고 퀘스트, 래플, 서포트에 참여하세요'}
              </p>
            </div>
            <span className="text-xs font-medium text-violet-600">{isLoggedIn ? '이어하기 →' : '시작하기 →'}</span>
          </div>
        </button>
      </div>

      {/* 6. 바로가기 — only shown when there is content */}
      {hasContent && (
        <div className="px-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">바로가기</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <ShortcutCards artistName={artist.name} />
        </div>
      )}

      {/* 7. BIVE 컬렉션 프리뷰 — only shown when there is content */}
      {hasContent && (
        <div className="px-4 mt-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">🃏 이런 BIVE를 모을 수 있어요</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <>
            <div className="grid grid-cols-2 gap-2">
              {BIVE_PREVIEW_LIST.map((bive, i) => {
                const owned = i === 0;
                return (
                  <button key={bive.name}
                    onClick={() => setSelectedBive(bive)}
                    className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-3 text-left active:scale-[0.97] transition-transform relative">
                    <div className="w-full aspect-square rounded-lg bg-violet-100 flex items-center justify-center mb-2">
                      <span className="text-3xl">{bive.emoji}</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-900 truncate">{bive.name}</p>
                    <span className="text-[9px] text-violet-500 font-medium">{bive.grade}</span>
                    {owned && isLoggedIn && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">보유 중</span>
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
      )}

      <PresetSelector presets={HOME_PRESET_OPTIONS} current={preset} onSelect={handlePreset} />

      <BivePreviewSheet bive={selectedBive} onClose={() => setSelectedBive(null)} />
    </div>
  );
}
