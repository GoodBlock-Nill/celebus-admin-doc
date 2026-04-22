'use client';

import { useRouter } from 'next/navigation';

interface ShortcutCardsProps {
  artistName: string;
}

export default function ShortcutCards({ artistName }: ShortcutCardsProps) {
  const router = useRouter();

  return (
    <div className="space-y-2">

      {/* 키우기 */}
      <button onClick={() => router.push('/fandom-level')}
        className="w-full bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl px-4 py-3.5 text-left active:scale-[0.98] transition-transform">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <span className="text-lg">🏆</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">Lv.3</span>
              <p className="text-xs font-semibold text-gray-900 truncate">{artistName} 키우기</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '60%' }} />
              </div>
              <span className="text-[9px] text-amber-600 shrink-0">60%</span>
            </div>
          </div>
          <span className="text-xs text-amber-600 font-medium shrink-0">→</span>
        </div>
      </button>

      {/* 응원하기 */}
      <button onClick={() => router.push('/support')}
        className="w-full bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-200 rounded-xl px-4 py-3.5 text-left active:scale-[0.98] transition-transform">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <span className="text-lg">💜</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-semibold text-pink-600 bg-pink-100 px-1.5 py-0.5 rounded-full">달성 임박!</span>
              <p className="text-xs font-semibold text-gray-900 truncate">☕ 커피차 서포트</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-violet-100 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: '85%' }} />
              </div>
              <span className="text-[9px] text-violet-600 shrink-0">85%</span>
            </div>
          </div>
          <span className="text-xs text-violet-600 font-medium shrink-0">→</span>
        </div>
      </button>

      {/* 오늘의 일정/소식 */}
      <button onClick={() => router.push('/info')}
        className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl px-4 py-3.5 text-left active:scale-[0.98] transition-transform">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-lg">📅</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">오늘</span>
              <p className="text-xs font-semibold text-gray-900 truncate">14:00 음악중심 출연</p>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">📰 신곡 뮤비 티저 공개 · +2건</p>
          </div>
          <span className="text-xs text-blue-500 font-medium shrink-0">→</span>
        </div>
      </button>

      {/* Raffle */}
      <button onClick={() => router.push('/raffle')}
        className="w-full bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl px-4 py-3.5 text-left active:scale-[0.98] transition-transform">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
            <span className="text-lg">🎁</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-semibold text-pink-600 bg-pink-100 px-1.5 py-0.5 rounded-full">D-5</span>
              <p className="text-xs font-semibold text-gray-900 truncate">사인앨범 래플</p>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">128명 참여중 · 응모권 15장 보유</p>
          </div>
          <span className="text-xs text-pink-500 font-medium shrink-0">응모 →</span>
        </div>
      </button>

    </div>
  );
}
