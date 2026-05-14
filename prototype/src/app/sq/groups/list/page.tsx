'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import {
  episodeGroups,
  groupStats,
  type EpisodeGroup,
  type EpisodeGroupStatus,
} from '@/mock/sq';

const PAGE_SIZE = 10;

const STATUS_BADGE: Record<EpisodeGroupStatus, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: 'bg-gray-200', text: 'text-gray-700', label: 'DRAFT' },
  ACTIVE: { bg: 'bg-emerald-500', text: 'text-white', label: 'ACTIVE' },
  CLOSED: { bg: 'bg-gray-400', text: 'text-white', label: 'CLOSED' },
};

export default function GroupListPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [artistFilter, setArtistFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const filtered = episodeGroups
    .filter((g) => (statusFilter ? g.status === statusFilter : true))
    .filter((g) => (artistFilter ? g.artistGroup === artistFilter : true))
    .filter((g) => (keyword ? g.titleKO.toLowerCase().includes(keyword.toLowerCase()) : true));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="에피소드 그룹"
          breadcrumbItems={[{ label: '에피소드' }, { label: '그룹 리스트' }]}
        />
        <button
          onClick={() => router.push('/sq/groups/create')}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-4 h-4" />새 그룹 생성
        </button>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
        <p className="text-xs text-indigo-800 leading-relaxed">
          <strong>에피소드 그룹</strong>은 시즌·큐레이션 단위의 최상위 묶음입니다. 아티스트별로 운영하며 <strong>ACTIVE 상태는 아티스트당 1개만 허용</strong>됩니다.
          그룹 안에서 여러 에피소드를 생성하여 운영하세요.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatusCard label="전체 그룹" count={groupStats.total} barColor="bg-gray-300" labelStyle="text" />
        <StatusCard label="DRAFT" count={groupStats.draft} barColor="bg-gray-300" labelStyle="badge" badgeClass={STATUS_BADGE.DRAFT.bg + ' ' + STATUS_BADGE.DRAFT.text} />
        <StatusCard label="ACTIVE" count={groupStats.active} barColor="bg-emerald-500" labelStyle="badge" badgeClass={STATUS_BADGE.ACTIVE.bg + ' ' + STATUS_BADGE.ACTIVE.text} />
        <StatusCard label="CLOSED" count={groupStats.closed} barColor="bg-gray-400" labelStyle="badge" badgeClass={STATUS_BADGE.CLOSED.bg + ' ' + STATUS_BADGE.CLOSED.text} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="">상태(전체)</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="CLOSED">CLOSED</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={artistFilter}
            onChange={(e) => { setArtistFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="">아티스트(전체)</option>
            <option value="V01D">V01D</option>
            <option value="iKON">iKON</option>
            <option value="CELEBUS">CELEBUS</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="타이틀 검색"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[260px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => { setStatusFilter(''); setArtistFilter(''); setKeyword(''); setPage(1); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          초기화
        </button>
      </div>

      <SimpleTable<EpisodeGroup>
        columns={[
          { key: 'status', label: '상태', width: '90px', render: (g) => {
            const cfg = STATUS_BADGE[g.status];
            return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
          }},
          { key: 'artistGroup', label: '아티스트', width: '100px', render: (g) => (
            <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700">{g.artistGroup}</span>
          )},
          { key: 'titleKO', label: '타이틀', render: (g) => <span className="text-gray-900 font-medium">{g.titleKO}</span> },
          { key: 'episodeCount', label: '에피소드', width: '80px', align: 'right', render: (g) => `${g.episodeCount}` },
          { key: 'startDt', label: '시작일', width: '160px' },
          { key: 'endDt', label: '종료일', width: '160px' },
          { key: 'updatedBy', label: '최근 수정자', width: '110px' },
        ]}
        rows={paged}
        emptyMessage="조건에 맞는 그룹이 없습니다."
        onRowClick={(g) => router.push(`/sq/groups/${g.id}`)}
      />

      <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

function StatusCard({
  label,
  count,
  barColor,
  labelStyle,
  badgeClass,
}: {
  label: string;
  count: number;
  barColor: string;
  labelStyle: 'text' | 'badge';
  badgeClass?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className={`h-1 ${barColor}`} />
      <div className="p-5">
        {labelStyle === 'text' ? (
          <p className="text-sm text-gray-500 mb-3">{label}</p>
        ) : (
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium mb-3 ${badgeClass ?? ''}`}>{label}</span>
        )}
        <p className="text-3xl font-bold text-gray-900">{count.toLocaleString('ko-KR')}</p>
      </div>
    </div>
  );
}
