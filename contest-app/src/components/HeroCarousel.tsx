"use client";

// 메인 배너 캐러셀 — CoverHero를 슬라이드로 감싸 자동 순환 + 도트 + 스와이프.
import { useEffect, useRef, useState } from "react";
import CoverHero from "./CoverHero";
import type { ContestPublic } from "@/lib/types";

interface Slide extends ContestPublic {
  entryCount: number;
  voteCount: number;
}

const AUTOPLAY_MS = 5000;

export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = slides.length;

  useEffect(() => {
    if (n <= 1 || paused) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % n), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [n, paused]);

  // 슬라이드 수 변화 시 인덱스 보정
  useEffect(() => {
    if (idx >= n) setIdx(0);
  }, [n, idx]);

  if (n === 0) return null;
  if (n === 1) {
    const s = slides[0];
    return <CoverHero contest={s} entryCount={s.entryCount} voteCount={s.voteCount} href={`/contest/${s.slug}`} />;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        setPaused(false);
        if (start === null) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) < 40) return;
        setIdx((i) => (dx < 0 ? (i + 1) % n : (i - 1 + n) % n));
      }}
    >
      <div className="overflow-hidden rounded-[22px]">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {slides.map((s) => (
            <div key={s.id} className="w-full shrink-0">
              <CoverHero contest={s} entryCount={s.entryCount} voteCount={s.voteCount} href={`/contest/${s.slug}`} />
            </div>
          ))}
        </div>
      </div>

      {/* 도트 인디케이터 */}
      <div className="mt-2.5 flex items-center justify-center gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setIdx(i)}
            aria-label={`배너 ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-primary" : "w-1.5 bg-line"}`}
          />
        ))}
      </div>
    </div>
  );
}
