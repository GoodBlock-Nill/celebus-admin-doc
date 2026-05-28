'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { Cog6ToothIcon, PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardRow from '@/components/clone/StatCardRow';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { toast } from '@/components/ui/Toast';
import { getGroupMembers, type ArtistGroup } from '@/mock/artists';
import { useArtistGroupStore } from '@/stores/artistGroupStore';

const PAGE_SIZE = 10;

type SearchTarget = 'group' | 'member';

export default function GroupsPage() {
  const router = useRouter();
  const groups = useArtistGroupStore((s) => s.groups);
  const toggleExposure = useArtistGroupStore((s) => s.toggleExposure);
  const [statusFilter, setStatusFilter] = useState('Active');
  const [searchTarget, setSearchTarget] = useState<SearchTarget>('group');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const stats = useMemo(() => ({
    total: groups.length,
    active: groups.filter((g) => g.status === 'Active').length,
    inactive: groups.filter((g) => g.status === 'Inactive').length,
  }), [groups]);

  const filtered = groups
    .filter((g) => (statusFilter ? g.status === statusFilter : true))
    .filter((g) => {
      if (!keyword) return true;
      const kw = keyword.toLowerCase();
      if (searchTarget === 'group') return g.name.toLowerCase().includes(kw);
      // 검색대상=멤버명: 해당 그룹 소속 멤버명으로 검색 (보유 관계 데이터 한도)
      return getGroupMembers(g.id).some((m) => m.name.toLowerCase().includes(kw));
    });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleStatus = (s: string) => { setStatusFilter((prev) => (prev === s ? '' : s)); setPage(1); };

  const handleToggleExposure = (g: ArtistGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = toggleExposure(g.id);
    toast.success(`'${g.name}'의 탐색 노출을 ${next ? '켬' : '끔'}(으)로 변경했습니다.`);
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="그룹 리스트" breadcrumbItems={[{ label: '아티스트' }, { label: '그룹 리스트' }]} />
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/artists/groups/positions')}
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Cog6ToothIcon className="w-4 h-4" />포지션 설정
          </button>
          <button
            onClick={() => router.push('/artists/groups/create')}
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <PlusIcon className="w-4 h-4" />그룹 생성
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCardRow label="전체" count={stats.total} onClick={() => toggleStatus('')} active={statusFilter === ''} />
        <StatCardRow label="Active" count={stats.active} onClick={() => toggleStatus('Active')} active={statusFilter === 'Active'} />
        <StatCardRow label="Inactive" count={stats.inactive} onClick={() => toggleStatus('Inactive')} active={statusFilter === 'Inactive'} countClassName="text-rose-500" />
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
            <option value="group">그룹명</option>
            <option value="member">멤버명</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder={searchTarget === 'group' ? '그룹명 입력' : '멤버명 입력'}
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[260px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => { setStatusFilter(''); setSearchTarget('group'); setKeyword(''); setPage(1); }}
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
          { key: 'name', label: '그룹명', width: '240px', render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
          { key: 'memberCount', label: '멤버 수', width: '90px' },
          { key: 'followerCount', label: '팔로워 수', width: '120px', render: (r) => <span className="text-gray-700">{(r.followerCount ?? 0).toLocaleString()}</span> },
          { key: 'exposed', label: '탐색 노출', width: '110px', render: (r) => {
            const on = r.exploreExposed ?? true;
            return (
              <button
                type="button"
                onClick={(e) => handleToggleExposure(r, e)}
                role="switch"
                aria-checked={on}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            );
          }},
          { key: 'updatedAt', label: '업데이트 일시', width: '160px' },
        ]}
        rows={paged}
        onRowClick={(g) => router.push(`/artists/groups/${g.id}?tab=info`)}
        emptyMessage={keyword || statusFilter ? '검색 결과가 없습니다.' : '등록된 그룹이 없습니다.'}
      />

      <SimplePagination page={page} totalPages={totalPages || 1} onChange={setPage} />
    </div>
  );
}
