'use client';

interface VotingButtonsProps {
  onVote: (choice: 'YES' | 'NO') => void;
  disabled?: boolean;
}

export default function VotingButtons({ onVote, disabled = false }: VotingButtonsProps) {
  return (
    <div className="flex gap-3">
      <button
        onClick={() => !disabled && onVote('YES')}
        disabled={disabled}
        className={`flex-1 h-12 rounded-xl font-bold text-base tracking-wide transition-opacity active:opacity-70 ${
          disabled
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white'
        }`}
      >
        YES
      </button>
      <button
        onClick={() => !disabled && onVote('NO')}
        disabled={disabled}
        className={`flex-1 h-12 rounded-xl font-bold text-base tracking-wide transition-opacity active:opacity-70 ${
          disabled
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-red-600 text-white'
        }`}
      >
        NO
      </button>
    </div>
  );
}
