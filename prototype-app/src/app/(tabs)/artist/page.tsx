'use client';

import { useState, useCallback, useEffect } from 'react';
import ArtistHeader from '@/components/artist/ArtistHeader';
import OnboardingOverlay from '@/components/artist/OnboardingOverlay';
import ServiceCard from '@/components/cards/ServiceCard';
import { useUIStore } from '@/stores/useUIStore';
import { MOCK_ARTIST_CARDS } from '@/mock/artist-card-status';
import { SERVICE_GROUP_LABELS } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { ServiceCardData, ServiceCardGroup } from '@/lib/types';

type DebugPreset = 'login-content' | 'login-empty' | 'guest-content' | 'guest-empty';

const GROUP_ORDER: ServiceCardGroup[] = ['mission', 'record', 'more'];

const EMPTY_CARDS: ServiceCardData[] = [
  { id: 'challenge', group: 'mission', icon: '🎯', title: 'V01D 챌린지', statusText: '0/5장', href: '/quest', comingSoon: false },
  { id: 'daily-mission', group: 'mission', icon: '📋', title: '일일 미션', statusText: '시작하기', href: '/daily-mission', comingSoon: false },
  { id: 'support', group: 'mission', icon: '💜', title: 'V01D 응원하기', statusText: '준비 중', href: '/support', comingSoon: false },
  { id: 'virtue', group: 'record', icon: '⭐', title: '덕력', statusText: '참여하기', href: '/virtue', comingSoon: false },
  { id: 'collection', group: 'record', icon: '🃏', title: '컬렉션', statusText: '수집 시작!', href: '/collection', comingSoon: false },
  { id: 'raffle', group: 'record', icon: '🎁', title: 'Raffle', statusText: '새 래플 준비 중!', href: '/raffle', comingSoon: false },
  { id: 'fandom-level', group: 'record', icon: '🏆', title: 'V01D 키우기', statusText: 'Lv.1 (0pt)', href: '/fandom-level', comingSoon: false },
  { id: 'info', group: 'more', icon: '📋', title: '정보', statusText: '곧 소식이 올 거예요', href: '/info', comingSoon: false },
  { id: 'memory', group: 'more', icon: '📸', title: '기억 저장소', statusText: '첫 기억을 남겨보세요!', href: '/memory', comingSoon: false },
];

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
  const [preset, setPreset] = useState<DebugPreset>('login-content');
  const [debugOpen, setDebugOpen] = useState(false);
  const { showOnboarding, setShowOnboarding, addToast } = useUIStore();

  const isLoggedIn = preset === 'login-content' || preset === 'login-empty';
  const hasContent = preset === 'login-content' || preset === 'guest-content';

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
      setCards(hasContent ? [...MOCK_ARTIST_CARDS] : [...EMPTY_CARDS]);
      setIsRefreshing(false);
    }, 800);
  }, [hasContent]);

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

  const switchPreset = (p: DebugPreset) => {
    setPreset(p);
    setDebugOpen(false);
    if (p === 'login-content' || p === 'guest-content') setCards(MOCK_ARTIST_CARDS);
    else setCards(EMPTY_CARDS);
  };

  const handleCardTap = (href: string, title: string) => {
    if (!isLoggedIn) {
      addToast('info', `로그인 후 이용 가능합니다 (${title})`);
      return;
    }
  };

  const grouped = groupCards(cards);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 비로그인 상태 배너 */}
      {!isLoggedIn && (
        <div className="bg-violet-600 text-white text-center py-1.5 text-[10px] font-medium">
          👀 비로그인 미리보기 모드 — 카드 탭 시 로그인 필요
        </div>
      )}

      {/* 앱 헤더 (홈과 동일) */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-top">
        <div className="flex items-center h-12 px-4">
          <span className="text-base font-bold text-violet-700 flex-1">CELEBUS</span>
          <button className="relative mr-3" onClick={() => addToast('info', '알림 (준비 중)')}>
            <span className="text-lg">🔔</span>
            {isLoggedIn && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">3</span>
            )}
          </button>
          <button onClick={() => addToast('info', '응모권 내역 (CEB-FQ-210)')} className="text-xs font-medium text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg">
            응모 {isLoggedIn ? '15' : '-'}
          </button>
        </div>
      </div>

      {/* 아티스트 헤더 */}
      <ArtistHeader />

      {/* Pull-to-Refresh 표시 */}
      {isRefreshing && (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 비로그인 개인화 데이터 안내 */}
      {!isLoggedIn && (
        <div className="mx-4 mt-3 mb-1 text-center">
          <p className="text-[10px] text-gray-400">개인 데이터는 "-"로 표시됩니다. 서비스 정보는 실데이터입니다.</p>
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
                    <div key={card.id} onClick={() => !isLoggedIn && handleCardTap(card.href, card.title)}>
                      <ServiceCard
                        card={isLoggedIn ? card : { ...card, statusText: card.statusText === '참여하기' || card.statusText === '시작하기' ? card.statusText : (hasContent ? card.statusText : '-') }}
                        fullWidth={isLastOdd}
                        disabled={!isLoggedIn}
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

      {/* 플로팅 디버그 */}
      <div className="fixed bottom-20 right-4 z-50">
        {debugOpen && (
          <div className="mb-2 flex flex-col gap-1.5 animate-slideInUp">
            {[
              { key: 'login-content' as const, label: '로그인+콘텐츠' },
              { key: 'login-empty' as const, label: '로그인+Empty' },
              { key: 'guest-content' as const, label: '비로그인+콘텐츠' },
              { key: 'guest-empty' as const, label: '비로그인+Empty' },
            ].map((p) => (
              <button key={p.key} onClick={() => switchPreset(p.key)}
                className={cn('px-3 py-2 rounded-xl shadow-md text-[10px] font-semibold whitespace-nowrap', p.key === preset ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-700')}>
                {p.label}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setDebugOpen(!debugOpen)} className="px-3 py-2.5 rounded-full bg-gray-900 text-white shadow-lg flex items-center gap-1.5 active:scale-95 transition-transform">
          <span className="text-[10px] font-semibold">{preset === 'login-content' ? '로그인+콘텐츠' : preset === 'login-empty' ? '로그인+Empty' : preset === 'guest-content' ? '비로그인+콘텐츠' : '비로그인+Empty'}</span>
          <span className="text-[8px]">▲</span>
        </button>
      </div>
    </div>
  );
}
