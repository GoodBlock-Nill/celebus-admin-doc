'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import SubPageHeader from '@/components/layout/SubPageHeader';
import PresetSelector from '@/components/dev/PresetSelector';
import { useUIStore } from '@/stores/useUIStore';
import { cn, formatNumber } from '@/lib/utils';
import { RAFFLE_PRESET_OPTIONS, applyRafflePreset } from '@/lib/presets/raffle';
import { useRaffles } from '@/lib/hooks/useRaffle';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import EmptyState from '@/components/ui/EmptyState';

type RaffleStatus = 'active' | 'drawing' | 'winner' | 'loser' | 'closed';
type FilterTab = 'active' | 'ended';

interface RaffleItem {
  id: string;
  title: string;
  prizeImage: string;
  status: RaffleStatus;
  daysLeft: number;
  participants: number;
  myEntries: number;
}

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
  const queryClient = useQueryClient();
  const { activeArtistId } = useActiveArtist();
  const { data: rawRaffles, isLoading } = useRaffles(activeArtistId);
  const [filter, setFilter] = useState<FilterTab>('active');
  const [preset, setPreset] = useState('mixed');

  const handlePreset = async (key: string) => {
    setPreset(key);
    await applyRafflePreset(key, queryClient);
  };

  const myTickets: number = 15;

  const raffles: RaffleItem[] = (rawRaffles ?? []).map((r) => {
    let displayStatus: RaffleStatus = r.status === 'drawing' ? 'drawing' : r.status === 'closed' ? 'closed' : 'active';
    if (r.status === 'drawing' && r.myResult === 'winner') displayStatus = 'winner';
    else if (r.status === 'drawing' && r.myResult === 'loser') displayStatus = 'loser';
    else if (r.status === 'closed' && r.myResult === 'winner') displayStatus = 'winner';
    else if (r.status === 'closed' && r.myResult === 'loser') displayStatus = 'loser';
    const endDate = r.endDate ? new Date(r.endDate) : null;
    const daysLeft = endDate ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000)) : 0;
    return {
      id: r.id,
      title: r.title,
      prizeImage: r.prizeImage ?? '/v01d/logo.png',
      status: displayStatus,
      daysLeft,
      participants: r.totalEntries,
      myEntries: r.myEntries,
    };
  });

  const filtered = raffles.filter((r) => {
    if (filter === 'active') return r.status === 'active';
    return r.status !== 'active';
  }).sort((a, b) => {
    if (filter === 'active') return a.daysLeft - b.daysLeft;
    return b.participants - a.participants;
  });

  const handleCardTap = (raffle: RaffleItem) => {
    if (raffle.status === 'drawing') {
      addToast('info', '추첨 결과를 기다려주세요. 결과는 마감 후 영업일 2일 이내 발표돼요');
      return;
    }
    if (raffle.status === 'active' && myTickets === 0) {
      addToast('info', '응모권이 부족해요. 퀘스트를 완료하고 응모권을 모아보세요!');
      return;
    }
    if (raffle.status === 'active') addToast('info', 'Raffle 상세 화면으로 이동합니다 (CEB-FQ-202)');
    else if (raffle.status === 'winner') addToast('success', '🎉 축하합니다! 당첨 상세 화면 (CEB-FQ-203)');
    else if (raffle.status === 'loser') addToast('info', '미당첨 결과 화면 (CEB-FQ-204)');
  };

  return (
    <div className="min-h-dvh bg-white pb-20">
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
          { key: 'ended' as FilterTab, label: '마감됨' },
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
        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full bg-gray-100 rounded-2xl h-24 animate-pulse" />
            ))}
          </>
        )}
        {!isLoading && filtered.map((raffle) => {
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
                    {/* Fix #15: D-0 → "오늘 마감" */}
                  {raffle.status === 'active' && (
                      <span className="text-violet-600 font-semibold">
                        {raffle.daysLeft === 0 ? '오늘 마감' : `D-${raffle.daysLeft}`}
                      </span>
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

        {!isLoading && filtered.length === 0 && (
          <EmptyState
            emoji="🎁"
            title={filter === 'active' ? '현재 진행 중인 래플이 없습니다' : '아직 참여한 래플이 없습니다'}
            description={filter === 'active' ? '새 래플이 열리면 알려드릴게요' : '진행중인 래플에 참여해보세요'}
            ctaLabel={filter === 'active' ? '알림 설정' : undefined}
            onCtaClick={filter === 'active' ? () => addToast('success', '알림이 설정되었습니다') : undefined}
            secondaryCtaLabel={filter === 'active' ? 'V01D 챌린지' : undefined}
            secondaryCtaHref={filter === 'active' ? '/quest' : undefined}
          />
        )}
      </div>

      <PresetSelector presets={RAFFLE_PRESET_OPTIONS} current={preset} onSelect={handlePreset} />
    </div>
  );
}
