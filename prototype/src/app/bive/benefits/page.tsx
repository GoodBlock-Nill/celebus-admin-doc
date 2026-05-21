'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { biveBenefits, type BiveBenefit, type BenefitStatus, type BenefitType } from '@/mock/bive';

const TABS = [
  { key: 'BP' as BenefitType, label: 'Boost Point' },
  { key: 'TICKET' as BenefitType, label: 'Raffle Ticket' },
];

const PAGE_SIZE = 20;

const STATUS_BADGE: Record<BenefitStatus, string> = {
  '초안': 'bg-amber-100 text-amber-700',
  '대기': 'bg-blue-100 text-blue-700',
  '활성': 'bg-emerald-100 text-emerald-700',
  '중지': 'bg-red-100 text-red-700',
  '종료': 'bg-gray-200 text-gray-700',
};

const CYCLE_LABEL: Record<string, string> = { DAILY: '일일', WEEKLY: '주간', ONCE: '1회(획득 시)' };

export default function BenefitsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<BenefitType>('BP');
  const [statusFilter, setStatusFilter] = useState('');
  const [cycleFilter, setCycleFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return biveBenefits
      .filter((b) => b.type === tab)
      .filter((b) => (statusFilter ? b.status === statusFilter : true))
      .filter((b) => (cycleFilter ? b.cycle === cycleFilter : true))
      .filter((b) => (keyword ? b.name.toLowerCase().includes(keyword.toLowerCase()) : true));
  }, [tab, statusFilter, cycleFilter, keyword]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader title="혜택" breadcrumbItems={[{ label: 'BIVE' }, { label: '혜택 관리' }]} />

      <div className="flex items-center justify-between mb-6">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); setStatusFilter(''); setCycleFilter(''); setKeyword(''); }}
              className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >{t.label}</button>
          ))}
        </div>
        <p className="text-sm text-gray-500">일일/주간 혜택 지급시간: 00:05</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="">상태(전체)</option>
            <option value="초안">초안</option>
            <option value="대기">대기</option>
            <option value="활성">활성</option>
            <option value="중지">중지</option>
            <option value="종료">종료</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={cycleFilter}
            onChange={(e) => { setCycleFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="">지급주기(전체)</option>
            <option value="DAILY">일일</option>
            <option value="WEEKLY">주간</option>
            <option value="ONCE">1회(획득 시)</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="혜택 명칭 입력"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => { setStatusFilter(''); setCycleFilter(''); setKeyword(''); setPage(1); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >초기화</button>
        <button
          onClick={() => router.push(`/bive/benefits/create?type=${tab === 'BP' ? 'boostPoint' : 'ticket'}`)}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-4 h-4" />혜택 생성
        </button>
      </div>

      <SimpleTable<BiveBenefit>
        columns={[
          { key: 'status', label: '상태', width: '90px', render: (r) => (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[r.status]}`}>{r.status}</span>
          )},
          { key: 'name', label: '혜택 명칭', wrap: true, render: (r) => <span className="text-gray-900 font-medium">{r.name}</span> },
          { key: 'registeredBive', label: '등록된 BIVE', width: '110px' },
          { key: 'amount', label: tab === 'BP' ? 'BP수량' : '응모권수량', width: '110px', render: (r) => r.amount.toLocaleString() },
          { key: 'cycle', label: '지급 주기', width: '120px', render: (r) => CYCLE_LABEL[r.cycle] ?? r.cycle },
          { key: 'weekday', label: '지급 요일', width: '90px', render: (r) => r.weekday ?? '-' },
          { key: 'startDate', label: '시작일', width: '110px' },
          { key: 'endDate', label: '종료일', width: '110px' },
        ]}
        rows={paged}
        emptyMessage={
          biveBenefits.filter((b) => b.type === tab).length === 0
            ? '등록된 혜택이 없습니다.'
            : '조건에 맞는 혜택이 없습니다.'
        }
        onRowClick={(b) => router.push(`/bive/benefits/${b.id}?tab=info`)}
      />

      <SimplePagination page={page} totalPages={totalPages || 1} onChange={setPage} />
    </div>
  );
}
