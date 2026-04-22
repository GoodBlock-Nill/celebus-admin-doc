'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePullToRefresh } from '@/lib/hooks/usePullToRefresh';
import ArtistHeader from '@/components/artist/ArtistHeader';
import OnboardingOverlay from '@/components/artist/OnboardingOverlay';
import ServiceCard from '@/components/cards/ServiceCard';
import PresetSelector from '@/components/dev/PresetSelector';
import { useUIStore } from '@/stores/useUIStore';
import AppHeader from '@/components/layout/AppHeader';
import { cn } from '@/lib/utils';
import { ARTIST_PRESET_OPTIONS, getArtistPresetState } from '@/lib/presets/artist';
import { SERVICE_GROUP_LABELS } from '@/lib/types';
import type { ServiceCardData, ServiceCardGroup } from '@/lib/types';

// TODO: DB에서 동적 계산 (퀘스트 진행률, 시즌 순위, 래플 건수 등)
const ARTIST_CARDS: ServiceCardData[] = [
  // 미션 그룹
  { id: 'challenge', group: 'mission', icon: '🎯', title: 'V01D 챌린지', statusText: '2/5장', href: '/quest', comingSoon: false },
  { id: 'daily-mission', group: 'mission', icon: '📋', title: '일일 미션', statusText: '도전 중', href: '/daily-mission', comingSoon: false },
  { id: 'support', group: 'mission', icon: '💜', title: 'V01D 응원하기', statusText: '진행중 70%', href: '/support', comingSoon: false },
  // 내기록 그룹
  { id: 'virtue', group: 'record', icon: '⭐', title: '덕력', statusText: '시즌 38위', href: '/virtue', comingSoon: false },
  { id: 'collection', group: 'record', icon: '🃏', title: '컬렉션', statusText: '12종', href: '/collection', comingSoon: false },
  { id: 'raffle', group: 'record', icon: '🎁', title: 'Raffle', statusText: '래플 2건 진행중', href: '/raffle', comingSoon: false },
  { id: 'fandom-level', group: 'record', icon: '🏆', title: 'V01D 키우기', statusText: 'Lv.3 (1,200/2,000pt)', href: '/fandom-level', comingSoon: false },
  // 더보기 그룹
  { id: 'info', group: 'more', icon: '📰', title: '정보', statusText: '새소식 3', href: '/info', comingSoon: false },
  { id: 'memory', group: 'more', icon: '📸', title: '기억 저장소', statusText: '기억 8개', href: '/memory', comingSoon: false },
];

// 비로그인(guest) 시 로그인 없이 열람 가능한 카드 (서비스 수준 데이터, 읽기 전용)
// 나머지 카드(challenge, daily-mission, collection, memory)는 로그인 필요 → 토스트 표시
const GUEST_OPEN_CARDS = new Set(['virtue', 'support', 'fandom-level', 'raffle', 'info']);

// 비로그인 시 개인화 데이터를 숨겨야 하는 카드 ID 목록
const GUEST_PERSONAL_CARDS = new Set(['challenge', 'daily-mission', 'virtue', 'collection', 'memory']);

function getGuestStatusText(card: ServiceCardData): string {
  if (GUEST_PERSONAL_CARDS.has(card.id)) return '-';
  return card.statusText;
}

const GROUP_ORDER: ServiceCardGroup[] = ['mission', 'record', 'more'];

function groupCards(cards: ServiceCardData[]) {
  const grouped: Record<ServiceCardGroup, ServiceCardData[]> = {
    mission: [],
    record: [],
    more: [],
  };
  for (const card of cards) {
    grouped[card.group].push(card);
  }
  return grouped;
}

export default function ArtistPage() {
  const [cards, setCards] = useState(ARTIST_CARDS);
  const [preset, setPreset] = useState('loginContent');
  const [isGuest, setIsGuest] = useState(false);
  const { showOnboarding, setShowOnboarding, addToast } = useUIStore();
  const presetState = getArtistPresetState(preset);

  const handlePreset = (key: string) => {
    setPreset(key);
    setIsGuest(key === 'guest' || key === 'guestEmpty');
    if (key === 'onboarding') setShowOnboarding(true);
  };

  // 온보딩: 첫 진입 시 1회
  useEffect(() => {
    const key = 'celebus-artist-onboarding-done';
    if (!localStorage.getItem(key)) {
      setShowOnboarding(true);
    }
  }, [setShowOnboarding]);

  const dismissOnboarding = useCallback(() => {
    localStorage.setItem('celebus-artist-onboarding-done', 'true');
    setShowOnboarding(false);
  }, [setShowOnboarding]);

  // Pull-to-Refresh 시뮬레이션
  const handleRefresh = useCallback(() => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setCards([...ARTIST_CARDS]);
        resolve();
      }, 800);
    });
  }, []);

  const { isRefreshing, handleTouchStart, handleTouchEnd } = usePullToRefresh(handleRefresh);

  const grouped = groupCards(cards);

  return (
    <div
      className="min-h-dvh bg-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 앱 헤더 (홈과 동일) */}
      <AppHeader isGuest={isGuest} />

      {/* 아티스트 헤더 */}
      <ArtistHeader />

      {/* Pull-to-Refresh 표시 */}
      {isRefreshing && (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 카드 그리드 — 흰색 라운드 컨테이너로 ArtistHeader와 시각적 분리 */}
      <div className="bg-white rounded-t-3xl -mt-4 relative z-10 px-4 pt-5 pb-28 space-y-6 min-h-[60vh] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {GROUP_ORDER.map((group) => {
          const groupCards = grouped[group];
          if (groupCards.length === 0) return null;

          return (
            <section key={group}>
              {/* 그룹 라벨 */}
              <div className="flex items-center gap-2 mb-3">
                <span className={cn(
                  'text-xs font-bold tracking-wider',
                  group === 'mission' ? 'text-violet-500' : group === 'record' ? 'text-blue-500' : 'text-gray-400'
                )}>
                  {SERVICE_GROUP_LABELS[group]}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* 카드 그리드: 2열 기본, 홀수 행 마지막 카드 1열 풀 */}
              <div className="grid grid-cols-2 gap-3">
                {groupCards.map((card, idx) => {
                  const isLastOdd = groupCards.length % 2 === 1 && idx === groupCards.length - 1;
                  // 비로그인 시 GUEST_OPEN_CARDS 외 카드는 클릭 시 로그인 토스트
                  const isGuestBlocked = isGuest && !GUEST_OPEN_CARDS.has(card.id);
                  // Fix #5: 비로그인 시 개인화 데이터는 "-" 표시
                  const displayCard = isGuest ? { ...card, statusText: getGuestStatusText(card) } : card;
                  return (
                    <div key={card.id} className={isLastOdd ? 'col-span-2' : ''} onClick={isGuestBlocked ? (e) => { e.preventDefault(); addToast('info', '로그인 화면으로 이동합니다'); } : undefined}>
                      <ServiceCard
                        card={displayCard}
                        fullWidth={isLastOdd}
                        disabled={false}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* 온보딩 오버레이 */}
      <OnboardingOverlay onDismiss={dismissOnboarding} />

      <PresetSelector presets={ARTIST_PRESET_OPTIONS} current={preset} onSelect={handlePreset} />
    </div>
  );
}
