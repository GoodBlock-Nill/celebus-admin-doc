'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import GPHistoryDetailModal from '@/components/gamezone/GPHistoryDetailModal';
import { gpHistory, type GPHistoryEntry, type GPHistoryType } from '@/mock/gamezone';

const PAGE_SIZE = 20;

// [CEB-BO-GZ-601] v1.6 정합 — 컬럼 7종 + 변동 유형 7종 + 게임유형 컬럼 +
// 행 클릭 모달 + 페이지네이션 20건
export default function GPHistoryPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | GPHistoryType>('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<GPHistoryEntry | null>(null);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return gpHistory.filter((e) => {
      if (typeFilter && e.type !== typeFilter) return false;
      if (q) {
        const nick = e.nickname?.toLowerCase() ?? '';
        if (!nick.includes(q)) return false;
      }
      return true;
    });
  }, [keyword, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader title="GP 변동 내역" breadcrumbItems={[{ label: '게임존' }, { label: 'GP 변동 내역' }]} />

      <div className="flex items-center gap-2 mt-6 mb-3">
        <select
          className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer min-w-[140px]"
        >
          <option>조회기간 전체</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as typeof typeFilter);
            setPage(1);
          }}
          className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer min-w-[160px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">변동 유형 전체</option>
          <option value="참여">참여</option>
          <option value="부스팅">부스팅</option>
          <option value="환불">환불</option>
          <option value="보상">보상</option>
          <option value="GP 충전">GP 충전</option>
          <option value="GP 출금">GP 출금</option>
        </select>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            placeholder="닉네임 검색"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[280px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <SimpleTable<GPHistoryEntry>
        columns={[
          { key: 'occurredAt', label: '일시' },
          {
            key: 'nickname',
            label: '닉네임',
            render: (e) =>
              e.nickname && e.uid ? (
                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    router.push(`/members/${e.uid}?tab=basic`);
                  }}
                  className="font-medium text-indigo-600 hover:underline"
                >
                  {e.nickname}
                </button>
              ) : (
                <span className="text-gray-400">-</span>
              ),
          },
          {
            key: 'type',
            label: '유형',
            render: (e) =>
              e.type ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {e.type}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              ),
          },
          {
            key: 'gameType',
            label: '게임유형',
            render: (e) =>
              e.gameType ? (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    e.gameType === 'PM' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {e.gameType}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              ),
          },
          {
            key: 'amount',
            label: 'GP 변동',
            align: 'right',
            render: (e) => (
              <span className={`font-medium tabular-nums ${e.amount > 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                {e.amount > 0 ? '+' : ''}
                {e.amount} GP
              </span>
            ),
          },
          {
            key: 'balanceAfter',
            label: '변동 후 잔액',
            align: 'right',
            render: (e) => <span className="tabular-nums text-gray-700">{e.balanceAfter.toLocaleString()} GP</span>,
          },
          { key: 'notes', label: '비고' },
        ]}
        rows={paged}
        emptyMessage="GP 변동 내역이 없습니다."
        onRowClick={(e) => setSelected(e)}
      />

      <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />

      <GPHistoryDetailModal isOpen={!!selected} onClose={() => setSelected(null)} entry={selected} />
    </div>
  );
}
