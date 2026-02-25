'use client';

import { cn } from '@/lib/utils';

interface ChoiceButtonProps {
  text: string;
  index: number;
  isSelected: boolean;
  isCorrect?: boolean;
  isRevealed: boolean;
  isDisabled?: boolean;
  percentage?: number;
  onClick: () => void;
}

export default function ChoiceButton({
  text,
  index,
  isSelected,
  isCorrect,
  isRevealed,
  isDisabled = false,
  percentage,
  onClick,
}: ChoiceButtonProps) {
  const isCorrectAndRevealed = isRevealed && isCorrect;
  const isWrongAndSelected = isRevealed && isSelected && !isCorrect;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled || isRevealed}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-4 rounded-xl border-2 text-left transition-all duration-200',
        // Base state (not revealed)
        !isRevealed && !isSelected && 'bg-gray-800 border-gray-600 text-white hover:border-gray-400 active:scale-[0.98]',
        // Selection confirmed state (before answer reveal): blue bg 20%, blue border
        !isRevealed && isSelected && 'bg-blue-500/20 border-blue-500 text-white',
        // Revealed: correct answer
        isCorrectAndRevealed && 'bg-blue-900/40 border-blue-500 text-white',
        // Revealed: wrong selected answer
        isWrongAndSelected && 'bg-red-900/40 border-red-500 text-white',
        // Revealed: unselected non-correct
        isRevealed && !isCorrect && !isSelected && 'bg-gray-800/60 border-gray-700 text-gray-400',
        // Disabled in spectate mode
        isDisabled && !isRevealed && 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed',
      )}
    >
      {/* Number badge */}
      <span
        className={cn(
          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold',
          !isRevealed && !isSelected && 'bg-gray-600 text-gray-300',
          !isRevealed && isSelected && 'bg-blue-500 text-white',
          isCorrectAndRevealed && 'bg-blue-500 text-white',
          isWrongAndSelected && 'bg-red-500 text-white',
          isRevealed && !isCorrect && !isSelected && 'bg-gray-700 text-gray-500',
          isDisabled && !isRevealed && 'bg-gray-700 text-gray-500',
        )}
      >
        {index + 1}
      </span>

      {/* Choice text */}
      <span className="flex-1 text-sm font-medium leading-snug">{text}</span>

      {/* Right section: badges and percentage */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* My selection badge (pre-reveal) */}
        {isSelected && !isRevealed && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-500/30 text-blue-300">
            내 선택
          </span>
        )}

        {/* My selection badge (post-reveal) */}
        {isSelected && isRevealed && (
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full font-semibold',
              isCorrect ? 'bg-blue-500/30 text-blue-300' : 'bg-red-500/30 text-red-300',
            )}
          >
            내 선택
          </span>
        )}

        {/* Correct mark */}
        {isCorrectAndRevealed && (
          <span className="text-blue-400 text-lg">⭕</span>
        )}

        {/* Percentage */}
        {isRevealed && percentage !== undefined && (
          <span className="text-gray-400 text-xs w-10 text-right">{percentage}%</span>
        )}
      </div>
    </button>
  );
}
