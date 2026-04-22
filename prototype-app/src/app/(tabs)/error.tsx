'use client';

import ErrorFallback from '@/components/ui/ErrorFallback';

export default function TabsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh bg-white flex items-center justify-center pb-20">
      <ErrorFallback
        error={error}
        onRetry={reset}
        message="앗, 화면을 불러오지 못했어요"
      />
    </div>
  );
}
