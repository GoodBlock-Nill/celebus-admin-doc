'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { PlusIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardRow from '@/components/clone/StatCardRow';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import {
  SUPPORT_GROUPS, SUPPORT_STATUSES,
  achieveRate, cheererCount,
  type SupportEvent, type SupportStatus,
} from '@/mock/support';
import { useSupportEventStore } from '@/stores/supportEventStore';

// 대시보드 = 7상태 개별 카드 (SUP-101 §2.2). 각 카드 클릭 시 해당 상태 단일 필터
const PAGE_SIZE = 10;

// 카드 카운트 색상 (상태 배지 톤과 정합)
const STATUS_COUNT_CLASS: Record<SupportStatus, string> = {
  임시저장: 'text-gray-500',
  모집대기: 'text-sky-600',
  모집중: 'text-emerald-600',
  달성: 'text-indigo-600',
  집행중: 'text-amber-600',
  완료: 'text-gray-800',
  미달성종료: 'text-rose-600',
  집행취소: 'text-rose-600',
};

export function statusBadge(s: SupportStatus): string {
  switch (s) {
    case '모집대기': return 'bg-sky-500 text-white';
    case '모집중': return 'bg-emerald-500 text-white';
    case '달성': return 'bg-indigo-500 text-white';
    case '집행중': return 'bg-amber-500 text-white';
    case '완료': return 'bg-gray-800 text-white';
    case '임시저장': return 'bg-gray-100 text-gray-600';
    case '미달성종료': return 'bg-rose-100 text-rose-700';
    case '집행취소': return 'bg-rose-100 text-rose-700';
  }
}

export default function SupportListPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  // 스토어 공유 — 상세에서 상태 변경 시 대시보드·목록 즉시 반영
  const events = useSupportEventStore((s) => s.events);

  // 상태별 카운트 (7상태 개별)
  const countByStatus = useMemo(() => {
    const acc = Object.fromEntries(SUPPORT_STATUSES.map((s) => [s, 0])) as Record<SupportStatus, number>;
    for (const e of events) acc[e.status] += 1;
    return acc;
  }, [events]);

  const filtered = useMemo(() => events
    .filter((e) => (statusFilter ? e.status === statusFilter : true))
    .filter((e) => (groupFilter ? e.groupName === groupFilter : true))
    .filter((e) => (keyword ? e.titleKo.toLowerCase().includes(keyword.toLowerCase()) : true)),
  [events, statusFilter, groupFilter, keyword]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleStatus = (s: string) => { setStatusFilter((prev) => (prev === s ? '' : s)); setPage(1); };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="서포트 관리" breadcrumbItems={[{ label: '아티스트' }, { label: '서포트 관리' }]} />
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/artists/support/history')}
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <ListBulletIcon className="w-4 h-4" />변동 내역
          </button>
          <button onClick={() => router.push('/artists/support/new')}
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
            <PlusIcon className="w-4 h-4" />이벤트 생성
          </button>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-2 mb-6">
        {SUPPORT_STATUSES.map((s) => (
          <StatCardRow
            key={s}
            label={s}
            count={countByStatus[s]}
            onClick={() => toggleStatus(s)}
            active={statusFilter === s}
            countClassName={STATUS_COUNT_CLASS[s]}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[150px] focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">상태(전체)</option>
            {SUPPORT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[180px] focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">그룹(전체)</option>
            {SUPPORT_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} placeholder="이벤트명 입력"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[260px] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button onClick={() => { setStatusFilter(''); setGroupFilter(''); setKeyword(''); setPage(1); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">초기화</button>
      </div>

      <SimpleTable<SupportEvent>
        columns={[
          { key: 'status', label: '상태', width: '100px', render: (r) => (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(r.status)}`}>{r.status}</span>
          )},
          { key: 'titleKo', label: '이벤트명', render: (r) => <span className="font-medium text-gray-900">{r.titleKo}</span> },
          { key: 'groupName', label: '그룹', width: '150px' },
          { key: 'period', label: '기간', width: '230px', render: (r) => <span className="text-gray-500">{r.startAt} ~ {r.endAt}</span> },
          { key: 'cheerers', label: '응원자 수', width: '100px', align: 'right', render: (r) => cheererCount(r).toLocaleString() },
          { key: 'accumulatedDuk', label: '누적 응원(덕력)', width: '140px', align: 'right', render: (r) => r.accumulatedDuk.toLocaleString() },
          { key: 'rate', label: '달성률', width: '90px', align: 'right', render: (r) => (
            <span className={achieveRate(r) >= 100 ? 'text-indigo-600 font-semibold' : 'text-gray-700'}>{achieveRate(r)}%</span>
          )},
        ]}
        rows={paged}
        onRowClick={(e) => router.push(`/artists/support/${e.id}`)}
        emptyMessage={statusFilter || groupFilter || keyword ? '검색 결과가 없습니다.' : '생성된 서포트 이벤트가 없습니다.'}
      />

      <SimplePagination page={page} totalPages={totalPages || 1} onChange={setPage} />
    </div>
  );
}
