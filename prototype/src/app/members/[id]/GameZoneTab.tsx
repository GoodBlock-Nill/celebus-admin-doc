'use client';

import { useState } from 'react';
import StatsCard from '@/components/ui/StatsCard';
import DataTable from '@/components/ui/DataTable';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import GPDisplay from '@/components/ui/GPDisplay';
import GPChangeDetailModal from '@/components/modals/GPChangeDetailModal';
import { getMemberParticipants, getMemberGPChanges, getRankingByUid } from '@/mock/members';
import { mockRankings } from '@/mock/rankings';
import { useGameStore } from '@/stores/useGameStore';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { formatDateTime, formatNumber, formatGP } from '@/lib/utils';
import type { GPChange, Participant, Game, Column } from '@/lib/types';
import type { Member } from '@/mock/members';

interface GameZoneTabProps {
  member: Member;
}

type EnrichedParticipant = Participant & { game: Game | undefined };

function getDateRange(p: string, sd: string, ed: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (p) {
    case 'today': return { start: todayStart, end: now };
    case '7days': return { start: new Date(todayStart.getTime() - 6 * 86400000), end: now };
    case '30days': return { start: new Date(todayStart.getTime() - 29 * 86400000), end: now };
    case 'custom':
      return {
        start: sd ? new Date(sd) : new Date(0),
        end: ed ? new Date(ed + 'T23:59:59') : now,
      };
    default: return { start: new Date(0), end: now };
  }
}

