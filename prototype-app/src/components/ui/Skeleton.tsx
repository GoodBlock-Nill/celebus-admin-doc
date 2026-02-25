'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export default function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  const baseClass = 'animate-pulse bg-gray-200';

  const variantClass = {
    text: 'rounded h-4',
    rect: 'rounded-xl',
    circle: 'rounded-full',
  }[variant];

  return <div className={cn(baseClass, variantClass, className)} />;
}

export function GameCardSkeleton() {
  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-4/5" />
          <Skeleton variant="text" className="w-3/5" />
        </div>
        <Skeleton variant="rect" className="w-14 h-5 rounded-full" />
      </div>
      <Skeleton variant="rect" className="w-full h-2 mb-3" />
      <div className="flex justify-between">
        <Skeleton variant="text" className="w-24 h-3" />
        <Skeleton variant="text" className="w-20 h-3" />
      </div>
    </div>
  );
}

export function RankingItemSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <Skeleton variant="rect" className="w-6 h-4" />
      <Skeleton variant="circle" className="w-9 h-9" />
      <div className="flex-1 space-y-1.5">
        <Skeleton variant="text" className="w-28 h-3" />
        <Skeleton variant="text" className="w-20 h-2.5" />
      </div>
      <Skeleton variant="text" className="w-16 h-3" />
    </div>
  );
}
