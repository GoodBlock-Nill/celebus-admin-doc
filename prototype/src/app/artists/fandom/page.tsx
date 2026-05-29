'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardRow from '@/components/clone/StatCardRow';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { toast } from '@/components/ui/Toast';
import {
  fandomLevels,
  FANDOM_SEASONS,
  computeLevelStatus,
  type FandomLevel,
  type FandomStatus,
} from '@/mock/fandom';
import FandomCreateModal from './_components/FandomCreateModal';

const PAGE_SIZE = 10;

function statusBadge(s: FandomStatus) {
  if (s === '진행중') return 'bg-emerald-500 text-white';
  if (s === '준비') return 'bg-gray-100 text-gray-600';
  return 'bg-gray-800 text-white'; // 종료
}

export default function FandomListPage() {
  const router = useRouter();
  const [items, setItems] = useState<FandomLevel[]>(fandomLevels);
  const [statusFilter, setStatusFilter] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const stats = useMemo(() => ({
    준비: items.filter((f) => f.status === '준비').length,
    진행중: items.filter((f) => f.status === '진행중').length,
    종료: items.filter((f) => f.status === '종료').length,
  }), [items]);

  const filtered = useMemo(() => items
    .filter((f) => (statusFilter ? f.status === statusFilter : true))
    .filter((f) => (seasonFilter ? f.season === seasonFilter : true))
    .filter((f) => (keyword ? f.groupName.toLowerCase().includes(keyword.toLowerCase()) : true))
    .sort((a, b) => b.accumulatedDuk - a.accumulatedDuk),
  [items, statusFilter, seasonFilter, keyword]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleStatus = (s: string) => { setStatusFilter((prev) => (prev === s ? '' : s)); setPage(1); };

  const handleCreate = (groupName: string, season: string, year: number) => {
    const newItem: FandomLevel = {
      id: Math.max(0, ...items.map((i) => i.id)) + 1,
      status: '준비', levelStatus: '운영중', groupName, season,
      seasonPeriod: `${year}.01.01 ~ ${year}.12.31`,
      levels: [], currentLevel: 0, accumulatedDuk: 0, participants: 0,
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ').replace(/-/g, '.'),
      rewards: [], levelUpHistory: [], biveGrants: [],
    };
    setItems([newItem, ...items]);
    setCreateOpen(false);
    toast.success(`'${season}' 팬덤레벨을 생성했습니다.`);
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="팬덤레벨" breadcrumbItems={[{ label: '아티스트' }, { label: '팬덤레벨' }]} />
        <button onClick={() => setCreateOpen(true)} className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
          <PlusIcon className="w-4 h-4" />생성
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCardRow label="준비" count={stats.준비} onClick={() => toggleStatus('준비')} active={statusFilter === '준비'} />
        <StatCardRow label="진행중" count={stats.진행중} onClick={() => toggleStatus('진행중')} active={statusFilter === '진행중'} countClassName="text-emerald-600" />
        <StatCardRow label="종료" count={stats.종료} onClick={() => toggleStatus('종료')} active={statusFilter === '종료'} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">상태(전체)</option>
            <option value="준비">준비</option>
            <option value="진행중">진행중</option>
            <option value="종료">종료</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={seasonFilter}
            onChange={(e) => { setSeasonFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">시즌(전체)</option>
            {FANDOM_SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
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
          onClick={() => { setStatusFilter(''); setSeasonFilter(''); setKeyword(''); setPage(1); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >초기화</button>
      </div>

      <SimpleTable<FandomLevel>
        columns={[
          { key: 'status', label: '상태', width: '90px', render: (r) => (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(r.status)}`}>{r.status}</span>
          )},
          { key: 'groupName', label: '그룹', width: '160px', render: (r) => <span className="font-medium text-gray-900">{r.groupName}</span> },
          { key: 'season', label: '현재 시즌', width: '200px', render: (r) => <span className="text-gray-700">{r.season}</span> },
          { key: 'seasonPeriod', label: '시즌 기간', width: '210px', render: (r) => <span className="text-gray-500">{r.seasonPeriod}</span> },
          { key: 'levelCount', label: '레벨 수', width: '90px', render: (r) => r.levels.length || '-' },
          { key: 'currentLevel', label: '현재 팬덤 레벨', width: '140px', render: (r) => (
            r.levels.length === 0 ? <span className="text-gray-400">-</span> : (
              <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-indigo-100 text-indigo-700">
                Lv.{r.currentLevel}{computeLevelStatus(r.currentLevel, r.levels.length) === '최고레벨' ? ' MAX' : ''}
              </span>
            )
          )},
          { key: 'accumulatedDuk', label: '누적 덕력', width: '130px', render: (r) => <span className="text-gray-700">{r.accumulatedDuk.toLocaleString()}</span> },
          { key: 'participants', label: '참여 팬 수', width: '110px', render: (r) => r.participants.toLocaleString() },
          { key: 'updatedAt', label: '업데이트 일시', width: '160px' },
        ]}
        rows={paged}
        onRowClick={(f) => router.push(`/artists/fandom/${f.id}`)}
        emptyMessage={statusFilter || seasonFilter || keyword ? '검색 결과가 없습니다.' : '생성된 팬덤레벨이 없습니다.'}
      />

      <SimplePagination page={page} totalPages={totalPages || 1} onChange={setPage} />

      <FandomCreateModal isOpen={createOpen} existing={items} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
    </div>
  );
}
