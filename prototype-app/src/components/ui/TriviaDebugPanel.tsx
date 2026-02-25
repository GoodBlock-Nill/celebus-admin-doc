'use client';

import { useRouter } from 'next/navigation';
import { DebugFab } from './DebugFab';

interface TriviaDebugPanelProps {
  variant: 'entry' | 'play';
  debugBypass?: boolean;
  onToggleBypass?: () => void;
  hearts?: number;
  onHeartsChange?: (n: number) => void;
  currentQuestion?: number;
  totalQuestions?: number;
  onSkipToQuestion?: (n: number) => void;
  autoCorrect?: boolean;
  onToggleAutoCorrect?: () => void;
}

const RESULT_TYPES = ['A', 'B', 'C', 'D'] as const;

const NAV_SHORTCUTS = [
  { label: '홈', path: '/home' },
  { label: '대기실', path: '/trivia/prestart' },
  { label: '플레이', path: '/trivia/play' },
  { label: '관전', path: '/trivia/spectate' },
] as const;

export function TriviaDebugPanel({
  variant,
  debugBypass,
  onToggleBypass,
  hearts,
  onHeartsChange,
  currentQuestion,
  totalQuestions,
  onSkipToQuestion,
  autoCorrect,
  onToggleAutoCorrect,
}: TriviaDebugPanelProps) {
  const router = useRouter();

  return (
    <DebugFab bottomOffset="bottom-24">
      <div className="px-4 py-3 text-white text-sm font-medium border-b border-gray-700">
        🎛 디버그
      </div>
      <div className="px-4 pb-3 pt-2.5 space-y-2.5">
        {variant === 'entry' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs font-mono shrink-0">시간</span>
              <button
                className={`text-xs px-2.5 py-1 rounded ${
                  debugBypass ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
                onClick={onToggleBypass}
              >
                {debugBypass ? '시간 무시 ON' : '시간 무시 OFF'}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-xs font-mono shrink-0">이동</span>
              <div className="flex flex-wrap gap-1.5">
                {NAV_SHORTCUTS.map(({ label, path }) => (
                  <button
                    key={path}
                    className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                    onClick={() => router.replace(path)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-xs font-mono shrink-0">결과</span>
              <div className="flex flex-wrap gap-1.5">
                {RESULT_TYPES.map(type => (
                  <button
                    key={type}
                    className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                    onClick={() => router.replace(`/trivia/result?type=${type}`)}
                  >
                    결과{type}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {variant === 'play' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs font-mono shrink-0">하트</span>
              <div className="flex gap-1.5">
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    className={`text-xs px-2.5 py-1 rounded ${
                      hearts === n ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                    onClick={() => onHeartsChange?.(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs font-mono shrink-0">건너뛰기</span>
              <div className="flex gap-1.5">
                {[5, 10].map(n => (
                  <button
                    key={n}
                    className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                    onClick={() => onSkipToQuestion?.(n)}
                    disabled={currentQuestion !== undefined && n <= currentQuestion}
                  >
                    Q→{n}
                  </button>
                ))}
              </div>
              {currentQuestion !== undefined && totalQuestions !== undefined && (
                <span className="text-gray-500 text-xs">
                  ({currentQuestion}/{totalQuestions})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs font-mono shrink-0">자동정답</span>
              <button
                className={`text-xs px-2.5 py-1 rounded ${
                  autoCorrect ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
                onClick={onToggleAutoCorrect}
              >
                {autoCorrect ? 'ON' : 'OFF'}
              </button>
            </div>
          </>
        )}
      </div>
    </DebugFab>
  );
}
