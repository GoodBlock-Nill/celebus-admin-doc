'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import DataTable from '@/components/ui/DataTable';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import { useFQStore } from '@/stores/useFQStore';
import { formatDate, formatPeriod } from '@/lib/utils';
import type { Quest } from '@/lib/fq-types';

type TabType = 'quest' | 'raffle';

const ITEMS_PER_FQ_PAGE = 10;

export default function FanQuestPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('quest');

  const {
    questFilters,
    setQuestFilters,
    resetQuestFilters,
    questPage,
    setQuestPage,
    getFilteredQuests,
  } = useFQStore();

  const filteredQuests = getFilteredQuests();
  const totalPages = Math.ceil(filteredQuests.length / ITEMS_PER_FQ_PAGE);
  const paginatedQuests = filteredQuests.slice(
    (questPage - 1) * ITEMS_PER_FQ_PAGE,
    questPage * ITEMS_PER_FQ_PAGE
  );

  const questColumns = [
    {
      key: 'status',
      label: '상태',
      align: 'center' as const,
      width: '100px',
      render: (item: Quest) => <Badge variant="questStatus" value={item.status} />,
    },
    {
      key: 'title',
      label: '타이틀',
      render: (item: Quest) => (
        <span className="text-gray-900 truncate block max-w-[280px]" title={item.title.ko}>
          {item.title.ko}
        </span>
      ),
    },
    {
      key: 'artist',
      label: '아티스트',
      width: '140px',
      render: (item: Quest) => item.artist,
    },
    {
      key: 'period',
      label: '기간',
      width: '220px',
      render: (item: Quest) => {
        if (item.status === 'Draft') {
          return formatDate(item.deadline);
        }
        return formatPeriod(item.startedAt, item.deadline);
      },
    },
    {
      key: 'pending',
      label: '검토 필요',
      align: 'center' as const,
      width: '100px',
      render: (item: Quest) => {
        const count = item.stats.pending;
        if (count === 0) {
          return <span className="text-gray-400">0</span>;
        }
        return (
          <span className="text-orange-600 font-semibold">{count}</span>
        );
      },
    },
  ];

  const filterConfig = [
    {
      key: 'status',
      label: '상태',
      type: 'select' as const,
      value: questFilters.status,
      options: [
        { value: 'Active', label: '진행중' },
        { value: 'Draft', label: '임시저장' },
        { value: 'Ended', label: '종료' },
      ],
    },
    {
      key: 'searchField',
      label: '검색 기준',
      type: 'select' as const,
      value: questFilters.searchField,
      hideAllOption: true,
      options: [
        { value: 'title', label: '타이틀' },
        { value: 'artist', label: '아티스트' },
      ],
    },
    {
      key: 'searchQuery',
      label: '검색',
      type: 'search' as const,
      value: questFilters.searchQuery,
      placeholder: questFilters.searchField === 'artist' ? '아티스트명 검색' : 'Quest 타이틀 검색',
    },
  ];

  const tabs: { key: TabType; label: string }[] = [
    { key: 'quest', label: 'Quest' },
    { key: 'raffle', label: 'Raffle' },
  ];

  return (
    <div>
      <PageHeader
        title="Fan Quest 관리"
        breadcrumbItems={[
          { label: '팬퀘스트', href: '/fan-quest' },
          { label: 'Fan Quest 관리' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/fan-quest/rejection-reasons"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              반려사유 설정
            </Link>
            <Link
              href="/fan-quest/quests/create"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
            >
              + 생성하기
            </Link>
          </div>
        }
      />

      {/* Tab Menu */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex gap-0 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'quest' && (
        <>
          <div className="mb-4">
            <FilterBar
              filters={filterConfig}
              onFilterChange={(key, value) => setQuestFilters({ [key]: value })}
              onReset={resetQuestFilters}
            />
          </div>

          <DataTable<Quest & Record<string, unknown>>
            columns={questColumns}
            data={paginatedQuests as (Quest & Record<string, unknown>)[]}
            onRowClick={(item) => router.push(`/fan-quest/quests/${(item as unknown as Quest).id}`)}
            emptyMessage={
              questFilters.searchQuery || questFilters.status
                ? '검색 조건에 맞는 Quest가 없습니다.'
                : '등록된 Quest가 없습니다.'
            }
          />

          <Pagination
            currentPage={questPage}
            totalPages={totalPages}
            onPageChange={setQuestPage}
          />
        </>
      )}

      {activeTab === 'raffle' && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-gray-400 text-sm">Raffle 목록 (Phase 2 구현 예정)</p>
        </div>
      )}
    </div>
  );
}
