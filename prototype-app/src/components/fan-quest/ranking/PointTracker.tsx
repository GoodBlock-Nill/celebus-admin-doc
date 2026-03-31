'use client';

import { useFQStore } from '@/stores/useFQStore';
import { POINT_SOURCE_CONFIG } from '@/lib/fq-constants';
import type { PointSource } from '@/lib/fq-types';

export default function PointTracker() {
  const myStats = useFQStore((s) => s.myStats);
  const entries = Object.entries(myStats.pointBreakdown) as [PointSource, number][];
  const sortedEntries = entries.sort((a, b) => b[1] - a[1]);

  return (
    <div className="mx-4 p-4 bg-white rounded-2xl border border-violet-100">
      <p className="text-xs font-semibold text-gray-500 mb-3">포인트 적립 내역</p>
      <div className="space-y-2.5">
        {sortedEntries.map(([source, points]) => {
          const config = POINT_SOURCE_CONFIG[source];
          const percentage = (points / myStats.totalPoints) * 100;
          return (
            <div key={source} className="flex items-center gap-3">
              <span className="text-base w-6 text-center">{config.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-gray-700">{config.label}</span>
                  <span className="text-xs font-bold" style={{ color: config.color }}>
                    {points.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: config.color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
