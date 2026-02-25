'use client';

import { create } from 'zustand';
import type { TriviaGame, TriviaQuestion, TriviaResult, TriviaResultType } from '@/lib/types';
import { mockTriviaGame, mockTriviaQuestions } from '@/mock/trivia';
import { mockUser } from '@/mock/user';

interface TriviaState {
  triviaGame: TriviaGame | null;
  currentQuestion: TriviaQuestion | null;
  questions: TriviaQuestion[];
  userHearts: number;
  isEliminated: boolean;
  isSpectating: boolean;
  selectedAnswer: number | null;
  timeRemaining: number;
  result: TriviaResult | null;
  answerQuestion: (choiceIndex: number) => void;
  startSpectating: () => void;
  nextQuestion: () => void;
  setResult: (type: TriviaResultType) => void;
}

export const useTriviaStore = create<TriviaState>((set, get) => ({
  triviaGame: mockTriviaGame,
  currentQuestion: mockTriviaQuestions[0] ?? null,
  questions: mockTriviaQuestions,
  userHearts: mockUser.hearts,
  isEliminated: false,
  isSpectating: false,
  selectedAnswer: null,
  timeRemaining: mockTriviaQuestions[0]?.timeLimit ?? 15,
  result: null,

  answerQuestion: (choiceIndex) => {
    const { currentQuestion, userHearts, questions, triviaGame } = get();
    if (!currentQuestion || !triviaGame) return;

    const isCorrect = choiceIndex === currentQuestion.correctIndex;
    set({ selectedAnswer: choiceIndex });

    if (!isCorrect) {
      const newHearts = userHearts - 1;
      if (newHearts <= 0) {
        set({ userHearts: 0, isEliminated: true });
      } else {
        set({ userHearts: newHearts });
      }
    }
  },

  startSpectating: () => set({ isSpectating: true }),

  nextQuestion: () => {
    const { currentQuestion, questions, triviaGame } = get();
    if (!currentQuestion || !triviaGame) return;

    const nextIndex = currentQuestion.questionNumber;
    if (nextIndex >= questions.length) {
      return;
    }

    const next = questions[nextIndex];
    set({
      currentQuestion: next,
      selectedAnswer: null,
      timeRemaining: next.timeLimit,
      triviaGame: {
        ...triviaGame,
        currentQuestion: next.questionNumber,
      },
    });
  },

  setResult: (type) => {
    const { triviaGame } = get();
    if (!triviaGame) return;

    const rewardMap: Record<TriviaResultType, number> = {
      A: 5000,
      B: 1200,
      C: 0,
      D: 0,
    };

    const result: TriviaResult = {
      type,
      rewardGP: rewardMap[type],
      correctCount: type === 'A' ? triviaGame.questionCount : Math.floor(triviaGame.questionCount * 0.7),
      totalQuestions: triviaGame.questionCount,
      finalRank: type === 'A' ? 1 : type === 'B' ? 12 : 0,
      totalParticipants: triviaGame.participantCount,
      survivorCount: triviaGame.survivorCount,
    };

    set({ result });
  },
}));
