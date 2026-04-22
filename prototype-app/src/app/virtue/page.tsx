'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import SubPageHeader from '@/components/layout/SubPageHeader';
import PresetSelector from '@/components/dev/PresetSelector';
import { useUIStore } from '@/stores/useUIStore';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import { useSeasons, useRanking, useVirtueHistory } from '@/lib/hooks/useRanking';
import { useUserCurrency } from '@/lib/hooks/useUser';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatNumber } from '@/lib/utils';
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

  const myEntry = ranking?.topUsers.find((u) => u.isMe);
  const isInTop100 = myEntry && ranking?.topUsers.indexOf(myEntry)! < 100;

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-white pb-20">
        <SubPageHeader title="덕력 랭킹" />
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
      {!isLoggedIn && (
        <div className="bg-violet-600 text-white text-center py-1.5 text-[10px] font-medium">
          👀 비로그인 미리보기 — 열람 가능, 참여 시 로그인 필요
        </div>
      )}
      <SubPageHeader title="덕력 랭킹" />

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
            <p className="text-lg font-bold text-gray-900">{`${formatNumber(ranking?.myEarnedPt ?? 0)}pt`}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">보유 덕력</p>
            <p className="text-lg font-bold text-gray-600">{`${formatNumber(currency?.virtueHeld ?? 0)}pt`}</p>
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
      <div className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">TOP 100</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* 시즌 초반 — 참여자 20명 미만 배너 */}
        {ranking && (ranking.topUsers.length < 20) && (
          <div className="mb-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-violet-700 font-medium">이번 시즌이 막 시작됐어요! 지금 활동하면 TOP 10 진입 기회 💪</p>
          </div>
        )}

        {/* Fix #9: 신규 유저 Empty 안내 */}
        {!rankingLoading && ranking && !ranking.myRank && (
          <div className="text-center py-4 mb-3">
            <p className="text-xs text-gray-400">활동을 시작하면 랭킹에 참여할 수 있어요!</p>
          </div>
        )}

        <div className="space-y-1">
          {(ranking?.topUsers ?? []).slice(0, 100).map((user) => {
            // Fix #8: 1위 🥇, 2위 🥈, 3위 🥉
            const rankIcon = user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : null;
            return (
              <div
                key={`${user.rank}-${user.nickname}`}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-xl',
                  user.isMe ? 'bg-violet-50 border border-violet-200' : 'bg-white'
                )}
              >
                <span className="w-8 text-xs font-semibold text-gray-500">{user.rank}</span>
                <span className="w-6 text-center">{rankIcon || (user.isMe ? '⭐' : '')}</span>
                <span className={cn('flex-1 text-sm', user.isMe ? 'font-bold text-violet-700' : 'text-gray-800')}>
                  {user.nickname} {user.isMe && '★'}
                </span>
                <span className="text-xs text-gray-500">{formatNumber(user.earnedPt)}pt</span>
              </div>
            );
          })}
        </div>

        {/* TOP 100 밖 내 순위 */}
        {!isInTop100 && ranking?.myRank && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-400">── 내 순위 ──</span>
            </div>
            <div className="flex items-center px-3 py-2.5 rounded-xl bg-violet-50 border border-violet-200">
              <span className="w-8 text-xs font-semibold text-gray-500">{ranking.myRank}</span>
              <span className="w-6 text-center">⭐</span>
              <span className="flex-1 text-sm font-bold text-violet-700">나 ★</span>
              <span className="text-xs text-gray-500">{formatNumber(ranking.myEarnedPt)}pt</span>
            </div>
          </div>
        )}
      </div>

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
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-end" onClick={() => setShowHistory(false)}>
          <div className="absolute inset-0 bg-black/40 animate-fadeIn" />
          <div className="relative z-10 w-full max-w-[430px] mx-auto bg-white rounded-t-2xl px-5 py-6 animate-slideInUp" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <h3 className="text-base font-bold text-gray-900 mb-4">덕력 이력</h3>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {(history ?? []).map((item, i) => (
                <button key={i} className="w-full flex items-center justify-between py-0.5 active:bg-gray-50 rounded-lg transition-colors"
                  onClick={(e) => { e.stopPropagation(); if (item.type !== 'earn') addToast('info', `${item.description} 상세 이동`); }}>
                  <span className="text-sm text-gray-700 text-left">{item.description}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={cn('text-sm font-semibold', item.amount > 0 ? 'text-green-600' : 'text-red-500')}>
                      {item.amount > 0 ? '+' : ''}{item.amount}pt
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
          </div>
        </div>
      )}
    </div>
  );
}
