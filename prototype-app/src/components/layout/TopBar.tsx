'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  transparent?: boolean;
}

export default function TopBar({
  title,
  showBack = false,
  rightAction,
  transparent = false,
}: TopBarProps) {
  const router = useRouter();

  return (
    <header
      className={`sticky top-0 z-40 flex items-center h-11 px-4 safe-top ${
        transparent ? 'bg-transparent' : 'bg-white border-b border-gray-100'
      }`}
    >
      <div className="w-8">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-8 h-8 -ml-1 rounded-full active:bg-gray-100"
            aria-label="뒤로가기"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </button>
        )}
      </div>

      <h1 className="flex-1 text-center text-base font-semibold text-gray-900 truncate px-2">
        {title}
      </h1>

      <div className="w-8 flex items-center justify-end">
        {rightAction}
      </div>
    </header>
  );
}
