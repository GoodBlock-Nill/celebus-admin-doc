'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { LEVEL_REWARDS } from '@/lib/fq-constants';
import type { FandomLevel } from '@/lib/fq-types';

function LevelUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const level = parseInt(searchParams.get('level') ?? '1', 10) as FandomLevel;
  const reward = LEVEL_REWARDS[level] ?? LEVEL_REWARDS[1];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0A1A] via-violet-900 to-violet-700 flex flex-col items-center justify-center px-6 text-center">
      {/* Big emoji */}
      <div className="text-7xl mb-4 animate-scaleIn">🚀</div>

      {/* Title */}
      <h1 className="text-3xl font-black text-white mb-2 animate-slideInUp">
        V01D 팬덤 Lv.{level} 달성!
      </h1>
      <p className="text-violet-200 text-sm mb-8 animate-slideInUp delay-200">
        새로운 보상이 해금됩니다
      </p>

      {/* Rewards */}
      <div className="w-full max-w-sm space-y-3 animate-slideInUp delay-300">
        <div className="p-4 bg-white/10 backdrop-blur rounded-xl">
          <p className="text-xs text-violet-300 font-semibold mb-2">상시 보상</p>
          <p className="text-sm text-white">📦 {reward.always}</p>
        </div>
        <div className="p-4 bg-pink-500/20 backdrop-blur rounded-xl">
          <p className="text-xs text-pink-300 font-semibold mb-2">이벤트 보상</p>
          <p className="text-sm text-white">🎪 {reward.event}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 space-y-3 w-full max-w-sm animate-slideInUp delay-500">
        <button
          onClick={() => router.push('/rewards')}
          className="w-full py-3 bg-white text-violet-700 font-bold rounded-xl active:bg-violet-50"
        >
          보상 확인하기
        </button>
        <button
          onClick={() => router.push('/home')}
          className="w-full py-3 bg-white/10 text-white font-medium rounded-xl active:bg-white/20"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default function LevelUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-violet-900" />}>
      <LevelUpContent />
    </Suspense>
  );
}
