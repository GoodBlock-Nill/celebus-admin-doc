'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';

interface FQHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  transparent?: boolean;
}

export default function FQHeader({
  title,
  showBack = true,
  rightAction,
  transparent = false,
}: FQHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={`sticky top-0 z-40 flex items-center h-12 px-4 safe-top ${
        transparent
          ? 'bg-transparent'
          : 'bg-white/95 backdrop-blur-md border-b border-violet-50'
      }`}
    >
      <div className="w-10">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-8 h-8 rounded-full active:bg-violet-50 transition-colors"
            aria-label="뒤로가기"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </button>
        )}
      </div>

      <h1 className="flex-1 text-center text-base font-bold text-gray-900 truncate">
        {title}
      </h1>

      <div className="w-10 flex items-center justify-end">
        {rightAction}
      </div>
    </header>
  );
}
