'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import {
  supportLedger, LEDGER_TYPES, SUPPORT_GROUPS, SUPPORT_EVENT_NAMES,
  type CheerLedger, type CheerLedgerType,
} from '@/mock/support';

const PAGE_SIZE = 10;

function amountText(r: CheerLedger): string {
  const sign = r.amount >= 0 ? '+' : '−';
  return `${sign}${Math.abs(r.amount).toLocaleString()} 덕력 ${r.type}`;
}

export default function SupportHistoryPage() {
  const router = useRouter();
  // 변동 유형은 필터가 아니라 탭으로 분리 — 응원 / 반환
  const [tab, setTab] = useState<CheerLedgerType>('응원');
  const [eventFilter, setEventFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => supportLedger
    .filter((r) => r.type === tab)
    .filter((r) => (eventFilter ? r.eventName === eventFilter : true))
    .filter((r) => (groupFilter ? r.groupName === groupFilter : true))
    .filter((r) => (keyword ? r.member.toLowerCase().includes(keyword.toLowerCase()) : true)),
  [tab, eventFilter, groupFilter, keyword]);

  const tabCount = (t: CheerLedgerType) => supportLedger.filter((r) => r.type === t).length;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="응원·반환 변동 내역"
          breadcrumbItems={[{ label: '아티스트' }, { label: '서포트 관리', href: '/artists/support' }, { label: '변동 내역' }]} />
        <button onClick={() => router.push('/artists/support')}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          <ArrowLeftIcon className="w-4 h-4" />서포트 관리
        </button>
      </div>

      {/* 변동 유형 탭 — 응원 / 반환 */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        {LEDGER_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`relative h-10 px-4 text-sm font-medium -mb-px border-b-2 ${
              tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t} <span className="text-xs text-gray-400">({tabCount(t).toLocaleString()})</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Dropdown value={eventFilter} onChange={(v) => { setEventFilter(v); setPage(1); }} placeholder="이벤트(전체)" options={SUPPORT_EVENT_NAMES} minW={240} />
        <Dropdown value={groupFilter} onChange={(v) => { setGroupFilter(v); setPage(1); }} placeholder="그룹(전체)" options={SUPPORT_GROUPS} minW={170} />
        <div className="flex-1" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} placeholder="닉네임 입력"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[220px] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button onClick={() => { setEventFilter(''); setGroupFilter(''); setKeyword(''); setPage(1); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">초기화</button>
      </div>

      <SimpleTable<CheerLedger>
        columns={[
          { key: 'member', label: '회원', width: '150px', render: (r) => <span className="font-medium text-gray-900">{r.member}</span> },
          { key: 'eventName', label: '이벤트명' },
          { key: 'groupName', label: '그룹', width: '140px' },
          { key: 'amount', label: '변동 내용', width: '200px', render: (r) => (
            <span className={r.type === '반환' ? 'text-rose-600' : 'text-emerald-600'}>{amountText(r)}</span>
          )},
          { key: 'at', label: '일시', width: '160px', render: (r) => <span className="text-gray-500">{r.at}</span> },
        ]}
        rows={paged}
        emptyMessage={`조회된 ${tab} 내역이 없습니다.`}
      />

      <SimplePagination page={page} totalPages={totalPages || 1} onChange={setPage} />
    </div>
  );
}

function Dropdown({ value, onChange, placeholder, options, minW }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: string[]; minW: number;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ minWidth: minW }}
        className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
