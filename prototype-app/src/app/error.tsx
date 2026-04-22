'use client';

import ErrorFallback from '@/components/ui/ErrorFallback';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh bg-white flex items-center justify-center">
      <ErrorFallback error={error} onRetry={reset} />
    </div>
  );
}
