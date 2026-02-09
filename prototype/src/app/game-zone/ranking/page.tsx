'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import RankingBadge from '@/components/ui/RankingBadge';
import FilterBar from '@/components/ui/FilterBar';
import { mockRankings } from '@/mock/rankings';
import { RANKING_ITEMS_PER_PAGE } from '@/lib/constants';
import { formatNumber, formatPercent, formatDateTime } from '@/lib/utils';
import type { RankingUser } from '@/lib/types';

export default function RankingPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const filtered = search
    ? mockRankings.filter(r => r.nickname.toLowerCase().includes(search.toLowerCase()))
    : mockRankings;

  const top10 = filtered.slice(0, 10);
  const totalPages = Math.ceil(filtered.length / RANKING_ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * RANKING_ITEMS_PER_PAGE, page * RANKING_ITEMS_PER_PAGE);

  return (
    <div>
      <PageHeader
        title="랭킹"
        breadcrumbItems={[{ label: '게임존', href: '/game-zone' }, { label: '랭킹' }]}
        actions={
          <Link
            href="/game-zone/ranking/settings"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            랭킹 설정 →
          </Link>
        }
      />
      <div className="mb-4">
        <FilterBar
          filters={[{ key: 'search', label: '검색', type: 'search', value: search, placeholder: '닉네임 검색' }]}
          onFilterChange={(_, v) => { setSearch(v); setPage(1); }}
        />
      </div>

      {!search && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">TOP 10</h2>
          <div className="grid grid-cols-5 gap-3">
            {top10.map((user) => (
              <div key={user.rank} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2"><RankingBadge rank={user.rank} /></div>
                <p className="text-sm font-medium text-gray-900 truncate">{user.nickname.toLowerCase()}</p>
                <p className="text-lg font-bold text-blue-600 mt-1">{formatNumber(user.accumulatedGP)} GP</p>
                <div className="flex justify-center gap-3 mt-2 text-xs text-gray-500">
                  <span>참여 {user.participationCount}회</span>
                  <span>승률 {formatPercent(user.winRate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable<RankingUser & Record<string, unknown>>
        columns={[
          { key: 'rank', label: '순위', align: 'center', width: '80px', render: (item: RankingUser) => <RankingBadge rank={item.rank} /> },
          { key: 'nickname', label: '닉네임', render: (item: RankingUser) => <span className="text-blue-600 cursor-pointer hover:underline">{item.nickname.toLowerCase()}</span> },
          { key: 'accumulatedGP', label: '누적 GP', align: 'right', sortable: true, render: (item: RankingUser) => `${formatNumber(item.accumulatedGP)} GP` },
          { key: 'participationCount', label: '참여 횟수', align: 'right', sortable: true },
          { key: 'winRate', label: '승률', align: 'right', sortable: true, render: (item: RankingUser) => formatPercent(item.winRate) },
          { key: 'lastParticipation', label: '최근 참여일', width: '140px', render: (item: RankingUser) => formatDateTime(item.lastParticipation) },
        ]}
        data={paginated as (RankingUser & Record<string, unknown>)[]}
        emptyMessage="랭킹 데이터가 없습니다."
      />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
