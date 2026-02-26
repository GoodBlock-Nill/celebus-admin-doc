'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatNumber } from '@/lib/utils';
import LeaveModal from '@/components/modals/LeaveModal';
import ReconnectModal from '@/components/modals/ReconnectModal';

const MOCK_HEARTS = 1;
const MOCK_PARTICIPANTS = 312;

const GAME_TITLE = 'K-POP 상식 퀴즈 #12';
const QUESTION_COUNT = 10;
const TIME_PER_QUESTION = 10;

// Scheduled at: 2026-02-24T19:00:00+09:00 (used for LIVE countdown)
const SCHEDULED_AT = '2026-02-24T19:00:00+09:00';

export default function PrestartPage() {
  const router = useRouter();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [liveTimeLeft, setLiveTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [participants, setParticipants] = useState(MOCK_PARTICIPANTS);

  // Live countdown timer
  useEffect(() => {
    function updateLiveTimer() {
      const now = new Date().getTime();
      const target = new Date(SCHEDULED_AT).getTime();
      const diff = Math.max(0, target - now);

      setLiveTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });

      // Trigger countdown phase when timer reaches 0 (in real app this is server-triggered)
      if (diff <= 0 && !isCountingDown) {
        setIsCountingDown(true);
      }
    }

    updateLiveTimer();
    const interval = setInterval(updateLiveTimer, 1000);
    return () => clearInterval(interval);
  }, [isCountingDown]);

  // Simulate participant count increment
  useEffect(() => {
    const interval = setInterval(() => {
      setParticipants(prev => {
        const next = prev + Math.floor(Math.random() * 3);
        return Math.min(next, 500);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 5-second countdown when isCountingDown = true
  useEffect(() => {
    if (!isCountingDown) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/trivia/play');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCountingDown, router]);

  function handleBack() {
    if (isCountingDown) return; // disabled during countdown
    setShowLeaveModal(true);
  }

  function formatLiveTime() {
    const { hours, minutes, seconds } = liveTimeLeft;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <button
          onClick={handleBack}
          disabled={isCountingDown}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
            isCountingDown
              ? 'text-gray-700 cursor-not-allowed'
              : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {!isCountingDown && (
          <span className="text-base font-semibold">Survival Trivia</span>
        )}
        <div className="w-9" /> {/* Spacer */}
      </header>

      {/* Status bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        {/* Hearts */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={`text-base ${i < MOCK_HEARTS ? '' : 'opacity-25'}`}>
              ❤️
            </span>
          ))}
        </div>

        {/* Participants */}
        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
          <span>👥</span>
          <span>{formatNumber(participants)}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        {isCountingDown ? (
          /* Countdown phase */
          <div className="flex flex-col items-center justify-center flex-1">
            <div
              key={countdown}
              className="text-9xl font-black text-blue-400"
              style={{
                animation: 'countdownPop 0.4s ease-out',
              }}
            >
              {countdown}
            </div>
          </div>
        ) : (
          /* Waiting phase */
          <>
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="text-3xl font-black tracking-widest text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                SURVIVAL TRIVIA
              </div>
              <p className="text-white font-semibold text-lg">{GAME_TITLE}</p>
            </div>

            {/* LIVE timer */}
            <div className="flex items-center gap-3 mb-8">
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
                LIVE
              </span>
              <span className="text-white font-mono text-2xl font-bold tracking-widest">
                {formatLiveTime()}
              </span>
            </div>

            {/* Rules card */}
            <div className="w-full bg-gray-800/60 border border-gray-700 rounded-2xl p-5 mb-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-gray-400 text-lg mt-0.5">•</span>
                  <div>
                    <p className="text-white text-sm font-medium">
                      총 {QUESTION_COUNT}문제
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      각 문제는 {TIME_PER_QUESTION}초 (서버 기준)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gray-400 text-lg mt-0.5">•</span>
                  <div>
                    <p className="text-white text-sm font-medium">
                      오답 시 ❤️ 하트 자동 소진
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      하트가 없으면 즉시 탈락
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Spectate bonus info */}
            <div className="w-full text-center space-y-1 mb-8">
              <p className="text-gray-400 text-sm">탈락해도 끝까지 관전할 수 있어요</p>
              <p className="text-gray-400 text-sm">끝까지 관전하면 ❤️ 하트 1개 지급</p>
            </div>

            {/* Start announcement */}
            <div className="w-full bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 text-center">
              <p className="text-blue-300 text-sm">정시가 되면</p>
              <p className="text-blue-200 font-semibold text-sm mt-0.5">
                5초 카운트다운 후 Stage 1 시작
              </p>
            </div>
          </>
        )}
      </div>

      {/* Dev shortcut: force start countdown */}
      {!isCountingDown && (
        <div className="px-5 pb-6 space-y-2">
          <button
            onClick={() => setIsCountingDown(true)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            게임 시작 (테스트용)
          </button>
          <button
            onClick={() => setShowReconnectModal(true)}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            재연결 테스트
          </button>
        </div>
      )}

      {/* Leave modal */}
      {showLeaveModal && (
        <LeaveModal onClose={() => setShowLeaveModal(false)} />
      )}

      {/* Reconnect modal */}
      {showReconnectModal && (
        <ReconnectModal
          onSpectate={() => {
            setShowReconnectModal(false);
            router.push('/trivia/spectate');
          }}
          onLeave={() => {
            setShowReconnectModal(false);
            router.push('/trivia');
          }}
        />
      )}

      <style jsx global>{`
        @keyframes countdownPop {
          0% { transform: scale(1.4); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
