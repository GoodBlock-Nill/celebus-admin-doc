'use client';

import { useState } from 'react';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { artistAgencies, type ArtistAgency } from '@/mock/artists';
import AgencyModal from './AgencyModal';

const PAGE_SIZE = 10;

export default function AgenciesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ArtistAgency | null>(null);

  const filtered = artistAgencies
    .filter((a) => (statusFilter ? a.status === statusFilter : true))
    .filter((a) => (keyword ? a.operatorName.includes(keyword) : true));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="소속사 설정"
          breadcrumbItems={[{ label: '아티스트' }, { label: '멤버 리스트' }, { label: '소속사 설정' }]}
        />
        <button
          onClick={() => setAddOpen(true)}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-4 h-4" />새 소속사 추가
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">상태(전체)</option>
            <option value="사용">사용</option>
            <option value="미사용">미사용</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="운영자 노출명 입력"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[260px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => { setStatusFilter(''); setKeyword(''); setPage(1); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >초기화</button>
      </div>

      <SimpleTable<ArtistAgency>
        columns={[
          { key: 'status', label: '상태', width: '90px', render: (r) => (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${r.status === '사용' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {r.status}
            </span>
          )},
          { key: 'operatorName', label: '운영자 노출명', width: '220px', render: (r) => <span className="font-medium text-gray-900">{r.operatorName}</span> },
          { key: 'nameKO', label: '한국어 (유저 노출명)' },
          { key: 'nameEN', label: '영어 (유저 노출명)' },
          { key: 'nameJP', label: '일본어 (유저 노출명)' },
        ]}
        rows={paged}
        onRowClick={(a) => setEditTarget(a)}
        emptyMessage="검색 결과가 없습니다."
      />

      <SimplePagination page={page} totalPages={totalPages || 1} onChange={setPage} />

      <AgencyModal isOpen={addOpen} onClose={() => setAddOpen(false)} mode="add" />
      <AgencyModal isOpen={editTarget !== null} onClose={() => setEditTarget(null)} mode="edit" agency={editTarget} />
    </div>
  );
}
