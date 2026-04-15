'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SubPageHeader from '@/components/layout/SubPageHeader';
import Toast from '@/components/ui/Toast';
import { useUIStore } from '@/stores/useUIStore';
import { cn, formatNumber } from '@/lib/utils';

type RaffleStatus = 'active' | 'drawing' | 'winner' | 'loser' | 'closed';
type FilterTab = 'active' | 'ended';
type DebugPreset = 'mixed' | 'all-active' | 'all-ended';

interface RaffleItem {
  id: string;
  title: string;
  prizeImage: string;
  status: RaffleStatus;
  daysLeft: number;
  participants: number;
  myEntries: number;
}

const MOCK_RAFFLES: RaffleItem[] = [
  { id: 'r1', title: 'V01D 사인앨범 래플', prizeImage: '/v01d/logo.png', status: 'active', daysLeft: 5, participants: 128, myEntries: 3 },
  { id: 'r2', title: 'V01D 포토카드 래플', prizeImage: '/v01d/logo.png', status: 'active', daysLeft: 12, participants: 56, myEntries: 0 },
  { id: 'r3', title: 'V01D 팬미팅 입장권', prizeImage: '/v01d/logo.png', status: 'winner', daysLeft: 0, participants: 320, myEntries: 10 },
  { id: 'r4', title: 'V01D 굿즈 세트', prizeImage: '/v01d/logo.png', status: 'loser', daysLeft: 0, participants: 210, myEntries: 5 },
  { id: 'r5', title: 'V01D 사인 포스터', prizeImage: '/v01d/logo.png', status: 'drawing', daysLeft: 0, participants: 180, myEntries: 7 },
];

const STATUS_BADGE: Record<RaffleStatus, { label: string; style: string }> = {
  active: { label: '', style: '' },
  drawing: { label: '추첨 대기', style: 'bg-amber-100 text-amber-700' },
  winner: { label: '🎉 당첨', style: 'bg-green-100 text-green-700' },
  loser: { label: '미당첨', style: 'bg-gray-100 text-gray-500' },
  closed: { label: '마감', style: 'bg-gray-100 text-gray-400' },
};

export default function RafflePage() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);
  const [filter, setFilter] = useState<FilterTab>('active');
  const [raffles, setRaffles] = useState(MOCK_RAFFLES);
  const [preset, setPreset] = useState<DebugPreset>('mixed');
  const [debugOpen, setDebugOpen] = useState(false);

  const myTickets = 15;

  const filtered = raffles.filter((r) => {
    if (filter === 'active') return r.status === 'active';
    return r.status !== 'active';
  }).sort((a, b) => {
    if (filter === 'active') return a.daysLeft - b.daysLeft;
    return b.participants - a.participants;
  });

  const handleCardTap = (raffle: RaffleItem) => {
    if (raffle.status === 'drawing') {
      addToast('info', '추첨 결과를 기다려주세요');
      return;
    }
    if (raffle.status === 'active') addToast('info', 'Raffle 상세 화면으로 이동합니다 (CEB-FQ-202)');
    else if (raffle.status === 'winner') addToast('success', '🎉 축하합니다! 당첨 상세 화면 (CEB-FQ-203)');
    else if (raffle.status === 'loser') addToast('info', '미당첨 결과 화면 (CEB-FQ-204)');
  };

  const switchPreset = (p: DebugPreset) => {
    setPreset(p);
    setDebugOpen(false);
    if (p === 'mixed') setRaffles(MOCK_RAFFLES);
    else if (p === 'all-active') setRaffles(MOCK_RAFFLES.map((r) => ({ ...r, status: 'active' as const, daysLeft: Math.floor(Math.random() * 14) + 1, myEntries: Math.floor(Math.random() * 5) })));
    else setRaffles(MOCK_RAFFLES.map((r, i) => ({ ...r, status: (i % 2 === 0 ? 'winner' : 'loser') as RaffleStatus, daysLeft: 0 })));
  };

  return (
    <div className="min-h-dvh bg-white pb-8">
      <Toast />
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-top">
        <div className="flex items-center h-12 px-4">
          <button onClick={() => router.back()} className="mr-3 -ml-1 p-1">
            <span className="text-gray-900">←</span>
          </button>
          <h1 className="text-base font-semibold text-gray-900 flex-1">Raffle</h1>
          <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg">
            응모권: {myTickets}장
          </span>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="px-4 mt-3 flex gap-2">
        {[
          { key: 'active' as FilterTab, label: '진행중' },
          { key: 'ended' as FilterTab, label: '마감' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-semibold transition-colors',
              filter === tab.key ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 래플 카드 리스트 */}
      <div className="px-4 mt-4 space-y-3">
        {filtered.map((raffle) => {
          const badge = STATUS_BADGE[raffle.status];
          return (
            <button
              key={raffle.id}
              onClick={() => handleCardTap(raffle)}
              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                  <img src={raffle.prizeImage} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 truncate flex-1">{raffle.title}</span>
                    {badge.label && (
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0', badge.style)}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {raffle.status === 'active' && (
                      <span className="text-violet-600 font-semibold">D-{raffle.daysLeft}</span>
                    )}
                    <span>참여 {formatNumber(raffle.participants)}명</span>
                  </div>
                  <div className="mt-1">
                    {raffle.myEntries > 0 ? (
                      <span className="text-[10px] text-violet-600 font-medium">내 응모: {raffle.myEntries}장</span>
                    ) : (
                      <span className="text-[10px] text-gray-400">미응모</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <span className="text-3xl">🎁</span>
            <p className="text-sm font-semibold text-gray-900 mt-3">
              {filter === 'active' ? '현재 진행 중인 래플이 없습니다' : '아직 참여한 래플이 없습니다'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {filter === 'active' ? '새 래플이 열리면 알려드릴게요' : '진행중인 래플에 참여해보세요'}
            </p>
          </div>
        )}
      </div>

      {/* 플로팅 디버그 */}
      <div className="fixed bottom-20 right-4 z-50">
        {debugOpen && (
          <div className="mb-2 flex flex-col gap-1.5 animate-slideInUp">
            {[
              { key: 'mixed' as const, label: '혼합' },
              { key: 'all-active' as const, label: '전체 진행중' },
              { key: 'all-ended' as const, label: '전체 마감' },
            ].map((p) => (
              <button key={p.key} onClick={() => switchPreset(p.key)}
                className={cn('px-3 py-2 rounded-xl shadow-md text-[10px] font-semibold whitespace-nowrap', p.key === preset ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-700')}>
                {p.label}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setDebugOpen(!debugOpen)} className="px-3 py-2.5 rounded-full bg-gray-900 text-white shadow-lg flex items-center gap-1.5 active:scale-95 transition-transform">
          <span className="text-[10px] font-semibold">{preset === 'mixed' ? '혼합' : preset === 'all-active' ? '전체 진행중' : '전체 마감'}</span>
          <span className="text-[8px]">▲</span>
        </button>
      </div>
    </div>
  );
}
