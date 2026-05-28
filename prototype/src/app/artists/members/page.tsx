'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { Cog6ToothIcon, PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardRow from '@/components/clone/StatCardRow';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { artistMembers, artistStats, type ArtistMember } from '@/mock/artists';

const PAGE_SIZE = 15;

type SearchTarget = 'member' | 'group';

export default function MembersListPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('Active');
  const [searchTarget, setSearchTarget] = useState<SearchTarget>('member');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const filtered = artistMembers
    .filter((m) => (statusFilter ? m.status === statusFilter : true))
    .filter((m) => {
      if (!keyword) return true;
      if (searchTarget === 'member') return m.name.includes(keyword);
      // 검색대상=그룹명: 멤버의 소속 그룹명으로 검색 (보유 관계 데이터 한도)
      return (m.groups ?? []).some((g) => g.name.includes(keyword));
    });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleStatus = (s: string) => { setStatusFilter((prev) => (prev === s ? '' : s)); setPage(1); };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="멤버 리스트" breadcrumbItems={[{ label: '아티스트' }, { label: '멤버 리스트' }]} />
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/artists/members/agencies')}
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Cog6ToothIcon className="w-4 h-4" />소속사 설정
          </button>
          <button
            onClick={() => router.push('/artists/members/create')}
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <PlusIcon className="w-4 h-4" />멤버 생성
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCardRow label="전체" count={artistStats.members.total} onClick={() => toggleStatus('')} active={statusFilter === ''} />
        <StatCardRow label="Active" count={artistStats.members.active} onClick={() => toggleStatus('Active')} active={statusFilter === 'Active'} />
        <StatCardRow label="Inactive" count={artistStats.members.inactive} onClick={() => toggleStatus('Inactive')} active={statusFilter === 'Inactive'} countClassName="text-rose-500" />
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
          <select
            value={searchTarget}
            onChange={(e) => { setSearchTarget(e.target.value as SearchTarget); setKeyword(''); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="member">멤버명</option>
            <option value="group">그룹명</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder={searchTarget === 'member' ? '멤버명 입력' : '그룹명 입력'}
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[260px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => { setStatusFilter(''); setSearchTarget('member'); setKeyword(''); setPage(1); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >초기화</button>
      </div>

      <SimpleTable<ArtistMember>
        columns={[
          { key: 'status', label: '상태', width: '90px', render: (r) => (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${r.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-red-100 text-red-700'}`}>
              {r.status}
            </span>
          )},
          { key: 'name', label: '멤버명', width: '180px', render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
          { key: 'groupCount', label: '소속 그룹 수', width: '110px' },
          { key: 'birthday', label: '생년월일', width: '130px' },
          { key: 'gender', label: '성별', width: '80px' },
          { key: 'updatedAt', label: '업데이트 일시', width: '160px' },
        ]}
        rows={paged}
        onRowClick={(m) => router.push(`/artists/members/${m.id}?tab=info`)}
        emptyMessage="등록된 멤버가 없습니다."
      />

      <SimplePagination page={page} totalPages={totalPages || 1} onChange={setPage} />
    </div>
  );
}
