'use client';

import { useState } from 'react';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import { biveBenefits, type BiveBenefit } from '@/mock/bive';
import CreateBenefitModal from './CreateBenefitModal';

const TABS = ['Boost Point', 'Raffle Ticket'] as const;

export default function BenefitsPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('Boost Point');
  const [statusFilter, setStatusFilter] = useState('');
  const [cycleFilter, setCycleFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = biveBenefits;

  return (
    <div>
      <PageHeader title="혜택" breadcrumbItems={[{ label: 'BIVE' }, { label: '혜택 관리' }]} />

      <div className="flex items-center justify-between mb-6">
        <div className="border-b-0 inline-flex bg-gray-100 rounded-lg p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >{t}</button>
          ))}
        </div>
        <p className="text-sm text-gray-500">일일/주간 혜택 지급시간: 00:05</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="">상태(전체)</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="">지급주기(전체)</option>
            <option value="DAILY">일일</option>
            <option value="WEEKLY">주간</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="혜택 명칭 입력"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => { setStatusFilter(''); setCycleFilter(''); setKeyword(''); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >초기화</button>
        <button
          onClick={() => setCreateOpen(true)}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50"
        >
          <PlusIcon className="w-4 h-4" />혜택 생성
        </button>
      </div>

      <SimpleTable<BiveBenefit>
        columns={[
          { key: 'status', label: '상태' },
          { key: 'name', label: '혜택 명칭' },
          { key: 'registeredBive', label: '등록된 BIVE' },
          { key: 'amount', label: 'BP수량' },
          { key: 'cycle', label: '지급 주기' },
          { key: 'weekday', label: '지급 요일' },
          { key: 'startDate', label: '시작일' },
          { key: 'endDate', label: '종료일' },
        ]}
        rows={filtered}
        emptyMessage="검색 결과가 없습니다."
      />

      <CreateBenefitModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        type={tab === 'Boost Point' ? 'BP' : 'TICKET'}
      />
    </div>
  );
}
