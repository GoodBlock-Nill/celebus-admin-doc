'use client';

import { useUIStore } from '@/stores/useUIStore';

export default function AppHeader() {
  const addToast = useUIStore((s) => s.addToast);

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-top">
      <div className="flex items-center h-12 px-4">
        <span className="text-base font-bold text-violet-700 flex-1">CELEBUS</span>
        <button className="relative mr-3 p-1" aria-label="알림" onClick={() => addToast('info', '알림 센터 (CEB-NTF-510)')}>
          <span className="text-lg">🔔</span>
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">3</span>
        </button>
        <button onClick={() => addToast('info', '응모권 내역 (CEB-FQ-210)')} className="text-xs font-medium text-violet-600 bg-violet-50 px-2.5 py-1.5 rounded-lg" aria-label="응모권">
          🎫 15
        </button>
      </div>
    </div>
  );
}
