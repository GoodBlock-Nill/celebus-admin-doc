'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TRIVIA_STATUS_CONFIG } from '@/lib/constants';
import { formatGP, formatNumber, getRemainingTime } from '@/lib/utils';
import { TriviaDebugPanel } from '@/components/ui/TriviaDebugPanel';
import type { TriviaGame } from '@/lib/types';

const ENTER_TIMEOUT_MS = 10000;
const ENTER_DELAY_MS = 800;
const TOAST_DURATION_MS = 3000;

const mockTrivia: TriviaGame = {
  id: 'trivia-001',
  title: { ko: 'K-POP 상식 퀴즈 #12', en: 'K-POP Quiz #12', jp: 'K-POPクイズ #12' },
  description: {
    ko: '다양한 K-POP 상식을 테스트하세요!',
    en: 'Test your K-POP knowledge!',
    jp: 'K-POPの知識をテスト！',
  },
  status: 'SCHEDULED',
  scheduledAt: '2026-02-24T19:00:00+09:00',
  totalPrizeGP: 50000,
  participationCost: 10,
  maxParticipants: 500,
  participantCount: 312,
  questionCount: 10,
  timePerQuestion: 10,
  currentQuestion: 0,
  survivorCount: 0,
};

const MOCK_GP = 300;
const MOCK_HEARTS = 1;

