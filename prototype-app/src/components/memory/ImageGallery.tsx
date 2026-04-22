'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: number;
  onFullscreen: (idx: number) => void;
}

export default function ImageGallery({ images, onFullscreen }: ImageGalleryProps) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const [scrollIdx, setScrollIdx] = useState(0);

  return (
    <div>
      <div
        ref={galleryRef}
        className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory"
        onScroll={(e) => {
          const el = e.currentTarget;
          const itemWidth = el.scrollWidth / images;
          const idx = Math.round(el.scrollLeft / itemWidth);
          setScrollIdx(idx);
        }}
      >
        {Array.from({ length: images }).map((_, i) => (
          <button
            key={i}
            onClick={() => onFullscreen(i)}
            className="w-56 h-40 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 active:scale-[0.98] transition-transform snap-start"
          >
            <span className="text-3xl">📷</span>
          </button>
        ))}
      </div>
      {images > 1 && (
        <div className="flex justify-center gap-1 mt-1">
          {Array.from({ length: images }).map((_, i) => (
            <div
              key={i}
              className={cn('w-1.5 h-1.5 rounded-full transition-colors', i === scrollIdx ? 'bg-violet-500' : 'bg-gray-300')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
