'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatNumber } from '@/lib/utils';
import QuizQuestion from '@/components/game/QuizQuestion';
import LiveChat from '@/components/game/LiveChat';
import EliminateModal from '@/components/modals/EliminateModal';
import LeaveModal from '@/components/modals/LeaveModal';
import { TriviaDebugPanel } from '@/components/ui/TriviaDebugPanel';
import { mockTriviaQuestions } from '@/mock/trivia';

const TIME_PER_QUESTION = 10;
const REVEAL_DURATION = 5000;

const MOCK_SURVIVOR_START = 312;

// Generate random percentages that sum to ~100
function generatePercentages(correctIndex: number): number[] {
  const base = [8, 12, 15, 10];
  base[correctIndex] = 55;
  const sum = base.reduce((a, b) => a + b, 0);
  return base.map(v => Math.round((v / sum) * 100));
}

export default function TriviaPlayPage() {
  const router = useRouter();
  const [currentQ, setCurrentQ] = useState(0);
  const [hearts, setHearts] = useState(1);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [survivors, setSurvivors] = useState(MOCK_SURVIVOR_START);
  const [percentages, setPercentages] = useState<number[]>([]);
  const [showEliminateModal, setShowEliminateModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [sendFailed, setSendFailed] = useState(false);
  const [autoCorrect, setAutoCorrect] = useState(false);

  const question = mockTriviaQuestions[currentQ];
  const isLastQuestion = currentQ === mockTriviaQuestions.length - 1;

  // Timer countdown
  useEffect(() => {
    if (isRevealed) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQ, isRevealed]);

  const handleReveal = useCallback(
    (answeredIndex: number | null) => {
      const correct = answeredIndex === question.correctIndex;
      const timedOut = answeredIndex === null;

      setIsRevealed(true);
      setPercentages(generatePercentages(question.correctIndex));

      // Survivors update at answer reveal timing
      if (currentQ > 0) {
        setSurvivors(prev => Math.max(1, Math.floor(prev * (0.75 + Math.random() * 0.15))));
      }

      if (timedOut) {
        // Timeout = instant elimination regardless of hearts
        setIsCorrect(false);
        setTimeout(() => {
          if (isLastQuestion) {
            router.push('/trivia/result?type=D');
          } else {
            setShowEliminateModal(true);
          }
        }, REVEAL_DURATION);
        return;
      }

      if (correct) {
        setIsCorrect(true);
        setCorrectCount(prev => prev + 1);
        // Advance to next question after reveal
        setTimeout(() => {
          if (isLastQuestion) {
            const finalCorrect = correctCount + 1;
            const allCorrect = finalCorrect === mockTriviaQuestions.length;
            router.push(`/trivia/result?type=${allCorrect ? 'A' : 'B'}`);
          } else {
            goNextQuestion();
          }
        }, REVEAL_DURATION);
      } else {
        // Wrong answer
        setIsCorrect(false);
        const newHearts = hearts - 1;
        setHearts(newHearts);

        setTimeout(() => {
          if (isLastQuestion) {
            router.push('/trivia/result?type=D');
          } else if (newHearts <= 0) {
            setShowEliminateModal(true);
          } else {
            goNextQuestion();
          }
        }, REVEAL_DURATION);
      }
    },
    [question, hearts, isLastQuestion, currentQ, correctCount, router],
  );

  function handleTimeout() {
    setSelectedAnswer(null);
    handleReveal(null);
  }

  function handleAnswer(index: number) {
    if (isRevealed || selectedAnswer !== null) return;
    setSelectedAnswer(index);

    // Simulate optimistic update with occasional send failure (10% chance)
    const failed = Math.random() < 0.1;
    if (failed) {
      setSendFailed(true);
      setTimeout(() => setSendFailed(false), 3000);
    }

    handleReveal(index);
  }

  function goNextQuestion() {
    setCurrentQ(prev => prev + 1);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setIsCorrect(null);
    setTimeLeft(TIME_PER_QUESTION);
    setPercentages([]);
  }

  function handleSkipToQuestion(n: number) {
    const targetIndex = Math.min(n - 1, mockTriviaQuestions.length - 1);
    setCurrentQ(targetIndex);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setIsCorrect(null);
    setTimeLeft(TIME_PER_QUESTION);
    setPercentages([]);
  }

  // Auto-correct: automatically select the correct answer after a short delay
  useEffect(() => {
    if (autoCorrect && !isRevealed && selectedAnswer === null) {
      const timer = setTimeout(() => {
        handleAnswer(question.correctIndex);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoCorrect, isRevealed, selectedAnswer, currentQ]);

  function handleSpectate() {
    setShowEliminateModal(false);
    router.push('/trivia/spectate');
  }

  function handleEliminateLeave() {
    setShowEliminateModal(false);
    router.push('/trivia');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col max-w-md mx-auto">
      {/* Send failure toast */}
      {sendFailed && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] animate-fadeIn">
          <div className="flex items-center gap-2 bg-red-900/90 border border-red-700 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
            <svg className="w-5 h-5 text-red-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>응답 전송에 실패했습니다</span>
            <button
              onClick={() => setSendFailed(false)}
              className="ml-2 text-red-300 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <button
          onClick={() => setShowLeaveModal(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors text-gray-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {/* Center: empty placeholder */}
        <div className="w-9" />
      </header>

      {/* Status bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-800">
        {/* Hearts */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className={`text-base transition-all duration-300 ${
                i < hearts ? '' : 'opacity-20 grayscale'
              }`}
            >
              ❤️
            </span>
          ))}
        </div>

        {/* Question number */}
        <span className="text-white font-bold text-sm">
          {currentQ + 1}/{mockTriviaQuestions.length}
        </span>

        {/* Survivors */}
        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
          <span>👥</span>
          <span>생존 {formatNumber(survivors)}명</span>
        </div>
      </div>

      {/* Result banner */}
      {isRevealed && isCorrect !== null && (
        <div
          className={`px-5 py-3 text-center ${
            isCorrect ? 'bg-blue-900/30 border-b border-blue-800' : 'bg-red-900/30 border-b border-red-800'
          }`}
        >
          <p className={`text-base font-bold ${isCorrect ? 'text-blue-300' : 'text-red-300'}`}>
            {isCorrect ? '정답입니다' : '오답입니다'}
          </p>
          <p className="text-gray-400 text-xs mt-0.5">
            {isCorrect
              ? '🙌 정답입니다! 다음 라운드로 진출합니다'
              : '아쉽네요, 다음엔 맞혀보시죠!'}
          </p>
        </div>
      )}

      {/* Game area */}
      <div className="flex-1 flex flex-col px-5 py-4 gap-4 overflow-y-auto pb-0">
        <QuizQuestion
          question={question}
          timeLimit={TIME_PER_QUESTION}
          timeLeft={timeLeft}
          onAnswer={handleAnswer}
          isRevealed={isRevealed}
          selectedIndex={selectedAnswer}
          percentages={isRevealed ? percentages : undefined}
        />

        {/* Live chat */}
        <div className="mt-auto pt-4 border-t border-gray-800 pb-4">
          <LiveChat />
        </div>
      </div>

      {/* Debug panel */}
      <TriviaDebugPanel
        variant="play"
        hearts={hearts}
        onHeartsChange={setHearts}
        currentQuestion={currentQ + 1}
        totalQuestions={mockTriviaQuestions.length}
        onSkipToQuestion={handleSkipToQuestion}
        autoCorrect={autoCorrect}
        onToggleAutoCorrect={() => setAutoCorrect(prev => !prev)}
      />

      {/* Modals */}
      {showEliminateModal && (
        <EliminateModal
          onSpectate={handleSpectate}
          onLeave={handleEliminateLeave}
        />
      )}
      {showLeaveModal && (
        <LeaveModal onClose={() => setShowLeaveModal(false)} />
      )}
    </div>
  );
}