export default function TriviaHomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [debugBypass, setDebugBypass] = useState(false);
  const [countdown, setCountdown] = useState(getRemainingTime(mockTrivia.scheduledAt));

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getRemainingTime(mockTrivia.scheduledAt));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalSecondsLeft =
    countdown.days * 86400 +
    countdown.hours * 3600 +
    countdown.minutes * 60 +
    countdown.seconds;

  const isEnterable = (totalSecondsLeft <= 600 && totalSecondsLeft > 0) || debugBypass;
  const hasStarted = totalSecondsLeft <= 0 && !debugBypass;
  const isLive = mockTrivia.status === 'LIVE';
  const isEnded = mockTrivia.status === 'ENDED';

  function getTooltipMessage(): string {
    if (isEnded) return '종료된 게임입니다';
    if (isLive) return '게임이 진행중입니다';
    if (hasStarted) return '이미 시작된 게임입니다';
    if (isEnterable) {
      if (countdown.minutes < 1) return '곧 게임이 시작돼요 시작 후에는 입장할 수 없어요';
      return `${countdown.minutes}분 뒤 게임이 시작돼요 시작 후에는 입장할 수 없어요`;
    }
    return '10분 전 부터 입장할 수 있어요';
  }

  function formatScheduledTime(): string {
    const date = new Date(mockTrivia.scheduledAt);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}월 ${day}일 ${hours}:${minutes} 시작`;
  }

  const [errorToast, setErrorToast] = useState(false);
  const enterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearEnterTimers = useCallback(() => {
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
      enterTimeoutRef.current = null;
    }
    if (enterDelayRef.current) {
      clearTimeout(enterDelayRef.current);
      enterDelayRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearEnterTimers();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [clearEnterTimers]);

  function showErrorToast() {
    setErrorToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setErrorToast(false);
    }, TOAST_DURATION_MS);
  }

  function handleEnter() {
    if (!isEnterable || isLoading) return;
    setIsLoading(true);
    setErrorToast(false);

    // 10초 타임아웃 시작
    enterTimeoutRef.current = setTimeout(() => {
      clearEnterTimers();
      setIsLoading(false);
      showErrorToast();
    }, ENTER_TIMEOUT_MS);

    // 프로토타입: 정상 시 800ms 후 이동
    enterDelayRef.current = setTimeout(() => {
      clearEnterTimers();
      router.push('/trivia/prestart');
    }, ENTER_DELAY_MS);
  }

  const statusConfig = TRIVIA_STATUS_CONFIG[mockTrivia.status];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col max-w-md mx-auto">
      {/* Error toast */}
      {errorToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-red-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 max-w-sm">
            <span className="flex-1">입장에 실패했습니다. 다시 시도해 주세요.</span>
            <button
              onClick={() => setErrorToast(false)}
              className="text-white/80 hover:text-white flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 sticky top-0 bg-gray-950/95 backdrop-blur-sm z-10">
        <button
          onClick={() => router.push('/home')}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors text-gray-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-base font-semibold">Survival Trivia</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/history')}
            className="text-sm text-blue-400 font-medium hover:text-blue-300"
          >
            {formatNumber(MOCK_GP)} GP
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
            G
          </div>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Banner */}
        <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 px-5 py-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-bold text-white">Survival Trivia</span>
          </div>
          <p className="text-blue-200 text-sm">실시간 생존형 퀴즈 게임</p>
        </div>

        {/* Game info */}
        <div className="px-5 py-6">
          {/* Status badge */}
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.label}
            </span>
          </div>

          {/* Game title */}
          <div className="flex items-start gap-2 mb-1">
            <span className="text-xl">🎤</span>
            <h1 className="text-xl font-bold text-white leading-snug">
              {mockTrivia.title.ko}
            </h1>
          </div>
          <p className="text-gray-400 text-sm mb-5 ml-8">{mockTrivia.description.ko}</p>

          {/* Schedule info */}
          <div className="mb-6">
            <p className="text-blue-400 font-semibold text-base">{formatScheduledTime()}</p>
            <p className="text-gray-500 text-xs mt-1">한국시간(KST) 기준</p>
            <p className="text-gray-500 text-xs">시작 10분 전부터 입장 가능 · 시작 후 입장 불가</p>
          </div>

          {/* Info card */}
          <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 mb-6 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-lg">🏆</span>
              <div>
                <span className="text-white font-semibold text-sm">총 상금 GP </span>
                <span className="text-blue-400 font-bold">{formatGP(mockTrivia.totalPrizeGP)}</span>
                <p className="text-gray-400 text-xs mt-0.5">
                  {isEnterable
                    ? `생존자 수에 따라 ${formatNumber(mockTrivia.survivorCount || 1)}분의 1로 분배`
                    : '생존자 수에 따라 분배돼요'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">⏱</span>
              <span className="text-gray-300 text-sm">
                문제당 제한 시간 <span className="text-white font-semibold">{mockTrivia.timePerQuestion}초</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">📋</span>
              <span className="text-gray-300 text-sm">
                총 <span className="text-white font-semibold">{mockTrivia.questionCount}문제</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">💰</span>
              <span className="text-gray-300 text-sm">
                참여 비용: <span className="text-white font-semibold">{formatGP(mockTrivia.participationCost)}</span>
              </span>
            </div>
          </div>

          {/* Hearts info */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-white">내 하트</span>
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className={i < MOCK_HEARTS ? 'text-base' : 'text-base opacity-30'}>
                    ❤️
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Usage guide */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">이용 안내</h3>
            <ul className="space-y-1.5 text-gray-400 text-sm">
              <li>• 최초 참여 시 ❤️ 하트 1개 지급</li>
              <li>• 오답 시 하트가 자동으로 소진돼요</li>
              <li>• 하트가 없으면 탈락해요</li>
              <li>• 탈락 후에도 관전 가능</li>
            </ul>
          </div>

          {/* Heart bonus */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">하트 보너스 획득 방법</h3>
            <ul className="space-y-1.5 text-gray-400 text-sm">
              <li>• 친구 초대 완료: +1 하트</li>
              <li>• 게임 끝까지 관전: +1 하트</li>
              <li>• 게임 완주 성공: +1 하트</li>
              <li>• 최대 3개까지 보유 가능</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Debug panel */}
      <TriviaDebugPanel
        variant="entry"
        debugBypass={debugBypass}
        onToggleBypass={() => setDebugBypass(prev => !prev)}
      />

      {/* Bottom CTA - fixed */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 px-5 py-4">
        {/* Tooltip */}
        {!isEnded && (
          <div className="flex justify-center mb-2">
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5">
              <p className="text-gray-300 text-xs text-center">{getTooltipMessage()}</p>
            </div>
          </div>
        )}

        {/* Button */}
        {isLive ? (
          <button
            disabled
            className="w-full h-12 bg-red-900/50 border border-red-800 text-red-400 rounded-xl text-sm font-semibold cursor-not-allowed"
          >
            게임 진행중
          </button>
        ) : (
          <button
            onClick={handleEnter}
            disabled={!isEnterable || isLoading || isEnded}
            className={`w-full h-12 rounded-xl text-sm font-bold transition-all ${
              isEnterable && !isLoading
                ? 'bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white shadow-lg shadow-blue-500/30'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            ) : isEnded ? (
              '종료된 게임'
            ) : hasStarted ? (
              '입장 마감'
            ) : (
              `${formatGP(mockTrivia.participationCost)}로 입장하기`
            )}
          </button>
        )}
      </div>
    </div>
  );
}
