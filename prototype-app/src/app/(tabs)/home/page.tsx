'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { mockGames } from '@/mock/games';
import { mockUser } from '@/mock/user';
import { mockTriviaGame } from '@/mock/trivia';
import { formatGP } from '@/lib/utils';
import { DebugPanel } from '@/components/ui/DebugPanel';
import type { Game } from '@/lib/types';
import type { TriviaDisplayMode, PmDisplayMode } from '@/components/ui/DebugPanel';

// TODO: Replace with store
const MOCK_USER = mockUser;
const MOCK_GAMES = mockGames;
const MOCK_TRIVIA = mockTriviaGame;

function getActiveGames(games: Game[]) {
  return games.filter((g) => g.status === 'Active');
}

export default function HomePage() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [triviaMode, setTriviaMode] = useState<TriviaDisplayMode>('LIVE');
  const [pmMode, setPmMode] = useState<PmDisplayMode>('HAS_ACTIVE');

  const user = MOCK_USER;
  const games = MOCK_GAMES;
  const trivia = MOCK_TRIVIA;

  const activeGames = getActiveGames(games);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(diff, 80));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      handleRefresh();
    }
    setPullDistance(0);
  };

  const predictionStatusText = () => {
    if (pmMode === 'HAS_ACTIVE') return `${activeGames.length > 0 ? activeGames.length : 3}개의 예측 진행중`;
    if (pmMode === 'HAS_CLOSED') return '결과 확인하기';
    return null;
  };

  const renderTriviaContent = () => {
    switch (triviaMode) {
      case 'LIVE':
        return (
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
              LIVE
            </span>
            <span className="text-gray-300 text-sm">퀴즈 진행중</span>
          </div>
        );
      case 'ONBOARDING':
        return (
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              입장중
            </span>
            <span className="text-gray-300 text-sm">곧 시작됩니다</span>
          </div>
        );
      case 'SCHEDULED_TODAY': {
        const scheduled = new Date(trivia.scheduledAt);
        const time = scheduled.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
        return (
          <p className="text-blue-400 text-sm flex items-center gap-1">
            <span>🕐</span> 오늘 {time} (UTC+9)
          </p>
        );
      }
      case 'SCHEDULED_OTHER':
        return (
          <p className="text-gray-400 text-sm flex items-center gap-1">
            <span>🕐</span> 12월 10일 13:00 (UTC+9)
          </p>
        );
      case 'NO_SCHEDULE':
        return <p className="text-gray-400 text-sm">다음 라이브 일정 준비중 입니다.</p>;
      default:
        return null;
    }
  };

  const triviaIsEnded = triviaMode === 'ENDED';

  return (
    <div
      className="min-h-screen bg-gray-950 pb-20"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {(isRefreshing || pullDistance > 20) && (
        <div
          className="flex items-center justify-center bg-gray-900 text-white text-xs py-2 transition-all"
          style={{ height: isRefreshing ? 40 : pullDistance / 2 }}
        >
          {isRefreshing ? (
            <span className="animate-spin mr-2">⟳</span>
          ) : (
            <span className="text-gray-400">당겨서 새로고침</span>
          )}
          {isRefreshing && <span>새로고침 중...</span>}
        </div>
      )}

      {/* Header */}
      <header className="safe-top bg-gray-950 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-white font-bold text-lg tracking-wider">GAME</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/history')}
              className="bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              {formatGP(user.gpBalance)}
            </button>
            <button className="text-white text-xl">🔔</button>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {user.nickname[0]}
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 pb-4 space-y-3">
        {/* Banner */}
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 relative">
          <div className="absolute right-4 top-4 text-5xl opacity-30">🎮</div>
          <p className="text-white font-bold text-xl leading-snug">CELEBUS GAME Zone</p>
          <p className="text-blue-100 text-sm mt-1">GP를 사용해 게임에 참여하고 보상을 얻으세요</p>
        </div>

        {/* Survival Trivia Card */}
        {triviaIsEnded ? (
          <div className="w-full bg-gray-900 rounded-2xl p-5 text-left opacity-50 pointer-events-none">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-xs font-semibold tracking-widest mb-1">SURVIVAL TRIVIA</p>
                <p className="text-white font-bold text-base">실시간 생존형 퀴즈 게임</p>
              </div>
              <span className="text-3xl">⚡</span>
            </div>
            <div className="mt-3">
              <span className="bg-gray-600 text-gray-300 text-xs font-bold px-2 py-0.5 rounded-full">준비중</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              <span>총 상금</span>
              <span className="text-amber-400 font-semibold">{formatGP(trivia.maxPrizePool)}</span>
            </div>
          </div>
        ) : (
          <button
            className="w-full bg-gray-900 rounded-2xl p-5 text-left active:opacity-80 transition-opacity"
            onClick={() => router.push('/trivia')}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-xs font-semibold tracking-widest mb-1">SURVIVAL TRIVIA</p>
                <p className="text-white font-bold text-base">실시간 생존형 퀴즈 게임</p>
              </div>
              <span className="text-3xl">⚡</span>
            </div>
            <div className="mt-3">{renderTriviaContent()}</div>
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              <span>총 상금</span>
              <span className="text-amber-400 font-semibold">{formatGP(trivia.maxPrizePool)}</span>
            </div>
          </button>
        )}

        {/* Prediction Market Card */}
        <button
          className="w-full bg-gray-900 rounded-2xl p-5 text-left active:opacity-80 transition-opacity"
          onClick={() => router.push('/prediction')}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-xs font-semibold tracking-widest mb-1">PREDICTION MARKET</p>
              <p className="text-white font-bold text-base">YES/NO 예측으로 GP를 획득하는 참여형 게임</p>
            </div>
            <span className="text-3xl">📊</span>
          </div>
          {predictionStatusText() && (
            <div className="mt-3 flex items-center gap-1.5">
              {pmMode === 'HAS_ACTIVE' && (
                <span className="text-orange-400 text-sm">🔥</span>
              )}
              <span className="text-gray-300 text-sm font-medium">{predictionStatusText()}</span>
            </div>
          )}
        </button>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Ranking Card */}
          <button
            className="bg-gray-900 rounded-2xl p-4 text-left active:opacity-80 transition-opacity"
            onClick={() => router.push('/ranking')}
          >
            <span className="text-3xl">🏆</span>
            <p className="text-white font-semibold text-sm mt-2">유저 랭킹</p>
            <span className="inline-block bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full mt-1">
              TOP 10
            </span>
          </button>

          {/* GP History Card */}
          <button
            className="bg-gray-900 rounded-2xl p-4 text-left active:opacity-80 transition-opacity"
            onClick={() => router.push('/history')}
          >
            <span className="text-3xl">🕐</span>
            <p className="text-white font-semibold text-sm mt-2">GP 히스토리</p>
            <p className="text-gray-500 text-xs mt-1">변동 내역 확인</p>
          </button>
        </div>
      </div>

      {/* Debug Panel */}
      <DebugPanel
        triviaMode={triviaMode}
        pmMode={pmMode}
        onTriviaChange={setTriviaMode}
        onPmChange={setPmMode}
      />
    </div>
  );
}
