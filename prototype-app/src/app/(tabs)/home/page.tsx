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
    if (!isLoggedIn) { addToast('info', '로그인 후 이용 가능합니다'); return; }
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
            <button key={a.id} onClick={() => { if (!isLoggedIn) { addToast('info', '로그인 후 이용 가능합니다'); return; } setActiveArtist(a.id); }} className="flex flex-col items-center gap-1.5 shrink-0">
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
        {!isLoggedIn ? (
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl px-4 py-4 text-center">
            <p className="text-sm font-semibold text-gray-900">로그인하고 시작하기</p>
            <p className="text-xs text-gray-500 mt-1">출석, 미션, 응모권이 기다리고 있어요!</p>
            <button onClick={() => addToast('info', '로그인 후 이용 가능합니다')} className="mt-3 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold">
              로그인
            </button>
          </div>
        ) : allDone ? (
          <button onClick={() => router.push('/daily-mission')} className="w-full bg-green-50 border border-green-200 rounded-2xl px-4 py-3.5 text-center active:bg-green-100 transition-colors">
            <span className="text-sm font-semibold text-green-700">✅ 오늘 할 일 완료! 🔥{streak}일째</span>
            <p className="text-[10px] text-green-500 mt-0.5">탭하여 상세 보기</p>
          </button>
        ) : (
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">🔥 {streak > 0 ? `${streak}일째` : '시작!'}</span>
              <div className="flex-1" />
              <button onClick={handleCheckIn} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg active:bg-violet-100 transition-colors">
                <span className="text-sm">{checkedIn ? '✅' : '☐'}</span>
                <span className={cn('text-xs font-medium', checkedIn ? 'text-green-600' : 'text-gray-600')}>출석</span>
              </button>
              <button onClick={() => router.push('/daily-mission')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg active:bg-violet-100 transition-colors">
                <span className="text-sm">{missionDone ? '✅' : '☐'}</span>
                <span className={cn('text-xs font-medium', missionDone ? 'text-green-600' : 'text-gray-600')}>미션</span>
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-violet-100">
              <span className="text-xs text-violet-700 flex-1">☐ 이번 주 퀘스트: 2/5장</span>
              <button onClick={() => router.push('/daily-mission')} className="text-[10px] font-semibold text-violet-500 px-2 py-1 rounded-lg active:bg-violet-100 transition-colors">일일미션 →</button>
              <button onClick={() => router.push('/quest')} className="text-xs font-semibold text-violet-600 px-2 py-1 rounded-lg active:bg-violet-100 transition-colors">이어서 →</button>
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
