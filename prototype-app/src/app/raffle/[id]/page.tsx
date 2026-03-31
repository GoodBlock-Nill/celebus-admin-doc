'use client';

import { use, useState } from 'react';
import { useFQStore } from '@/stores/useFQStore';
import FQHeader from '@/components/layout/FQHeader';

export default function RaffleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { raffles, ticketBalance, enterRaffle, triggerCelebration } = useFQStore();
  const raffle = raffles.find((r) => r.id === id);
  const [entryCount, setEntryCount] = useState(1);

  if (!raffle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">래플을 찾을 수 없습니다</p>
      </div>
    );
  }

  const maxEntry = Math.min(ticketBalance, 99);
  const canEnter = raffle.status === 'ACTIVE' && ticketBalance >= entryCount;

  const handleEnter = () => {
    if (!canEnter) return;
    enterRaffle(raffle.id, entryCount);
    triggerCelebration('reward', { chapter: '래플 응모 완료' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <FQHeader title="RAFFLE" />

      <div className="px-4 py-4 space-y-4">
        {/* Basic info */}
        <div className="p-4 bg-white rounded-2xl border border-violet-100">
          <div className="flex items-start gap-3 mb-2">
            <span className="text-4xl leading-none">{raffle.thumbnailEmoji}</span>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-violet-500 font-semibold">
                [{raffle.artistName}] RAFFLE
              </span>
              <h2 className="text-base font-bold text-gray-900 mt-0.5">{raffle.title}</h2>
            </div>
          </div>
          <p className="text-xs text-gray-500">{raffle.description}</p>
          <div className="mt-3 p-2.5 bg-amber-50 rounded-xl">
            <p className="text-xs font-semibold text-amber-700">🎁 {raffle.reward}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-white rounded-xl border border-gray-200 text-center">
            <p className="text-lg font-black text-violet-700">{raffle.totalUsers}</p>
            <p className="text-[10px] text-gray-400">참여자</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-gray-200 text-center">
            <p className="text-lg font-black text-violet-700">{raffle.totalTickets}</p>
            <p className="text-[10px] text-gray-400">총 응모권</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-pink-200 text-center">
            <p className="text-lg font-black text-pink-600">{raffle.myTickets}</p>
            <p className="text-[10px] text-gray-400">내 응모권</p>
          </div>
        </div>

        {/* Win probability hint */}
        {raffle.status === 'ACTIVE' && raffle.totalTickets > 0 && (
          <div className="p-3 bg-violet-50 rounded-xl">
            <p className="text-xs text-violet-700">
              현재 당첨 확률:{' '}
              <span className="font-bold">
                {raffle.myTickets > 0
                  ? `${((raffle.myTickets / raffle.totalTickets) * 100).toFixed(1)}%`
                  : '0%'}
              </span>
            </p>
          </div>
        )}

        {/* Status messages for non-active */}
        {raffle.status === 'CLOSED' && (
          <div className="p-4 bg-amber-50 rounded-xl text-center">
            <p className="text-sm font-semibold text-amber-700">⏳ 현재 집계중입니다</p>
            <p className="text-xs text-amber-600 mt-1">잠시 후 결과가 발표됩니다</p>
          </div>
        )}

        {raffle.status === 'ENDED' && raffle.resultStatus === 'WON' && (
          <div className="p-4 bg-emerald-50 rounded-xl text-center">
            <p className="text-lg font-bold text-emerald-700">🎉 축하합니다! 당첨되었습니다!</p>
            <p className="text-xs text-emerald-600 mt-1">{raffle.reward}</p>
          </div>
        )}

        {raffle.status === 'ENDED' && raffle.resultStatus === 'LOST' && (
          <div className="p-4 bg-gray-100 rounded-xl text-center">
            <p className="text-sm text-gray-600">아쉽게도 당첨되지 않았어요</p>
            <p className="text-xs text-gray-400 mt-1">다음 기회에 다시 도전해주세요!</p>
          </div>
        )}
      </div>

      {/* Entry form – fixed bottom */}
      {raffle.status === 'ACTIVE' && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 p-4 safe-bottom">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">
              사용 가능한 응모권: <span className="font-semibold text-pink-500">{ticketBalance}장</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setEntryCount(Math.max(1, entryCount - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-700 font-bold text-lg active:bg-gray-50 shadow-sm"
              >
                −
              </button>
              <span className="w-8 text-center font-bold text-gray-900">{entryCount}</span>
              <button
                onClick={() => setEntryCount(Math.min(maxEntry, entryCount + 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-700 font-bold text-lg active:bg-gray-50 shadow-sm"
              >
                +
              </button>
            </div>
            <button
              onClick={handleEnter}
              disabled={!canEnter}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
                canEnter
                  ? 'bg-violet-600 text-white active:bg-violet-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              🎫 응모하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
