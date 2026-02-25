'use client';

import type { ReactNode } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface QuickAccessCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}

export default function QuickAccessCard({
  icon,
  title,
  subtitle,
  onClick,
}: QuickAccessCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 active:scale-[0.97] transition-transform text-left"
    >
      <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{subtitle}</p>
      </div>
      <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </button>
  );
}
