'use client';

import { useState } from 'react';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { gpHistory, type GPHistoryEntry } from '@/mock/gamezone';

const PAGE_SIZE = 20;

export default function GPHistoryPage() {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const filtered = keyword ? gpHistory.filter((g) => g.nickname.toLowerCase().includes(keyword.toLowerCase())) : gpHistory;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader title="GP 변동 내역" breadcrumbItems={[{ label: '게임존' }, { label: 'GP 변동 내역' }]} />

      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <select className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]">
            <option>조회기간 전체</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[140px]">
            <option>변동 유형 전체</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          placeholder="닉네임 검색"
          className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[280px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <SimpleTable<GPHistoryEntry>
        columns={[
          { key: 'occurredAt', label: '일시', width: '180px' },
          { key: 'nickname', label: '닉네임', width: '180px', render: (r) => <span className="text-indigo-600 font-medium">{r.nickname}</span> },
          { key: 'type', label: '유형', width: '90px', render: (r) => r.type ? (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${r.type === 'GP 충전' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{r.type}</span>
          ) : '' },
          { key: 'gameType', label: '게임유형', width: '90px', render: (r) => r.gameType || '-' },
          { key: 'amount', label: 'GP 변동', width: '110px', render: (r) => (
            <span className={r.amount > 0 ? 'text-blue-600 font-semibold' : 'text-red-500 font-semibold'}>
              {r.amount > 0 ? '+' : ''}{r.amount} GP
            </span>
          ) },
          { key: 'balanceAfter', label: '변동 후 잔액', width: '110px', render: (r) => `${r.balanceAfter} GP` },
          { key: 'notes', label: '비고' },
        ]}
        rows={paged}
      />

      <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
