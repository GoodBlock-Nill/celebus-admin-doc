'use client';

import { useState, useCallback, useEffect } from 'react';
import ArtistHeader from '@/components/artist/ArtistHeader';
import OnboardingOverlay from '@/components/artist/OnboardingOverlay';
import ServiceCard from '@/components/cards/ServiceCard';
import { useUIStore } from '@/stores/useUIStore';
import { MOCK_ARTIST_CARDS } from '@/mock/artist-card-status';
import { SERVICE_GROUP_LABELS } from '@/lib/types';
import type { ServiceCardData, ServiceCardGroup } from '@/lib/types';

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
  const [cards, setCards] = useState(MOCK_ARTIST_CARDS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showOnboarding, setShowOnboarding } = useUIStore();

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
    setIsRefreshing(true);
    setTimeout(() => {
      setCards([...MOCK_ARTIST_CARDS]);
      setIsRefreshing(false);
    }, 800);
  }, []);

  // 간단한 Pull-to-Refresh (터치 기반)
  const [touchStart, setTouchStart] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStart(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientY - touchStart;
    if (diff > 80 && window.scrollY === 0 && !isRefreshing) {
      handleRefresh();
    }
    setTouchStart(0);
  };

  const grouped = groupCards(cards);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 아티스트 헤더 */}
      <ArtistHeader />

      {/* Pull-to-Refresh 표시 */}
      {isRefreshing && (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 카드 그리드 */}
      <div className="px-4 py-5 space-y-6">
        {GROUP_ORDER.map((group) => {
          const groupCards = grouped[group];
          if (groupCards.length === 0) return null;

          return (
            <section key={group}>
              {/* 그룹 라벨 */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {SERVICE_GROUP_LABELS[group]}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* 카드 그리드: 2열 기본, 홀수 행 마지막 카드 1열 풀 */}
              <div className="grid grid-cols-2 gap-3">
                {groupCards.map((card, idx) => {
                  const isLastOdd = groupCards.length % 2 === 1 && idx === groupCards.length - 1;
                  return (
                    <ServiceCard
                      key={card.id}
                      card={card}
                      fullWidth={isLastOdd}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* 온보딩 오버레이 */}
      <OnboardingOverlay onDismiss={dismissOnboarding} />
    </div>
  );
}
