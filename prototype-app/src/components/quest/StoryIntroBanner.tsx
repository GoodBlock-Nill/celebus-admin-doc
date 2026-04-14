'use client';

import { useState, useEffect } from 'react';

interface StoryIntroBannerProps {
  artistName: string;
  currentChapter: number;
}

export default function StoryIntroBanner({ artistName, currentChapter }: StoryIntroBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const key = 'celebus-quest-intro-seen';
    if (!localStorage.getItem(key)) {
      setIsExpanded(true);
      localStorage.setItem(key, 'true');
    }
  }, []);

  if (isExpanded) {
    return (
      <div
        className="relative bg-gradient-to-br from-fq-dark to-violet-900 rounded-2xl mx-4 mt-4 px-5 py-6 overflow-hidden cursor-pointer"
        onClick={() => setIsExpanded(false)}
      >
        <div className="absolute inset-0 bg-[url('/v01d/background.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative z-10">
          <p className="text-white/90 text-sm font-medium leading-relaxed">
            {artistName}와의 여정을 시작하세요.
          </p>
          <p className="text-white/70 text-xs mt-1 leading-relaxed">
            5장의 챌린지를 완료하고 특별한 보상을 받아보세요!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-4 px-4 py-2.5 bg-violet-50 rounded-xl">
      <p className="text-xs text-violet-700 font-medium">
        {artistName} 챌린지 — {currentChapter}장 진행중
      </p>
    </div>
  );
}
