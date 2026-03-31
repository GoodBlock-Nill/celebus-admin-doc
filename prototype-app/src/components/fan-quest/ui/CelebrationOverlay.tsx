'use client';

import { useEffect } from 'react';
import { useFQStore } from '@/stores/useFQStore';

const CONFETTI_COLORS = ['#7C3AED', '#A78BFA', '#F59E0B', '#EC4899', '#10B981', '#3B82F6'];

export default function CelebrationOverlay() {
  const { showCelebration, celebrationType, celebrationData, dismissCelebration } = useFQStore();

  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(dismissCelebration, 4000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration, dismissCelebration]);

  if (!showCelebration) return null;

  const titles: Record<string, string> = {
    chapter: `🎉 ${celebrationData?.chapter ?? ''} 클리어!`,
    levelUp: `🚀 팬덤 Lv.${celebrationData?.level ?? ''} 달성!`,
    reward: '🎁 보상 수령 완료!',
  };

  const subtitles: Record<string, string> = {
    chapter: '다음 장이 해금되었어요!',
    levelUp: '새로운 보상이 해금됩니다!',
    reward: '수집함에서 확인해보세요!',
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={dismissCelebration}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 animate-fadeIn" />

      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDelay: `${Math.random() * 1.5}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center animate-scaleIn">
        <div className="text-6xl mb-4">
          {celebrationType === 'chapter' && '✨'}
          {celebrationType === 'levelUp' && '🚀'}
          {celebrationType === 'reward' && '🎁'}
        </div>
        <h2 className="text-2xl font-black text-white mb-2">
          {titles[celebrationType ?? 'reward']}
        </h2>
        <p className="text-violet-200 text-sm">
          {subtitles[celebrationType ?? 'reward']}
        </p>
        <p className="text-white/50 text-xs mt-6">탭하여 닫기</p>
      </div>
    </div>
  );
}
