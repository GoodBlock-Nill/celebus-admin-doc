'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import SubPageHeader from '@/components/layout/SubPageHeader';
import GuestBanner from '@/components/ui/GuestBanner';
import PresetSelector from '@/components/dev/PresetSelector';
import { useUIStore } from '@/stores/useUIStore';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import { useSeasons, useRanking, useVirtueHistory } from '@/lib/hooks/useRanking';
import { useUserCurrency } from '@/lib/hooks/useUser';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatNumber } from '@/lib/utils';
import BottomSheet from '@/components/ui/BottomSheet';
import LeaderboardList from '@/components/ranking/LeaderboardList';
import { RANKING_PRESET_OPTIONS, applyRankingPreset } from '@/lib/presets/ranking';

export default function VirtuePage() {
  const { activeArtistId } = useActiveArtist();
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);
  const [preset, setPreset] = useState('current');
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const handlePreset = async (key: string) => {
    if (key === 'guest') {
      setIsLoggedIn(false);
      setPreset(key);
      return;
    }
    if (key === 'guestEmpty') {
      setIsLoggedIn(false);
      setPreset(key);
      return;
    }
    setIsLoggedIn(true);
    setPreset(key);
    if (key === 'prevSeason') {
      const prevSeason = seasons?.find((s) => !s.isCurrent);
      if (prevSeason) setSelectedSeasonId(prevSeason.id);
    }
    await applyRankingPreset(key, queryClient);
  };

  const { data: seasons, isLoading: seasonsLoading } = useSeasons(activeArtistId);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

  const currentSeason = seasons?.find((s) => s.isCurrent);
  const seasonId = selectedSeasonId ?? currentSeason?.id ?? '';

  const { data: ranking, isLoading: rankingLoading } = useRanking(activeArtistId, seasonId);
  const { data: currency } = useUserCurrency(activeArtistId);
  const { data: history } = useVirtueHistory(activeArtistId);

  const isLoading = seasonsLoading || rankingLoading;

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-white pb-20">
        <SubPageHeader title="덕력 랭킹" backHref="/artist" />
        <div className="px-4 mt-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-8 w-full" />
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white pb-20">
      {!isLoggedIn && <GuestBanner />}
      <SubPageHeader title="덕력 랭킹" backHref="/artist" />

      {/* 시즌 드롭다운 */}
      <div className="px-4 mt-3 flex justify-end">
        <select
          value={seasonId}
          onChange={(e) => setSelectedSeasonId(e.target.value)}
          className="text-xs bg-gray-100 rounded-lg px-3 py-1.5 text-gray-700 font-medium"
        >
          {(seasons ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}{s.isCurrent ? ' (현재)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* 시즌 동결 배너 */}
      {!currentSeason && (
        <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
          <p className="text-sm font-semibold text-amber-800">시즌 정산 중이에요!</p>
          <p className="text-xs text-amber-600 mt-1">새로운 시즌이 곧 시작돼요</p>
        </div>
      )}

      {/* 내 정보 카드 */}
      <div className="mx-4 mt-3 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl px-5 py-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">⭐</span>
          <span className="text-base font-bold text-gray-900">내 랭킹</span>
          {!currentSeason?.isCurrent && selectedSeasonId && (
            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">이전 시즌</span>
          )}
          {/* Fix #10: 이전 시즌 보상 뱃지 */}
          {selectedSeasonId && selectedSeasonId !== currentSeason?.id && (
            <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              이 시즌 보상: 슈퍼팬 뱃지
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <p className="text-[10px] text-gray-500">순위</p>
            <p className="text-lg font-bold text-violet-700">{ranking?.myRank ? `${ranking.myRank}위` : '-'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">획득 덕력</p>
            <p className="text-lg font-bold text-gray-900">{`${formatNumber(ranking?.myEarnedPt ?? 0)}DUK`}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">보유 덕력</p>
            <p className="text-lg font-bold text-gray-600">{`${formatNumber(currency?.virtueHeld ?? 0)}DUK`}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{ranking?.seasonLabel} {ranking?.seasonDaysLeft ? `(D-${ranking.seasonDaysLeft})` : ''}</span>
          {isLoggedIn && (
            <button onClick={() => setShowHistory(true)} className="text-xs text-violet-600 font-medium">
              덕력 이력 보기 →
            </button>
          )}
        </div>
      </div>

      {/* TOP 100 리더보드 */}
      <LeaderboardList
        topUsers={ranking?.topUsers ?? []}
        myRank={ranking?.myRank}
        myEarnedPt={ranking?.myEarnedPt}
        isLoggedIn={isLoggedIn}
      />

      {/* 시즌 보상 안내 */}
      <div className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">시즌 보상</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="flex gap-2">
          {[
            { icon: '🏆', label: '1위', reward: '사인 앨범' },
            { icon: '🥇', label: 'TOP 10', reward: '사인 포토카드' },
            { icon: '🌟', label: 'TOP 10%', reward: '슈퍼팬 뱃지' },
          ].map((r) => (
            <div key={r.label} className="flex-1 bg-gray-50 rounded-xl px-3 py-3 text-center">
              <span className="text-lg">{r.icon}</span>
              <p className="text-[10px] font-semibold text-gray-700 mt-1">{r.label}</p>
              <p className="text-[9px] text-gray-500">{r.reward}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 안내 */}
      <div className="mx-4 mt-4 bg-gray-50 rounded-xl px-4 py-3">
        <p className="text-xs text-gray-500">
          ℹ️ 랭킹은 획득 덕력 기준입니다. 서포트에 응원한 덕력은 랭킹에 영향을 주지 않습니다.
        </p>
      </div>

      <PresetSelector presets={RANKING_PRESET_OPTIONS} current={preset} onSelect={handlePreset} />

      {/* 덕력 이력 바텀시트 */}
      <BottomSheet open={showHistory} onClose={() => setShowHistory(false)} title="덕력 이력">
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {(history ?? []).map((item, i) => (
            <button key={i} className="w-full flex items-center justify-between py-0.5 active:bg-gray-50 rounded-lg transition-colors"
              onClick={() => { if (item.type !== 'earn') addToast('info', `${item.description} 상세 이동`); }}>
              <span className="text-sm text-gray-700 text-left">{item.description}</span>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className={cn('text-sm font-semibold', item.amount > 0 ? 'text-green-600' : 'text-red-500')}>
                  {item.amount > 0 ? '+' : ''}{item.amount}DUK
                </span>
                <span className="text-[10px] text-gray-400">{item.createdAt?.slice(5, 10).replace('-', '.')}</span>
                {item.type !== 'earn' && <span className="text-[10px] text-gray-300">→</span>}
              </div>
            </button>
          ))}
          {(!history || history.length === 0) && (
            <p className="text-sm text-gray-400 text-center py-4">아직 덕력 이력이 없어요</p>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
