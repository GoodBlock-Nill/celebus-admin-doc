'use client';

import { useState } from 'react';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';

export default function GamesPage() {
  const [type, setType] = useState<'PM' | 'ST'>('PM');
  const [page, setPage] = useState(1);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="게임 관리" breadcrumbItems={[{ label: '게임존' }, { label: '게임 관리' }]} />
        <button className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
          <PlusIcon className="w-4 h-4" />게임 생성
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'PM' | 'ST')}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="PM">Prediction Market</option>
            <option value="ST">Survival Trivia</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[140px]">
            <option>상태 전체</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="게임 타이틀 검색"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <SimpleTable<{ id: number }>
        columns={[
          { key: 'title', label: '타이틀' },
          { key: 'status', label: '상태' },
          { key: 'participants', label: '참여자 수' },
          { key: 'totalPrize', label: '총 상금 GP' },
          { key: 'period', label: '참여기간' },
          { key: 'createdAt', label: '생성일' },
          { key: 'admin', label: '관리자' },
        ]}
        rows={[]}
        emptyMessage="등록된 게임이 없습니다."
      />

      <SimplePagination page={page} totalPages={1} onChange={setPage} />
    </div>
  );
}
