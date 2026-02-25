'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatNumber } from '@/lib/utils';
import type { TriviaQuestion } from '@/lib/types';
import QuizQuestion from '@/components/game/QuizQuestion';
import LiveChat from '@/components/game/LiveChat';
import EliminateModal from '@/components/modals/EliminateModal';
import LeaveModal from '@/components/modals/LeaveModal';
import { TriviaDebugPanel } from '@/components/ui/TriviaDebugPanel';

const TIME_PER_QUESTION = 10;
const REVEAL_DURATION = 5000;

const mockQuestions: TriviaQuestion[] = [
  {
    id: 'q1',
    questionNumber: 1,
    text: {
      ko: 'BTS의 데뷔곡은?',
      en: "What is BTS's debut song?",
      jp: 'BTSのデビュー曲は？',
    },
    choices: [
      { ko: 'No More Dream', en: 'No More Dream', jp: 'No More Dream' },
      { ko: 'Boy In Luv', en: 'Boy In Luv', jp: 'Boy In Luv' },
      { ko: 'Danger', en: 'Danger', jp: 'Danger' },
      { ko: 'I Need U', en: 'I Need U', jp: 'I Need U' },
    ],
    correctIndex: 0,
    timeLimit: TIME_PER_QUESTION,
  },
  {
    id: 'q2',
    questionNumber: 2,
    text: {
      ko: 'BLACKPINK의 데뷔 연도는?',
      en: 'What year did BLACKPINK debut?',
      jp: 'BLACKPINKのデビュー年は？',
    },
    choices: [
      { ko: '2014년', en: '2014', jp: '2014年' },
      { ko: '2015년', en: '2015', jp: '2015年' },
      { ko: '2016년', en: '2016', jp: '2016年' },
      { ko: '2017년', en: '2017', jp: '2017年' },
    ],
    correctIndex: 2,
    timeLimit: TIME_PER_QUESTION,
  },
  {
    id: 'q3',
    questionNumber: 3,
    text: {
      ko: 'TWICE의 데뷔 서바이벌 프로그램 이름은?',
      en: 'What was the name of TWICE debut survival program?',
      jp: 'TWICEのデビューサバイバル番組の名前は？',
    },
    choices: [
      { ko: 'SIXTEEN', en: 'SIXTEEN', jp: 'SIXTEEN' },
      { ko: 'PRODUCE 101', en: 'PRODUCE 101', jp: 'PRODUCE 101' },
      { ko: 'IDOL SCHOOL', en: 'IDOL SCHOOL', jp: 'IDOL SCHOOL' },
      { ko: 'MY NAME IS', en: 'MY NAME IS', jp: 'MY NAME IS' },
    ],
    correctIndex: 0,
    timeLimit: TIME_PER_QUESTION,
  },
  {
    id: 'q4',
    questionNumber: 4,
    text: {
      ko: 'EXO가 소속된 엔터테인먼트 회사는?',
      en: 'Which entertainment company does EXO belong to?',
      jp: 'EXOが所属するエンタメ会社は？',
    },
    choices: [
      { ko: 'HYBE', en: 'HYBE', jp: 'HYBE' },
      { ko: 'JYP', en: 'JYP', jp: 'JYP' },
      { ko: 'YG', en: 'YG', jp: 'YG' },
      { ko: 'SM', en: 'SM', jp: 'SM' },
    ],
    correctIndex: 3,
    timeLimit: TIME_PER_QUESTION,
  },
  {
    id: 'q5',
    questionNumber: 5,
    text: {
      ko: 'aespa의 데뷔곡은?',
      en: "What is aespa's debut song?",
      jp: 'aespaのデビュー曲は？',
    },
    choices: [
      { ko: 'Next Level', en: 'Next Level', jp: 'Next Level' },
      { ko: 'Black Mamba', en: 'Black Mamba', jp: 'Black Mamba' },
      { ko: 'Savage', en: 'Savage', jp: 'Savage' },
      { ko: 'Drama', en: 'Drama', jp: 'Drama' },
    ],
    correctIndex: 1,
    timeLimit: TIME_PER_QUESTION,
  },
  {
    id: 'q6',
    questionNumber: 6,
    text: {
      ko: 'SEVENTEEN은 몇 명으로 구성되어 있나요?',
      en: 'How many members are in SEVENTEEN?',
      jp: 'SEVENTEENは何人で構成されていますか？',
    },
    choices: [
      { ko: '12명', en: '12 members', jp: '12人' },
      { ko: '13명', en: '13 members', jp: '13人' },
      { ko: '14명', en: '14 members', jp: '14人' },
      { ko: '17명', en: '17 members', jp: '17人' },
    ],
    correctIndex: 1,
    timeLimit: TIME_PER_QUESTION,
  },
  {
    id: 'q7',
    questionNumber: 7,
    text: {
      ko: 'Stray Kids의 팬덤 공식 이름은?',
      en: "What is Stray Kids' official fandom name?",
      jp: 'Stray Kidsの公式ファンダム名は？',
    },
    choices: [
      { ko: 'STAR', en: 'STAR', jp: 'STAR' },
      { ko: 'STAY', en: 'STAY', jp: 'STAY' },
      { ko: 'STANDS', en: 'STANDS', jp: 'STANDS' },
      { ko: 'STANS', en: 'STANS', jp: 'STANS' },
    ],
    correctIndex: 1,
    timeLimit: TIME_PER_QUESTION,
  },
  {
    id: 'q8',
    questionNumber: 8,
    text: {
      ko: 'NewJeans의 소속사는?',
      en: 'Which company does NewJeans belong to?',
      jp: 'NewJeansの所属会社は？',
    },
    choices: [
      { ko: 'ADOR', en: 'ADOR', jp: 'ADOR' },
      { ko: 'HYBE', en: 'HYBE', jp: 'HYBE' },
      { ko: 'BELIFT LAB', en: 'BELIFT LAB', jp: 'BELIFT LAB' },
      { ko: 'SOURCE MUSIC', en: 'SOURCE MUSIC', jp: 'SOURCE MUSIC' },
    ],
    correctIndex: 0,
    timeLimit: TIME_PER_QUESTION,
  },
  {
    id: 'q9',
    questionNumber: 9,
    text: {
      ko: 'LE SSERAFIM의 데뷔곡은?',
      en: "What is LE SSERAFIM's debut song?",
      jp: 'LE SSERAFIMのデビュー曲は？',
    },
    choices: [
      { ko: 'ANTIFRAGILE', en: 'ANTIFRAGILE', jp: 'ANTIFRAGILE' },
      { ko: 'FEARLESS', en: 'FEARLESS', jp: 'FEARLESS' },
      { ko: 'UNFORGIVEN', en: 'UNFORGIVEN', jp: 'UNFORGIVEN' },
      { ko: 'EASY', en: 'EASY', jp: 'EASY' },
    ],
    correctIndex: 1,
    timeLimit: TIME_PER_QUESTION,
  },
  {
    id: 'q10',
    questionNumber: 10,
    text: {
      ko: '(G)I-DLE의 팬덤 공식 이름은?',
      en: "What is (G)I-DLE's official fandom name?",
      jp: '(G)I-DLEの公式ファンダム名は？',
    },
    choices: [
      { ko: 'NEVERLAND', en: 'NEVERLAND', jp: 'NEVERLAND' },
      { ko: 'UNIVERSE', en: 'UNIVERSE', jp: 'UNIVERSE' },
      { ko: 'NEVERMIND', en: 'NEVERMIND', jp: 'NEVERMIND' },
      { ko: 'NEVERFALL', en: 'NEVERFALL', jp: 'NEVERFALL' },
    ],
    correctIndex: 0,
    timeLimit: TIME_PER_QUESTION,
  },
];

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

  const question = mockQuestions[currentQ];
  const isLastQuestion = currentQ === mockQuestions.length - 1;

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
            const allCorrect = finalCorrect === mockQuestions.length;
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
    const targetIndex = Math.min(n - 1, mockQuestions.length - 1);
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
          {currentQ + 1}/{mockQuestions.length}
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
        totalQuestions={mockQuestions.length}
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
