'use client';

import type { TriviaQuestion } from '@/lib/types';
import ChoiceButton from './ChoiceButton';

interface QuizQuestionProps {
  question: TriviaQuestion;
  timeLimit: number;
  timeLeft: number;
  onAnswer: (index: number) => void;
  isRevealed: boolean;
  selectedIndex: number | null;
  isSpectateMode?: boolean;
  percentages?: number[];
}

export default function QuizQuestion({
  question,
  timeLimit,
  timeLeft,
  onAnswer,
  isRevealed,
  selectedIndex,
  isSpectateMode = false,
  percentages,
}: QuizQuestionProps) {
  const timerPercent = (timeLeft / timeLimit) * 100;

  return (
    <div className="flex flex-col gap-4">
      {/* Timer bar */}
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${timerPercent}%`,
            backgroundColor: timerPercent > 30 ? '#3b82f6' : '#ef4444',
          }}
        />
      </div>

      {/* Question text */}
      <div className="px-1">
        <p className="text-white text-lg font-bold text-center leading-snug">
          {question.text.ko}
        </p>
      </div>

      {/* Choices */}
      <div className={`flex flex-col gap-3${isSpectateMode ? ' pointer-events-none' : ''}`}>
        {question.choices.map((choice, idx) => (
          <ChoiceButton
            key={idx}
            text={choice.ko}
            index={idx}
            isSelected={selectedIndex === idx}
            isCorrect={idx === question.correctIndex}
            isRevealed={isRevealed}
            isDisabled={isSpectateMode}
            percentage={percentages ? percentages[idx] : undefined}
            onClick={() => !isSpectateMode && onAnswer(idx)}
          />
        ))}
      </div>
    </div>
  );
}