export default function GameZoneTab({ member }: GameZoneTabProps) {
  // State for game participants
  const [selectedGameType, setSelectedGameType] = useState<'PREDICTION_MARKET' | 'SURVIVAL_TRIVIA'>('PREDICTION_MARKET');
  const [gameStatusFilter, setGameStatusFilter] = useState('');
  const [gamePeriod, setGamePeriod] = useState('');
  const [gameStartDate, setGameStartDate] = useState('');
  const [gameEndDate, setGameEndDate] = useState('');
  const [gamePage, setGamePage] = useState(1);

  // State for GP changes
  const [gpTypeFilter, setGpTypeFilter] = useState('');
  const [gpPeriod, setGpPeriod] = useState('');
  const [gpStartDate, setGpStartDate] = useState('');
  const [gpEndDate, setGpEndDate] = useState('');
  const [gpPage, setGpPage] = useState(1);
  const [selectedGPChange, setSelectedGPChange] = useState<GPChange | null>(null);

  // Get data
  const gpChanges = getMemberGPChanges(member.id);
  const participants = getMemberParticipants(member.id);
  const ranking = getRankingByUid(member.id);
  const getGameById = useGameStore.getState().getGameById;

  // Calculate GP summary
  const earnedGP = gpChanges
    .filter(c => ['REWARD', 'REFUND', 'EXCHANGE_IN', 'REFUND_CANCEL'].includes(c.type))
    .reduce((sum, c) => sum + Math.abs(c.amount), 0);
  const usedGP = gpChanges
    .filter(c => ['PARTICIPATION', 'BOOSTING', 'EXCHANGE_OUT'].includes(c.type))
    .reduce((sum, c) => sum + Math.abs(c.amount), 0);

  // Build enriched participant data
  const enrichedParticipants = participants.map(p => {
    const game = getGameById(p.gameId);
    return { ...p, game };
  }).filter(p => p.game);

  // Calculate game performance by game type
  const pmParticipants = enrichedParticipants.filter(p => (p.gameType ?? p.game?.type) === 'PREDICTION_MARKET');
  const stParticipants = enrichedParticipants.filter(p => (p.gameType ?? p.game?.type) === 'SURVIVAL_TRIVIA');

  const pmCompleted = pmParticipants.filter(p => p.game && (p.game.status === 'Closed' || p.game.status === 'Ended'));
  const pmCorrect = pmCompleted.filter(p => p.game && p.game.result && p.choice === p.game.result);
  const pmWinRate = pmCompleted.length > 0 ? Math.round((pmCorrect.length / pmCompleted.length) * 100) : null;

  const stCompleted = stParticipants.filter(p => p.game && p.game.status === 'Ended');
  const stSurvived = stCompleted.filter(p => p.survivedStage === 10);
  const stSurvivalRate = stCompleted.length > 0 ? Math.round((stSurvived.length / stCompleted.length) * 100) : null;

  // Filter game participants by selected game type and other filters
  const { start: gameStart, end: gameEnd } = getDateRange(gamePeriod, gameStartDate, gameEndDate);
  const filteredGameParticipants = enrichedParticipants.filter(p => {
    const type = p.gameType ?? p.game?.type;
    if (type !== selectedGameType) return false;
    const dt = new Date(p.participatedAt);
    if (dt < gameStart || dt > gameEnd) return false;
    if (gameStatusFilter && p.game && p.game.status !== gameStatusFilter) return false;
    return true;
  }).sort((a, b) => new Date(b.participatedAt).getTime() - new Date(a.participatedAt).getTime());

  const gameTotalPages = Math.ceil(filteredGameParticipants.length / ITEMS_PER_PAGE);
  const paginatedGameParticipants = filteredGameParticipants.slice(
    (gamePage - 1) * ITEMS_PER_PAGE,
    gamePage * ITEMS_PER_PAGE
  );

  // Filter GP changes
  const { start: gpStart, end: gpEnd } = getDateRange(gpPeriod, gpStartDate, gpEndDate);
  const filteredGPChanges = gpChanges.filter(c => {
    const dt = new Date(c.datetime);
    if (dt < gpStart || dt > gpEnd) return false;
    if (gpTypeFilter && c.type !== gpTypeFilter) return false;
    return true;
  }).sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  const gpTotalPages = Math.ceil(filteredGPChanges.length / ITEMS_PER_PAGE);
  const paginatedGPChanges = filteredGPChanges.slice(
    (gpPage - 1) * ITEMS_PER_PAGE,
    gpPage * ITEMS_PER_PAGE
  );

  // PM columns
  const pmColumns: Column<EnrichedParticipant>[] = [
    {
      key: 'gameTitle', label: '게임 타이틀', width: '200px',
      render: (p: EnrichedParticipant) => p.game ? (
        <a href={`/game-zone/games/${p.gameId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {p.game.title.ko}
        </a>
      ) : <span className="text-gray-400">{p.gameId}</span>
    },
    { key: 'participatedAt', label: '참여일시', width: '140px', sortable: true, render: (p: EnrichedParticipant) => formatDateTime(p.participatedAt) },
    {
      key: 'choice', label: '선택', width: '70px', align: 'center', sortable: true,
      render: (p: EnrichedParticipant) => p.choice ? (
        <Badge variant="custom" value={p.choice} customBg={p.choice === 'YES' ? 'bg-green-100' : 'bg-red-100'} customText={p.choice === 'YES' ? 'text-green-700' : 'text-red-700'} customLabel={p.choice} />
      ) : <span className="text-gray-400">-</span>
    },
    { key: 'participationGP', label: '참여 GP', width: '90px', align: 'right', sortable: true, render: (p: EnrichedParticipant) => formatGP(p.participationGP) },
    { key: 'boostingGP', label: '부스팅 GP', width: '90px', align: 'right', sortable: true, render: (p: EnrichedParticipant) => formatGP(p.boostingGP) },
    {
      key: 'gameResult', label: '게임 결과', width: '100px',
      render: (p: EnrichedParticipant) => {
        if (!p.game || !p.game.result) return <span className="text-gray-400">-</span>;
        if (p.choice === p.game.result) return <span className="text-green-600">정답({p.game.result})</span>;
        return <span className="text-red-600">오답({p.game.result})</span>;
      }
    },
    { key: 'rewardGP', label: '보상 GP', width: '90px', align: 'right', sortable: true, render: (p: EnrichedParticipant) => formatGP(p.rewardGP) },
    { key: 'refundGP', label: '환급 GP', width: '90px', align: 'right', sortable: true, render: (p: EnrichedParticipant) => formatGP(p.refundGP) },
    { key: 'status', label: '게임 상태', width: '90px', align: 'center', render: (p: EnrichedParticipant) => <Badge variant="gameStatus" value={p.game?.status || 'Active'} /> },
  ];

  // ST columns
  const stColumns: Column<EnrichedParticipant>[] = [
    {
      key: 'gameTitle', label: '게임 타이틀', width: '200px',
      render: (p: EnrichedParticipant) => p.game ? (
        <a href={`/game-zone/games/${p.gameId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {p.game.title.ko}
        </a>
      ) : <span className="text-gray-400">{p.gameId}</span>
    },
    { key: 'participatedAt', label: '참여일시', width: '140px', sortable: true, render: (p: EnrichedParticipant) => formatDateTime(p.participatedAt) },
    {
      key: 'survivedStage', label: '생존 스테이지', width: '100px', align: 'center', sortable: true,
      render: (p: EnrichedParticipant) => (
        <span className={p.survivedStage === 10 ? 'text-green-600 font-medium' : ''}>
          {p.survivedStage ?? '-'}/10
        </span>
      )
    },
    { key: 'participationGP', label: '참여 GP', width: '90px', align: 'right', sortable: true, render: (p: EnrichedParticipant) => formatGP(p.participationGP) },
    {
      key: 'heartsUsed', label: '하트 사용', width: '90px', align: 'right', sortable: true,
      render: (p: EnrichedParticipant) => `${p.heartsUsed ?? 0}개`
    },
    {
      key: 'gameResult', label: '게임 결과', width: '120px',
      render: (p: EnrichedParticipant) => {
        if (!p.game || p.game.status === 'Active') return <span className="text-gray-400">-</span>;
        if (p.survivedStage === 10) return <span className="text-green-600">생존</span>;
        return <span className="text-red-600">탈락({p.eliminatedAtStage ?? p.survivedStage}스테이지)</span>;
      }
    },
    { key: 'rewardGP', label: '보상 GP', width: '90px', align: 'right', sortable: true, render: (p: EnrichedParticipant) => formatGP(p.rewardGP) },
    { key: 'status', label: '게임 상태', width: '90px', align: 'center', render: (p: EnrichedParticipant) => <Badge variant="gameStatus" value={p.game?.status || 'Active'} /> },
  ];

  const activeGameColumns = selectedGameType === 'PREDICTION_MARKET' ? pmColumns : stColumns;

  // GP changes table columns
  const gpColumns: Column<GPChange>[] = [
    { key: 'datetime', label: '변동일시', width: '140px', sortable: true, render: (c: GPChange) => formatDateTime(c.datetime) },
    { key: 'type', label: '유형', width: '90px', align: 'center', render: (c: GPChange) => <Badge variant="gpType" value={c.type} /> },
    { key: 'amount', label: 'GP 변동량', width: '100px', align: 'right', sortable: true, render: (c: GPChange) => <GPDisplay amount={c.amount} showSign /> },
    { key: 'balanceAfter', label: '변동 후 잔액', width: '100px', align: 'right', sortable: true, render: (c: GPChange) => `${formatNumber(c.balanceAfter)} GP` },
    { key: 'notes', label: '비고', width: '120px' },
  ];

  return (
    <div className="space-y-6">
      {/* A. GP 요약 */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">GP 요약</h3>
        <div className="grid grid-cols-4 gap-4">
          <StatsCard label="현재 GP 잔액" value={`${formatNumber(member.currentGP)} GP`} variant="gp" />
          <StatsCard label="누적 획득 GP" value={`${formatNumber(earnedGP)} GP`} subtitle="보상+환급+환불+GP가져오기" variant="gp" />
          <StatsCard label="누적 사용 GP" value={`${formatNumber(usedGP)} GP`} subtitle="참여+부스팅+CELB으로보내기" variant="gp" />
          <StatsCard label="랭킹" value={ranking ? `${ranking.rank}위 / ${mockRankings.length}명` : '-'} variant="count" />
        </div>
      </div>

      {/* B. 게임 성과 요약 */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">게임 성과 요약</h3>
        <div className="grid grid-cols-4 gap-4">
          <StatsCard label="PM 참여" value={`${pmParticipants.length}회`} />
          <StatsCard label="PM 승률" value={pmWinRate !== null ? `${pmWinRate}%` : '-'} />
          <StatsCard label="ST 참여" value={`${stParticipants.length}회`} />
          <StatsCard label="ST 생존율" value={stSurvivalRate !== null ? `${stSurvivalRate}%` : '-'} />
        </div>
      </div>

      {/* C. 게임 참여 내역 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">게임 참여 내역</h3>

        {/* Segmented Control */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => { setSelectedGameType('PREDICTION_MARKET'); setGameStatusFilter(''); setGamePage(1); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedGameType === 'PREDICTION_MARKET'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Prediction Market
          </button>
          <button
            onClick={() => { setSelectedGameType('SURVIVAL_TRIVIA'); setGameStatusFilter(''); setGamePage(1); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedGameType === 'SURVIVAL_TRIVIA'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Survival Trivia
          </button>
        </div>

        <div className="mb-4">
          <FilterBar
            filters={[
              { key: 'gameStatus', label: '게임 상태', type: 'select', value: gameStatusFilter, options: selectedGameType === 'PREDICTION_MARKET' ? [
                { value: 'Active', label: '진행중' },
                { value: 'Pending', label: '결과 대기' },
                { value: 'Closed', label: '결과 확정' },
                { value: 'Ended', label: '종료' },
              ] : [
                { value: 'Active', label: '진행중' },
                { value: 'Ended', label: '종료' },
              ]},
              { key: 'gamePeriod', label: '기간', type: 'select', value: gamePeriod, options: [
                { value: 'today', label: '오늘' },
                { value: '7days', label: '최근 7일' },
                { value: '30days', label: '최근 30일' },
                { value: 'custom', label: '커스텀' },
              ]},
              ...(gamePeriod === 'custom' ? [
                { key: 'gameStartDate', label: '시작일', type: 'date' as const, value: gameStartDate },
                { key: 'gameEndDate', label: '종료일', type: 'date' as const, value: gameEndDate },
              ] : []),
            ]}
            onFilterChange={(k, v) => {
              if (k === 'gameStatus') setGameStatusFilter(v);
              else if (k === 'gamePeriod') { setGamePeriod(v); if (v !== 'custom') { setGameStartDate(''); setGameEndDate(''); } }
              else if (k === 'gameStartDate') setGameStartDate(v);
              else if (k === 'gameEndDate') setGameEndDate(v);
              setGamePage(1);
            }}
            onReset={() => { setGameStatusFilter(''); setGamePeriod(''); setGameStartDate(''); setGameEndDate(''); setGamePage(1); }}
          />
        </div>
        <DataTable
          columns={activeGameColumns}
          data={paginatedGameParticipants as (EnrichedParticipant & Record<string, unknown>)[]}
          emptyMessage="게임 참여 내역이 없습니다."
        />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">총 {formatNumber(filteredGameParticipants.length)}건</span>
          <Pagination currentPage={gamePage} totalPages={gameTotalPages} onPageChange={setGamePage} />
        </div>
      </div>

      {/* D. GP 변동 내역 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">GP 변동 내역</h3>
        <div className="mb-4">
          <FilterBar
            filters={[
              { key: 'gpType', label: '변동 유형', type: 'select', value: gpTypeFilter, options: [
                { value: 'PARTICIPATION', label: '참여' },
                { value: 'BOOSTING', label: '부스팅' },
                { value: 'REFUND', label: '환급' },
                { value: 'REWARD', label: '보상' },
                { value: 'EXCHANGE_IN', label: 'GP 가져오기' },
                { value: 'EXCHANGE_OUT', label: 'CELB으로 보내기' },
                { value: 'REFUND_CANCEL', label: '환불' },
              ]},
              { key: 'gpPeriod', label: '기간', type: 'select', value: gpPeriod, options: [
                { value: 'today', label: '오늘' },
                { value: '7days', label: '최근 7일' },
                { value: '30days', label: '최근 30일' },
                { value: 'custom', label: '커스텀' },
              ]},
              ...(gpPeriod === 'custom' ? [
                { key: 'gpStartDate', label: '시작일', type: 'date' as const, value: gpStartDate },
                { key: 'gpEndDate', label: '종료일', type: 'date' as const, value: gpEndDate },
              ] : []),
            ]}
            onFilterChange={(k, v) => {
              if (k === 'gpType') setGpTypeFilter(v);
              else if (k === 'gpPeriod') { setGpPeriod(v); if (v !== 'custom') { setGpStartDate(''); setGpEndDate(''); } }
              else if (k === 'gpStartDate') setGpStartDate(v);
              else if (k === 'gpEndDate') setGpEndDate(v);
              setGpPage(1);
            }}
            onReset={() => { setGpTypeFilter(''); setGpPeriod(''); setGpStartDate(''); setGpEndDate(''); setGpPage(1); }}
          />
        </div>
        <DataTable
          columns={gpColumns}
          data={paginatedGPChanges as (GPChange & Record<string, unknown>)[]}
          emptyMessage="GP 변동 내역이 없습니다."
          onRowClick={(item) => setSelectedGPChange(item as unknown as GPChange)}
        />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">총 {formatNumber(filteredGPChanges.length)}건</span>
          <Pagination currentPage={gpPage} totalPages={gpTotalPages} onPageChange={setGpPage} />
        </div>
        <GPChangeDetailModal isOpen={!!selectedGPChange} onClose={() => setSelectedGPChange(null)} change={selectedGPChange} />
      </div>
    </div>
  );
}
