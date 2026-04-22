'use client';

import { useRouter } from 'next/navigation';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
}

export default function EmptyState({
  emoji = '📋',
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  secondaryCtaLabel,
  secondaryCtaHref,
}: EmptyStateProps) {
  const router = useRouter();

  return (
    <div className="text-center py-16 px-6">
      <span className="text-4xl">{emoji}</span>
      <p className="text-sm font-semibold text-gray-900 mt-4">{title}</p>
      {description && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{description}</p>}
      {(ctaLabel || secondaryCtaLabel) && (
        <div className="flex gap-2 justify-center mt-5">
          {ctaLabel && (
            <button
              onClick={onCtaClick ?? (ctaHref ? () => router.push(ctaHref) : undefined)}
              className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-semibold active:scale-95 transition-transform"
            >
              {ctaLabel}
            </button>
          )}
          {secondaryCtaLabel && secondaryCtaHref && (
            <button
              onClick={() => router.push(secondaryCtaHref)}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold active:scale-95 transition-transform"
            >
              {secondaryCtaLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
