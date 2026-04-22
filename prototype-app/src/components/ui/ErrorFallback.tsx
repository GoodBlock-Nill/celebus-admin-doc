'use client';

interface ErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
  message?: string;
}

export default function ErrorFallback({ error, onRetry, message }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <span className="text-3xl mb-3">😵</span>
      <p className="text-sm font-semibold text-gray-900">{message ?? '앗, 불러오지 못했어요'}</p>
      {error?.message && (
        <p className="text-xs text-gray-400 mt-1 text-center max-w-[280px] break-words">{error.message}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg text-xs font-semibold active:scale-95 transition-transform"
        >
          다시 불러오기
        </button>
      )}
    </div>
  );
}
