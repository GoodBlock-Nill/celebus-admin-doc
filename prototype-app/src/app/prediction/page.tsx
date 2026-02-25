'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockGames, mockParticipations } from '@/mock/games';
import { mockUser } from '@/mock/user';
import { formatGP, formatNumber, getRemainingTime } from '@/lib/utils';
import type { Game, GameStatus, UserParticipation } from '@/lib/types';

// TODO: Replace with store
const MOCK_USER = mockUser;
const VISIBLE_STATUSES: GameStatus[] = ['Active', 'Pending', 'Closed', 'Ended'];

type FilterTab = 'all' | 'active' | 'closed' | 'pending';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'active', label: '진행중' },
  { key: 'closed', label: '결과 발표' },
  { key: 'pending', label: '발표대기중' },
];

function filterGames(games: Game[], tab: FilterTab): Game[] {
  const visible = games.filter((g) => VISIBLE_STATUSES.includes(g.status));
  if (tab === 'all') return visible;
  if (tab === 'active') return visible.filter((g) => g.status === 'Active');
  if (tab === 'closed') return visible.filter((g) => g.status === 'Closed' || g.status === 'Ended');
  if (tab === 'pending') return visible.filter((g) => g.status === 'Pending');
  return visible;
}

function getAppBadge(status: GameStatus): { label: string; className: string } {
  if (status === 'Active') return { label: '진행중', className: 'bg-green-500 text-white' };
  if (status === 'Pending') return { label: '발표대기중', className: 'bg-orange-400 text-white' };
  if (status === 'Closed' || status === 'Ended') return { label: '결과발표', className: 'bg-red-500 text-white' };
  return { label: status, className: 'bg-gray-500 text-white' };
}

function CountdownText({ endDate }: { endDate: string }) {
  const [remaining, setRemaining] = useState(getRemainingTime(endDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getRemainingTime(endDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  const { days, hours, minutes, seconds } = remaining;
  const isUrgent = days === 0 && hours < 1;
  const timeStr = days > 0
    ? `${days}일 ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <span className={isUrgent ? 'text-red-400' : 'text-gray-400'}>
      종료까지 {timeStr}
    </span>
  );
}

function VoteBar({ yesCount, noCount }: { yesCount: number; noCount: number }) {
  const total = yesCount + noCount;
  if (total === 0) return null;
  const yesPercent = Math.round((yesCount / total) * 100);
  const noPercent = 100 - yesPercent;

  return (
    <div className="mt-2">
      <div className="flex overflow-hidden rounded-full h-2">
        <div className="bg-blue-500 h-full" style={{ width: `${yesPercent}%` }} />
        <div className="bg-red-500 h-full" style={{ width: `${noPercent}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span className="text-blue-400">YES {yesPercent}%</span>
        <span className="text-red-400">NO {noPercent}%</span>
      </div>
    </div>
  );
}

function GameCard({
  game,
  participation,
  onClick,
}: {
  game: Game;
  participation?: UserParticipation;
  onClick: () => void;
}) {
  const badge = getAppBadge(game.status);
  const isCapacityFull = game.maxParticipants > 0 && game.participantCount >= game.maxParticipants;
  const isCorrect =
    game.result !== null && participation && participation.choice === game.result;

  return (
    <button
      className="w-full bg-gray-900 rounded-2xl p-4 text-left active:opacity-80 transition-opacity"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
          {badge.label}
        </span>
        <div className="text-xs text-gray-500">
          {game.status === 'Active' && !isCapacityFull && (
            <CountdownText endDate={game.endDate} />
          )}
          {game.status === 'Active' && isCapacityFull && (
            <span className="text-red-400 font-medium">선착순 인원 마감</span>
          )}
          {game.status === 'Pending' && participation && (
            <span className="text-gray-400">
              참여완료 · 발표일{' '}
              {new Date(game.resultDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric' })}
            </span>
          )}
          {(game.status === 'Closed' || game.status === 'Ended') && participation && (
            <span className="text-gray-400">참여완료</span>
          )}
        </div>
      </div>

      {game.status === 'Active' && !participation && !isCapacityFull && (
        <div className="text-xs text-gray-500 mb-1">
          {game.maxParticipants > 0
            ? `참여 ${formatNumber(game.participantCount)}/${formatNumber(game.maxParticipants)}명`
            : `참여 ${formatNumber(game.participantCount)}명`}
        </div>
      )}

      {game.status === 'Active' && participation && !isCapacityFull && (
        <div className="text-xs text-gray-400 mb-1">
          참여완료 · <span className={participation.choice === 'YES' ? 'text-blue-400' : 'text-red-400'}>
            {participation.choice}
          </span> 선택
        </div>
      )}

      <p className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-2">
        {game.title.ko}
      </p>
      <p className="text-amber-400 text-xs font-medium">전체상금 {formatGP(game.totalPrizeGP)}</p>

      {participation && (game.status === 'Active' || game.status === 'Pending') && (
        <VoteBar yesCount={game.yesCount} noCount={game.noCount} />
      )}

      {(game.status === 'Closed' || game.status === 'Ended') && (
        <>
          <VoteBar yesCount={game.yesCount} noCount={game.noCount} />
          {isCorrect && (
            <div className="mt-2 text-red-400 font-bold text-sm">WIN!</div>
          )}
        </>
      )}

      {game.status === 'Active' && !participation && !isCapacityFull && (
        <div className="mt-3">
          <span className="inline-block bg-blue-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
            투표 참여하기
          </span>
        </div>
      )}

      {(game.status === 'Closed' || game.status === 'Ended') && (
        <div className="mt-3">
          <span className="inline-block bg-gray-700 text-gray-200 text-sm font-semibold px-4 py-1.5 rounded-full">
            결과 확인하기
          </span>
        </div>
      )}
    </button>
  );
}

export default function PredictionListPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const user = MOCK_USER;
  const games = mockGames;
  const participations = new Map(mockParticipations.map((p) => [p.gameId, p]));

  const filteredGames = filterGames(games, activeTab);
  const closedCount = games.filter(
    (g) => (g.status === 'Closed' || g.status === 'Ended') && participations.has(g.id)
  ).length;

  const emptyMessages: Record<FilterTab, string> = {
    all: '현재 진행중인 게임이 없습니다.',
    active: '현재 진행중인 게임이 없습니다.',
    closed: '결과가 발표된 게임이 없습니다.',
    pending: '발표를 기다리는 게임이 없습니다.',
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="safe-top bg-gray-950 px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/home')}
              className="text-white p-1 rounded-full active:bg-gray-800"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-white font-bold text-base">Prediction Market</h1>
          </div>
          <span className="bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            {formatGP(user.gpBalance)}
          </span>
        </div>
      </header>

      {/* Banner */}
      <div className="px-4 py-4 bg-gray-900 border-b border-gray-800">
        <h2 className="text-white font-bold text-lg">Prediction Market</h2>
        <p className="text-gray-400 text-sm mt-0.5">YES / NO 예측에 참여하고, 결과에 따라 GP를 획득하세요</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex no-scrollbar overflow-x-auto border-b border-gray-800 bg-gray-950">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-500'
            }`}
          >
            {tab.label}
            {tab.key === 'closed' && closedCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {closedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Game List */}
      <div className="px-4 py-4 space-y-3 pb-20">
        {filteredGames.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">{emptyMessages[activeTab]}</p>
          </div>
        ) : (
          filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              participation={participations.get(game.id)}
              onClick={() => router.push(`/prediction/${game.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
