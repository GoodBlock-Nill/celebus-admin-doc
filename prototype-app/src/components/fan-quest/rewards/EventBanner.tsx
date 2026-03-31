'use client';

import { useFQStore } from '@/stores/useFQStore';

export default function EventBanner() {
  const season = useFQStore((s) => s.season);

  if (!season.isEventActive) return null;

  return (
    <div className="mx-4 p-3 bg-gradient-to-r from-pink-500 to-violet-500 rounded-xl text-white">
      <div className="flex items-center gap-2">
        <span className="text-xl">🎪</span>
        <div>
          <p className="text-xs font-bold">팬싸 일정 확정! 이벤트 보상 해금!</p>
          <p className="text-[10px] text-white/80">보상 탭에서 이벤트 보상을 확인해보세요</p>
        </div>
      </div>
    </div>
  );
}
