'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { rftLogs, sourcePolicies, type RftLog, type RftSourceFeature } from '@/mock/rft';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: 'all', label: '변동 유형(전체)' },
  { value: 'ISSUED', label: '발급' },
  { value: 'USED', label: '사용' },
] as const;

function HistoryInner() {
  const search = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<'all' | 'ISSUED' | 'USED'>('all');
  const [sourceFilter, setSourceFilter] = useState<RftSourceFeature | 'all'>(
    (search.get('source') as RftSourceFeature) ?? 'all',
  );
  const [artistFilter, setArtistFilter] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const sourceLabelMap = useMemo(
    () => Object.fromEntries(sourcePolicies.map((s) => [s.code, s.nameKO])),
    [],
  );

  const filtered = useMemo(() => {
    return rftLogs.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && l.sourceFeature !== sourceFilter) return false;
      if (artistFilter !== 'all') {
        const a = l.sourceArtistContext ?? '전역';
        if (a !== artistFilter) return false;
      }
      if (keyword && !l.nickname.toLowerCase().includes(keyword.toLowerCase())) return false;
      return true;
    });
  }, [statusFilter, sourceFilter, artistFilter, keyword]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const aggIssued = filtered.filter((l) => l.delta > 0).reduce((s, l) => s + l.delta, 0);
  const aggUsed = -filtered.filter((l) => l.delta < 0).reduce((s, l) => s + l.delta, 0);

  return (
    <div>
      <PageHeader title="응모권 변동 내역" breadcrumbItems={[{ label: '응모권' }, { label: '변동 내역' }]} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as 'all' | 'ISSUED' | 'USED'); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value as RftSourceFeature | 'all'); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="all">출처(전체)</option>
            {sourcePolicies.map((s) => <option key={s.code} value={s.code}>{s.nameKO}</option>)}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={artistFilter}
            onChange={(e) => { setArtistFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="all">아티스트 컨텍스트(전체)</option>
            <option value="V01D">V01D</option>
            <option value="iKON">iKON</option>
            <option value="CELEBUS">CELEBUS</option>
            <option value="전역">전역(NULL)</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="닉네임 검색"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[220px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => {
            setStatusFilter('all'); setSourceFilter('all'); setArtistFilter('all'); setKeyword(''); setPage(1);
          }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          초기화
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">필터 결과</div>
          <div className="text-lg font-bold text-gray-900">{filtered.length.toLocaleString()}건</div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3">
          <div className="text-xs text-emerald-700 mb-1">발급 합계</div>
          <div className="text-lg font-bold text-emerald-700">+{aggIssued.toLocaleString()}장</div>
        </div>
        <div className="bg-rose-50 rounded-lg p-3">
          <div className="text-xs text-rose-700 mb-1">사용 합계</div>
          <div className="text-lg font-bold text-rose-700">-{aggUsed.toLocaleString()}장</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-3">
          <div className="text-xs text-indigo-700 mb-1">순변동</div>
          <div className="text-lg font-bold text-indigo-700">{aggIssued - aggUsed >= 0 ? '+' : ''}{(aggIssued - aggUsed).toLocaleString()}장</div>
        </div>
      </div>

      <SimpleTable<RftLog>
        columns={[
          { key: 'occurredAt', label: '일시', width: '130px' },
          { key: 'nickname', label: '회원', width: '160px', render: (r) => (
            <span className="text-gray-900 font-medium">{r.nickname}</span>
          )},
          { key: 'status', label: '상태', width: '80px', render: (r) => (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              r.status === 'ISSUED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {r.status === 'ISSUED' ? '발급' : '사용'}
            </span>
          )},
          { key: 'delta', label: '변동', width: '90px', align: 'right', render: (r) => (
            <span className={r.delta > 0 ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold'}>
              {r.delta > 0 ? '+' : ''}{r.delta}장
            </span>
          )},
          { key: 'balanceAfter', label: '잔액', width: '80px', align: 'right', render: (r) => (
            <span className="text-gray-700">{r.balanceAfter}장</span>
          )},
          { key: 'sourceFeature', label: '출처', width: '160px', render: (r) => (
            <span className="text-gray-700">{sourceLabelMap[r.sourceFeature] ?? r.sourceFeature}</span>
          )},
          { key: 'sourceArtistContext', label: '아티스트 컨텍스트', width: '150px', render: (r) => (
            <span className={r.sourceArtistContext ? 'inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700' : 'text-gray-400 text-xs'}>
              {r.sourceArtistContext ?? '전역'}
            </span>
          )},
          { key: 'sourceRefId', label: '참조', render: (r) => (
            <span className="text-gray-500 text-xs">{r.sourceRefId}</span>
          )},
        ]}
        rows={paged}
        emptyMessage="조건에 맞는 변동 내역이 없습니다."
      />

      <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

export default function RftHistoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">로딩 중...</div>}>
      <HistoryInner />
    </Suspense>
  );
}
