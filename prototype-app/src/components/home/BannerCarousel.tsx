'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
}

type BannerFilter = 'active' | 'closing' | 'ended';

interface BannerCarouselProps {
  banners: Banner[];
  filter: BannerFilter;
  onFilterChange: (filter: BannerFilter) => void;
  bannerIdx: number;
  onBannerChange: (idx: number) => void;
  onViewAll: () => void;
}

export default function BannerCarousel({
  banners,
  filter,
  onFilterChange,
  bannerIdx,
  onBannerChange,
  onViewAll,
}: BannerCarouselProps) {
  const router = useRouter();
  const [touchX, setTouchX] = useState(0);

  const filteredBanners = banners.filter(() => filter === 'active');

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const maxIdx = filteredBanners.length - 1;
    if (direction === 'left') onBannerChange(Math.min(bannerIdx + 1, maxIdx));
    else onBannerChange(Math.max(bannerIdx - 1, 0));
  }, [filteredBanners.length, bannerIdx, onBannerChange]);

  return (
    <div className="px-4 mt-3">
      <div
        className="relative bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl overflow-hidden h-36"
        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const diff = e.changedTouches[0].clientX - touchX;
          if (Math.abs(diff) > 50) handleSwipe(diff < 0 ? 'left' : 'right');
        }}
      >
        <button
          onClick={onViewAll}
          className="absolute top-3 right-4 z-10 text-[11px] font-semibold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full hover:bg-white/30 transition-colors"
        >
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
          <button
            key={tab.key}
            onClick={() => { onFilterChange(tab.key); onBannerChange(0); }}
            className={cn('px-3 py-1.5 rounded-full text-[10px] font-semibold', filter === tab.key ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500')}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
