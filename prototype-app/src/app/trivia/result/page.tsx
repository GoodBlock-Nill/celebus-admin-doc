'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { TRIVIA_RESULT_CONFIG } from '@/lib/constants';
import { formatGP, formatNumber } from '@/lib/utils';
import type { TriviaResultType } from '@/lib/types';

const MOCK_TOTAL_PRIZE_GP = 50000;
const MOCK_SURVIVOR_COUNT = 42;
const MOCK_REWARD_GP = Math.floor(MOCK_TOTAL_PRIZE_GP / MOCK_SURVIVOR_COUNT);

const LOADING_TIMEOUT_MS = 10000;
const MOCK_LOAD_DELAY_MS = 1200;

type PageState = 'loading' | 'loaded' | 'error';

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = (searchParams.get('type') as TriviaResultType) ?? 'A';

  const type: TriviaResultType = ['A', 'B', 'C', 'D'].includes(typeParam) ? typeParam : 'A';
  const config = TRIVIA_RESULT_CONFIG[type];

  const isWinner = type === 'A' || type === 'B';
  const isSpectatorComplete = type === 'C';
  const isPerfect = type === 'A';

  const [pageState, setPageState] = useState<PageState>('loading');

  const loadData = useCallback(() => {
    setPageState('loading');

    const timeoutId = setTimeout(() => {
      setPageState('error');
    }, LOADING_TIMEOUT_MS);

    // 프로토타입: 실제 API 대신 딜레이 시뮬레이션
    const loadId = setTimeout(() => {
      clearTimeout(timeoutId);
      setPageState('loaded');
    }, MOCK_LOAD_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(loadId);
    };
  }, []);

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [loadData]);

  function handleRetry() {
    loadData();
  }

  function getSubMessage(): string {
    switch (type) {
      case 'A':
        return '정말 대단해요! 모든 문제를 맞혔어요!';
      case 'B':
        return '끝까지 살아남았습니다!';
      case 'C':
        return '끝까지 관전해 주셔서 감사합니다!';
      case 'D':
        return '다음에는 꼭 완주해 보세요!';
    }
  }

  function getHeaderTitle(): string {
    if (isWinner) return '완주 성공!';
    return '아쉽지만 탈락했어요';
  }

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col max-w-md mx-auto">
        {/* Header - back button always active */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <button
            onClick={() => router.push('/home')}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-base font-semibold">게임 결과</span>
          <div className="w-9" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-3 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col max-w-md mx-auto">
        {/* Header - back button always active */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <button
            onClick={() => router.push('/home')}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-base font-semibold">게임 결과</span>
          <div className="w-9" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5">
          <div className="text-4xl">&#9888;</div>
          <p className="text-gray-300 text-base font-semibold">결과를 불러올 수 없습니다</p>
          <button
            onClick={handleRetry}
            className="mt-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white rounded-xl text-sm font-bold transition-all"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // Loaded state
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <button
          onClick={() => router.push('/home')}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors text-gray-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-base font-semibold">게임 결과</span>
        <div className="w-9" />
      </header>

      {/* Result type switcher (for testing) */}
      <div className="flex gap-1 px-4 py-2 border-b border-gray-800">
        <span className="text-gray-500 text-xs mr-1 self-center">타입:</span>
        {(['A', 'B', 'C', 'D'] as TriviaResultType[]).map(t => (
          <button
            key={t}
            onClick={() => router.replace(`/trivia/result?type=${t}`)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              type === t
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-8 pb-32">
        {/* Confetti / Trophy for winners */}
        {isWinner && (
          <div className="text-center mb-2">
            <div className="text-7xl animate-bounce inline-block">{config.emoji}</div>
          </div>
        )}

        {!isWinner && (
          <div className="text-center mb-2">
            <div className="text-5xl inline-block">{config.emoji}</div>
          </div>
        )}

        {/* Main result message */}
        <div className="text-center mb-8">
          <h1 className={`text-2xl font-black mb-2 ${isWinner ? 'text-white' : 'text-gray-300'}`}>
            {getHeaderTitle()}
          </h1>
          <p className="text-gray-400 text-sm">{getSubMessage()}</p>
        </div>

        {/* Reward GP (winner only) */}
        {isWinner && (
          <div className="text-center mb-6">
            <p className="text-gray-400 text-xs mb-1">이번 트리비아에서 획득한 보상</p>
            <p className="text-blue-400 text-4xl font-black">
              +{formatGP(MOCK_REWARD_GP)}
            </p>

            {/* Settlement in progress indicator (type A only) */}
            {isPerfect && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="w-4 h-4 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin" />
                <span className="text-gray-400 text-xs">보상 정산 중...</span>
              </div>
            )}
          </div>
        )}

        {/* Heart reward (spectator complete) */}
        {isSpectatorComplete && (
          <div className="text-center mb-6">
            <div className="bg-red-900/20 border border-red-800/50 rounded-2xl px-6 py-4 inline-block">
              <p className="text-red-300 text-base font-semibold">&#10084;&#65039; 하트 1개를 받았어요!</p>
            </div>
          </div>
        )}

        {/* Round result card */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5 mb-6">
          <h3 className="text-white font-semibold text-sm mb-4">이번 회차 결과</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">총 상금 GP</span>
              <span className="text-white font-semibold text-sm">{formatGP(MOCK_TOTAL_PRIZE_GP)}</span>
            </div>
            <div className="border-t border-gray-700" />
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">최종 생존자</span>
              <span className="text-white font-semibold text-sm">{formatNumber(MOCK_SURVIVOR_COUNT)} 명</span>
            </div>
          </div>
        </div>

        {/* Achievement badges (winner only) */}
        {isWinner && (
          <div className="mb-6">
            <h3 className="text-gray-400 text-xs font-semibold mb-3 uppercase tracking-wider">획득 배지</h3>
            <div className="flex flex-wrap gap-2">
              {isPerfect && (
                <>
                  <span className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-400 text-sm px-3 py-1.5 rounded-full font-semibold">
                    &#127941; 100% 정답
                  </span>
                  <span className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-400 text-sm px-3 py-1.5 rounded-full font-semibold">
                    &#127941; 무하트 클리어
                  </span>
                </>
              )}
              <span className="bg-blue-900/30 border border-blue-700/50 text-blue-400 text-sm px-3 py-1.5 rounded-full font-semibold">
                &#127941; 완주
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 px-5 py-4">
        <button
          onClick={() => router.push('/home')}
          className="w-full h-12 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/30"
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default function TriviaResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-sm">로딩 중...</div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
