'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import DataTable from '@/components/ui/DataTable';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import { useGameStore } from '@/stores/useGameStore';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { formatGP, formatNumber, formatPeriod, formatDateTime } from '@/lib/utils';
import type { Game } from '@/lib/types';
import Link from 'next/link';

export default function GameListPage() {
  const router = useRouter();
  const { filters, setFilters, resetFilters, sortBy, sortOrder, setSort, currentPage, setPage, getFilteredGames } = useGameStore();

  const filteredGames = getFilteredGames();
  const totalPages = Math.ceil(filteredGames.length / ITEMS_PER_PAGE);
  const paginatedGames = filteredGames.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const columns = [
    {
      key: 'title',
      label: '타이틀',
      render: (item: Game) => (
        <span className="text-gray-900 truncate block max-w-[300px]" title={item.title.ko}>
          {item.title.ko}
        </span>
      ),
    },
    {
      key: 'type',
      label: '게임유형',
      align: 'center' as const,
      width: '120px',
      render: (item: Game) => <Badge variant="gameType" value={item.type} />,
    },
    {
      key: 'status',
      label: '상태',
      align: 'center' as const,
      width: '120px',
      render: (item: Game) => <Badge variant="gameStatus" value={item.status} />,
    },
    {
      key: 'participantCount',
      label: '참여자 수',
      align: 'right' as const,
      width: '130px',
      sortable: true,
      render: (item: Game) => formatNumber(item.participantCount),
    },
    {
      key: 'totalPrizeGP',
      label: '총 상금 GP',
      align: 'right' as const,
      width: '130px',
      sortable: true,
      render: (item: Game) => formatGP(item.totalPrizeGP),
    },
    {
      key: 'period',
      label: '참여기간',
      width: '220px',
      render: (item: Game) => item.type === 'SURVIVAL_TRIVIA'
        ? formatDateTime(item.startDateTime || '')
        : formatPeriod(item.publishedAt, item.endDate),
    },
    {
      key: 'createdAt',
      label: '생성일',
      width: '140px',
      sortable: true,
      render: (item: Game) => (
        <span className="text-gray-500">{formatDateTime(item.createdAt)}</span>
      ),
    },
    {
      key: 'createdBy',
      label: '관리자',
      width: '120px',
    },
  ];

  const statusOptions = filters.type === 'SURVIVAL_TRIVIA'
    ? [
        { value: 'Draft', label: '임시저장' },
        { value: 'Ready', label: '게시대기' },
        { value: 'Active', label: '진행중' },
        { value: 'Ended', label: '종료' },
      ]
    : [
        { value: 'Draft', label: '임시저장' },
        { value: 'Ready', label: '게시대기' },
        { value: 'Active', label: '진행중' },
        { value: 'Pending', label: '결과대기' },
        { value: 'Closed', label: '결과확정' },
        { value: 'Ended', label: '종료' },
      ];

  const filterConfig = [
    {
      key: 'type',
      label: '게임유형',
      type: 'select' as const,
      value: filters.type,
      options: [
        { value: 'PREDICTION_MARKET', label: 'Prediction Market' },
        { value: 'SURVIVAL_TRIVIA', label: 'Survival Trivia' },
      ],
    },
    {
      key: 'status',
      label: '상태',
      type: 'select' as const,
      value: filters.status,
      options: statusOptions,
    },
    {
      key: 'search',
      label: '검색',
      type: 'search' as const,
      value: filters.search,
      placeholder: '게임 타이틀 검색',
    },
  ];

  return (
    <div>
      <PageHeader
        title="게임 관리"
        breadcrumbItems={[
          { label: '게임존', href: '/game-zone' },
          { label: '게임 관리' },
        ]}
        actions={
          <Link
            href="/game-zone/games/create"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
          >
            + 게임 생성
          </Link>
        }
      />

      <div className="mb-4">
        <FilterBar
          filters={filterConfig}
          onFilterChange={(key, value) => setFilters({ [key]: value })}
          onReset={resetFilters}
        />
      </div>

      <DataTable<Game & Record<string, unknown>>
        columns={columns}
        data={paginatedGames as (Game & Record<string, unknown>)[]}
        onRowClick={(item) => router.push(`/game-zone/games/${item.id}`)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={setSort}
        emptyMessage={filters.search || filters.status
          ? '검색 조건에 맞는 게임이 없습니다.'
          : '등록된 게임이 없습니다.'
        }
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
