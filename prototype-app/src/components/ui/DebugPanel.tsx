'use client';

import { DebugFab } from './DebugFab';

type TriviaDisplayMode = 'SCHEDULED_TODAY' | 'SCHEDULED_OTHER' | 'ONBOARDING' | 'LIVE' | 'NO_SCHEDULE' | 'ENDED';
type PmDisplayMode = 'HAS_ACTIVE' | 'HAS_CLOSED' | 'EMPTY';

const TRIVIA_BUTTONS: readonly [TriviaDisplayMode, string][] = [
  ['SCHEDULED_TODAY', '당일'],
  ['SCHEDULED_OTHER', '비당일'],
  ['ONBOARDING', '입장중'],
  ['LIVE', 'LIVE'],
  ['NO_SCHEDULE', '일정없음'],
  ['ENDED', '준비중'],
];

const PM_BUTTONS: readonly [PmDisplayMode, string][] = [
  ['HAS_ACTIVE', '예측있음'],
  ['HAS_CLOSED', '결과확인'],
  ['EMPTY', '표시없음'],
];

interface DebugPanelProps {
  triviaMode: TriviaDisplayMode;
  pmMode: PmDisplayMode;
  onTriviaChange: (mode: TriviaDisplayMode) => void;
  onPmChange: (mode: PmDisplayMode) => void;
}

export type { TriviaDisplayMode, PmDisplayMode };

export function DebugPanel({ triviaMode, pmMode, onTriviaChange, onPmChange }: DebugPanelProps) {
  return (
    <DebugFab bottomOffset="bottom-20">
      <div className="px-4 py-3 text-white text-sm font-medium border-b border-gray-700">
        🎛 상태 전환
      </div>
      <div className="px-4 pb-3 pt-2.5 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 text-xs font-mono w-6 shrink-0">ST</span>
          <div className="flex flex-wrap gap-1.5">
            {TRIVIA_BUTTONS.map(([mode, label]) => (
              <button
                key={mode}
                className={`text-xs px-2 py-1 rounded ${triviaMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                onClick={() => onTriviaChange(mode)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 text-xs font-mono w-6 shrink-0">PM</span>
          <div className="flex flex-wrap gap-1.5">
            {PM_BUTTONS.map(([mode, label]) => (
              <button
                key={mode}
                className={`text-xs px-2 py-1 rounded ${pmMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                onClick={() => onPmChange(mode)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </DebugFab>
  );
}
