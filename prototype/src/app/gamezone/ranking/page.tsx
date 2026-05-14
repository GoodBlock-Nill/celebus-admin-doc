'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { Cog6ToothIcon, MagnifyingGlassMinusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';

export default function RankingPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="랭킹" breadcrumbItems={[{ label: '게임존' }, { label: '랭킹' }]} />
        <button className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <Cog6ToothIcon className="w-4 h-4" />랭킹 설정
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6">
        <p className="text-sm text-blue-800">
          Prediction Market과 Survival Trivia의 누적 GP를 통합하여 랭킹이 산출됩니다.
        </p>
      </div>

      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="닉네임 검색"
          className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[280px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <h3 className="text-base font-semibold text-gray-900 mb-3">TOP 10</h3>
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center mb-8">
        <MagnifyingGlassMinusIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-500">TOP 10 데이터가 없습니다.</p>
      </div>

      <SimpleTable<{ id: number }>
        columns={[
          { key: 'rank', label: '순위' },
          { key: 'nickname', label: '닉네임' },
          { key: 'totalGp', label: '누적 GP' },
          { key: 'plays', label: '참여 횟수' },
          { key: 'winRate', label: '승률' },
          { key: 'lastPlayedAt', label: '최근 참여일' },
        ]}
        rows={[]}
        emptyMessage="랭킹 데이터를 불러오는 중입니다."
      />

      <SimplePagination page={1} totalPages={1} onChange={() => {}} />
    </div>
  );
}
