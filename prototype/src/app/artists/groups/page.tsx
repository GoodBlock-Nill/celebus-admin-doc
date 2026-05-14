'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { Cog6ToothIcon, PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardWithBar from '@/components/clone/StatCardWithBar';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { artistGroups, artistStats, type ArtistGroup } from '@/mock/artists';
import CreateGroupModal from './CreateGroupModal';

const PAGE_SIZE = 10;

export default function GroupsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = artistGroups
    .filter((g) => (statusFilter ? g.status === statusFilter : true))
    .filter((g) => (keyword ? g.name.toLowerCase().includes(keyword.toLowerCase()) : true));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="그룹 리스트" breadcrumbItems={[{ label: '아티스트' }, { label: '그룹 리스트' }]} />
        <div className="flex gap-2">
          <button className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Cog6ToothIcon className="w-4 h-4" />포지션 설정
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <PlusIcon className="w-4 h-4" />그룹 생성
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCardWithBar label="전체" count={artistStats.groups.total} variant="default" />
        <StatCardWithBar label="Active" count={artistStats.groups.active} variant="active" />
        <StatCardWithBar label="Inactive" count={artistStats.groups.inactive} variant="inactive" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">상태(전체)</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <select className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[120px]">
            <option>그룹명</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="그룹명 입력"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[260px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => { setStatusFilter(''); setKeyword(''); setPage(1); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >초기화</button>
      </div>

      <SimpleTable<ArtistGroup>
        columns={[
          { key: 'status', label: '상태', width: '90px', render: (r) => (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${r.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-red-100 text-red-700'}`}>
              {r.status}
            </span>
          )},
          { key: 'name', label: '그룹명', width: '220px', render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
          { key: 'memberCount', label: '멤버 수', width: '90px' },
          { key: 'description', label: '설명', render: (r) => <span className="line-clamp-1 text-gray-600">{r.description}</span> },
          { key: 'updatedAt', label: '업데이트 일시', width: '160px' },
        ]}
        rows={paged}
        onRowClick={(g) => router.push(`/artists/groups/${g.id}?tab=info`)}
        emptyMessage="등록된 그룹이 없습니다."
      />

      <SimplePagination page={page} totalPages={totalPages || 1} onChange={setPage} />

      <CreateGroupModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
