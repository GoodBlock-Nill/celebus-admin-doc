'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { quests, REPEAT_CYCLE_LABEL, type Quest, type QuestStatus } from '@/mock/fanquest';

const PAGE_SIZE = 10;

export const QUEST_STATUS_BADGE: Record<QuestStatus, string> = {
  '진행중': 'bg-emerald-100 text-emerald-700',
  '임시저장': 'bg-gray-200 text-gray-700',
  '종료': 'bg-gray-400 text-white',
};

type SearchType = 'title' | 'artist';

export default function SqQuestsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'' | QuestStatus>('');
  const [searchType, setSearchType] = useState<SearchType>('title');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const filtered = quests
    .filter((q) => (statusFilter ? q.status === statusFilter : true))
    .filter((q) => {
      if (!keyword) return true;
      const target = searchType === 'artist' ? q.artist : q.title;
      return target.toLowerCase().includes(keyword.toLowerCase());
    });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="팬퀘스트"
        breadcrumbItems={[{ label: '에피소드' }, { label: '팬퀘스트' }]}
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as '' | QuestStatus); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="">상태(전체)</option>
            <option value="진행중">진행중</option>
            <option value="임시저장">임시저장</option>
            <option value="종료">종료</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <select
            value={searchType}
            onChange={(e) => { setSearchType(e.target.value as SearchType); setKeyword(''); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[120px] cursor-pointer"
          >
            <option value="title">타이틀</option>
            <option value="artist">아티스트</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder={searchType === 'artist' ? '아티스트 입력' : '타이틀 입력'}
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => { setStatusFilter(''); setSearchType('title'); setKeyword(''); setPage(1); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >초기화</button>
        <button
          onClick={() => router.push('/fanquest/reject-reasons')}
          className="h-10 px-4 inline-flex items-center text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100"
        >
          반려사유 설정
        </button>
        <button
          onClick={() => router.push('/fanquest/create')}
          className="h-10 px-4 inline-flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100"
        >
          생성하기
        </button>
      </div>

      <SimpleTable<Quest>
        columns={[
          { key: 'status', label: '상태', width: '100px', render: (r) => (
            <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${QUEST_STATUS_BADGE[r.status]}`}>{r.status}</span>
          )},
          { key: 'title', label: '타이틀', render: (r) => <span className="text-gray-900">{r.title}</span> },
          { key: 'artist', label: '아티스트', width: '110px' },
          { key: 'kind', label: '진행 방식', width: '90px', render: (r) => (
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              r.kind === '반복' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'
            }`}>{r.kind}</span>
          )},
          { key: 'repeatCycle', label: '반복 주기', width: '90px', render: (r) => (
            r.kind === '반복' && r.repeatCycle
              ? <span className="text-gray-700">{REPEAT_CYCLE_LABEL[r.repeatCycle]}</span>
              : <span className="text-gray-300">-</span>
          )},
          { key: 'period', label: '기간', width: '200px' },
          { key: 'reviewNeeded', label: '검토 필요', width: '90px', align: 'right', render: (r) => <span className="font-semibold text-gray-900">{r.reviewNeeded}</span> },
        ]}
        rows={paged}
        emptyMessage="팬퀘스트가 없습니다."
        onRowClick={(q) => router.push(`/fanquest/${q.id}?tab=info`)}
      />

      <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
