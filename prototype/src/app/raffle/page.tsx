'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { raffles, RAFFLE_STATUS_BADGE, type Raffle, type RaffleStatus } from '@/mock/fanquest';

const PAGE_SIZE = 20;

type SearchType = 'title' | 'artist';

export default function RaffleListPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'' | RaffleStatus>('');
  const [searchType, setSearchType] = useState<SearchType>('title');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  // 기본 정렬: 마감일 임박순. 단, 종료·임시저장은 마지막 그룹.
  // 그룹 1 (진행중·추첨대기) — 마감일 임박순
  // 그룹 2 (종료) — 마감일 최근순 (최근 종료가 위)
  // 그룹 3 (임시저장) — 최근 수정 순
  const STATUS_GROUP: Record<RaffleStatus, number> = {
    '진행중': 0,
    '추첨대기': 0,
    '종료': 1,
    '임시저장': 2,
  };
  const filtered = raffles
    .filter((r) => (statusFilter ? r.status === statusFilter : true))
    .filter((r) => {
      if (!keyword) return true;
      const target = searchType === 'artist' ? r.artist : r.titleKO;
      return target.toLowerCase().includes(keyword.toLowerCase());
    })
    .slice()
    .sort((a, b) => {
      const ga = STATUS_GROUP[a.status];
      const gb = STATUS_GROUP[b.status];
      if (ga !== gb) return ga - gb;
      if (ga === 0) return a.endAt.localeCompare(b.endAt); // 임박순 = 빠른 마감 위
      if (ga === 1) return b.endAt.localeCompare(a.endAt); // 종료는 최근순
      return b.updatedAt.localeCompare(a.updatedAt);      // 임시저장은 최근 수정 순
    });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader title="래플" breadcrumbItems={[{ label: '래플' }, { label: '래플' }]} />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as '' | RaffleStatus); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="">상태(전체)</option>
            <option value="임시저장">임시저장</option>
            <option value="진행중">진행중</option>
            <option value="추첨대기">추첨대기</option>
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
          onClick={() => router.push('/raffle/create')}
          className="h-10 px-4 inline-flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100"
        >
          생성하기
        </button>
      </div>

      <SimpleTable<Raffle>
        columns={[
          { key: 'status', label: '상태', width: '100px', render: (r) => (
            <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${RAFFLE_STATUS_BADGE[r.status]}`}>{r.status}</span>
          )},
          { key: 'titleKO', label: '타이틀', render: (r) => <span className="text-gray-900">{r.titleKO}</span> },
          { key: 'artist', label: '아티스트', width: '110px' },
          { key: 'period', label: '기간', width: '200px', render: (r) => (
            <span className="text-gray-700">{r.startAt ? r.startAt.slice(0, 10) : '—'} ~ {r.endAt.slice(0, 10)}</span>
          )},
          { key: 'totalParticipants', label: '누적 참여자', width: '100px', align: 'right', render: (r) => (
            <span className="text-gray-900">{r.totalParticipants.toLocaleString('ko-KR')}</span>
          )},
          { key: 'totalTicketsUsed', label: '누적 응모권', width: '110px', align: 'right', render: (r) => (
            <span className="text-gray-900">{r.totalTicketsUsed.toLocaleString('ko-KR')}</span>
          )},
          { key: 'hidden', label: '숨김', width: '70px', align: 'center', render: (r) => (
            r.hidden
              ? <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-rose-50 text-rose-600">숨김</span>
              : <span className="text-gray-300">—</span>
          )},
        ]}
        rows={paged}
        emptyMessage="래플이 없습니다."
        onRowClick={(r) => router.push(`/raffle/${r.id}`)}
      />

      <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
