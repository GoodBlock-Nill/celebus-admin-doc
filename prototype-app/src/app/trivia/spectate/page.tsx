'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatNumber } from '@/lib/utils';
import type { TriviaQuestion } from '@/lib/types';
import QuizQuestion from '@/components/game/QuizQuestion';
import LiveChat from '@/components/game/LiveChat';
import LeaveModal from '@/components/modals/LeaveModal';

const TIME_PER_QUESTION = 10;
const REVEAL_DURATION = 5000;

// Same questions as play page
const spectateQuestions: TriviaQuestion[] = [
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

const SPECTATE_START_Q = 3; // Start from Q4 (spectator joined mid-game)
const MOCK_SURVIVOR_COUNT = 80;

function generatePercentages(correctIndex: number): number[] {
  const base = [8, 12, 15, 10];
  base[correctIndex] = 55;
  const sum = base.reduce((a, b) => a + b, 0);
  return base.map(v => Math.round((v / sum) * 100));
}

export default function SpectatePage() {
  const router = useRouter();
  const [currentQ, setCurrentQ] = useState(SPECTATE_START_Q);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [isRevealed, setIsRevealed] = useState(false);
  const [survivors, setSurvivors] = useState(MOCK_SURVIVOR_COUNT);
  const [percentages, setPercentages] = useState<number[]>([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const question = spectateQuestions[currentQ];
  const isLastQuestion = currentQ === spectateQuestions.length - 1;

  // Timer
  useEffect(() => {
    if (isRevealed) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleReveal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQ, isRevealed]);

  const handleReveal = useCallback(() => {
    setIsRevealed(true);
    setPercentages(generatePercentages(question.correctIndex));

    setTimeout(() => {
      if (isLastQuestion) {
        router.push('/trivia/result?type=C');
      } else {
        goNextQuestion();
      }
    }, REVEAL_DURATION);
  }, [question, isLastQuestion, router]);

  function goNextQuestion() {
    setCurrentQ(prev => prev + 1);
    setIsRevealed(false);
    setTimeLeft(TIME_PER_QUESTION);
    setPercentages([]);
    setSurvivors(prev => Math.max(1, Math.floor(prev * 0.85)));
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col max-w-md mx-auto">
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
        <button
          onClick={() => router.push('/trivia/result?type=C')}
          className="text-xs text-purple-400 font-medium hover:text-purple-300"
        >
          결과 →
        </button>
      </header>

      {/* Status bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-800">
        {/* Spectating badge */}
        <span className="bg-purple-900/50 border border-purple-700 text-purple-300 text-xs font-bold px-2.5 py-1 rounded-full">
          관전중
        </span>

        {/* Question number */}
        <span className="text-white font-bold text-sm">
          {currentQ + 1}/{spectateQuestions.length}
        </span>

        {/* Survivors */}
        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
          <span>👥</span>
          <span>{formatNumber(survivors)}</span>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 flex flex-col px-5 py-4 gap-4 overflow-y-auto pb-0">
        <QuizQuestion
          question={question}
          timeLimit={TIME_PER_QUESTION}
          timeLeft={timeLeft}
          onAnswer={() => {}}
          isRevealed={isRevealed}
          selectedIndex={null}
          isSpectateMode
          percentages={isRevealed ? percentages : undefined}
        />

        {/* Live chat */}
        <div className="mt-auto pt-4 border-t border-gray-800 pb-4">
          <LiveChat />
        </div>
      </div>

      {/* Leave modal */}
      {showLeaveModal && (
        <LeaveModal onClose={() => setShowLeaveModal(false)} isSpectateMode />
      )}
    </div>
  );
}
