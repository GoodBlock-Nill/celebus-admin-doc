'use client';

import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { getEditionById, getEditionTokens, BIVE_GRADES, type BiveToken, type BiveStatus, type BiveGrade } from '@/mock/bive';

const PAGE_SIZE = 20;

type SearchTarget = '명칭' | '아티스트 그룹' | '아티스트';

const STATUS_BADGE: Record<BiveStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Inactive: 'bg-red-100 text-red-700',
  Draft: 'bg-amber-100 text-amber-700',
};

export default function EditionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const editionId = parseInt(id, 10);
  const edition = getEditionById(editionId);
  const tokens = getEditionTokens(editionId);

  const [statusFilter, setStatusFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [searchTarget, setSearchTarget] = useState<SearchTarget>('명칭');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return tokens
      .filter((t) => (statusFilter ? t.status === statusFilter : true))
      .filter((t) => (gradeFilter ? t.grade === gradeFilter : true))
      .filter((t) => {
        if (!keyword) return true;
        const kw = keyword.toLowerCase();
        if (searchTarget === '명칭') return t.name.toLowerCase().includes(kw);
        if (searchTarget === '아티스트 그룹') return t.artistGroup.toLowerCase().includes(kw);
        return t.artist.toLowerCase().includes(kw);
      });
  }, [tokens, statusFilter, gradeFilter, searchTarget, keyword]);

  if (!edition) {
    return <div className="p-8 text-sm text-gray-500">에디션을 찾을 수 없습니다.</div>;
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="BIVE 관리"
          breadcrumbItems={[
            { label: 'BIVE' },
            { label: '에디션 관리', href: '/bive/editions' },
            { label: '에디션 BIVE 관리' },
          ]}
        />
        <button
          onClick={() => router.push(`/bive/editions/${editionId}/create`)}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-4 h-4" />BIVE 등록
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="">상태(전체)</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Draft">Draft</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={gradeFilter}
            onChange={(e) => { setGradeFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="">등급(전체)</option>
            {BIVE_GRADES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <select
            value={searchTarget}
            onChange={(e) => { setSearchTarget(e.target.value as SearchTarget); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[130px]"
          >
            <option>명칭</option>
            <option>아티스트 그룹</option>
            <option>아티스트</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="명칭 입력"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <SimpleTable<BiveToken>
        columns={[
          { key: 'status', label: '상태', width: '90px', render: (r) => (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[r.status]}`}>
              {r.status}
            </span>
          )},
          { key: 'name', label: '명칭', render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
          { key: 'artistGroup', label: '아티스트 그룹', width: '120px' },
          { key: 'artist', label: '아티스트', width: '110px' },
          { key: 'grade', label: '등급', width: '90px', render: (r: BiveToken) => r.grade as BiveGrade },
          { key: 'gradeNumber', label: '등급번호', width: '90px' },
          { key: 'mintEvent', label: '민팅 이벤트', width: '110px', render: (r) => (r.mintEvent ? r.mintEvent : '-') },
          { key: 'mintedCount', label: '발행 수', width: '90px', render: (r) => (r.mintedCount ? r.mintedCount.toLocaleString() : '-') },
          { key: 'registeredAt', label: '등록일시', width: '110px' },
        ]}
        rows={paged}
        emptyMessage={tokens.length === 0 ? '등록된 BIVE가 없습니다.' : '조건에 맞는 BIVE가 없습니다.'}
        onRowClick={(t) => router.push(`/bive/editions/${editionId}/bives/${t.id}`)}
      />

      <SimplePagination page={page} totalPages={totalPages || 1} onChange={setPage} />
    </div>
  );
}
