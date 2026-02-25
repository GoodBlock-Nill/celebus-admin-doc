'use client';

import { formatNumber } from '@/lib/utils';

interface ProgressBarProps {
  yesPercent: number;
  noPercent: number;
  yesCount: number;
  noCount: number;
}

export default function ProgressBar({
  yesPercent,
  noPercent,
  yesCount,
  noCount,
}: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 flex items-center justify-center transition-all duration-500"
          style={{ width: `${yesPercent}%` }}
        >
          {yesPercent >= 15 && (
            <span className="text-[10px] font-bold text-white px-1">
              {yesPercent}%
            </span>
          )}
        </div>
        <div
          className="h-full bg-gradient-to-r from-red-400 to-red-500 flex items-center justify-center transition-all duration-500"
          style={{ width: `${noPercent}%` }}
        >
          {noPercent >= 15 && (
            <span className="text-[10px] font-bold text-white px-1">
              {noPercent}%
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-xs font-medium text-blue-600">YES</span>
          <span className="text-xs text-gray-500">{yesPercent}%</span>
          <span className="text-xs text-gray-400">({formatNumber(yesCount)}명)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">({formatNumber(noCount)}명)</span>
          <span className="text-xs text-gray-500">{noPercent}%</span>
          <span className="text-xs font-medium text-red-500">NO</span>
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
        </div>
      </div>
    </div>
  );
}
