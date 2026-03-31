'use client';

import { useFQStore } from '@/stores/useFQStore';

export default function MyContribution() {
  const myContribution = useFQStore((s) => s.myContribution);

  return (
    <div className="p-4 bg-white rounded-2xl border border-violet-100">
      <p className="text-xs font-semibold text-gray-500 mb-3">내 기여도</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-violet-50 rounded-xl">
          <p className="text-xl font-black text-violet-700">{myContribution.activityCount}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">활동 건수</p>
        </div>
        <div className="text-center p-3 bg-pink-50 rounded-xl">
          <p className="text-xl font-black text-pink-600">{myContribution.percentage}%</p>
          <p className="text-[10px] text-gray-500 mt-0.5">전체 비율</p>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-xl">
          <p className="text-xl font-black text-amber-600">{myContribution.rank}위</p>
          <p className="text-[10px] text-gray-500 mt-0.5">기여 순위</p>
        </div>
      </div>
    </div>
  );
}
