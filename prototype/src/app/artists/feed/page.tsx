'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardRow from '@/components/clone/StatCardRow';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { feedItems, FEED_GROUPS, type FeedItem, type FeedType } from '@/mock/feed';

const PAGE_SIZE = 10;
const TABS: FeedType[] = ['소식', '일정', '공지'];

const typeBadge: Record<FeedType, string> = {
  소식: 'bg-blue-100 text-blue-700',
  일정: 'bg-violet-100 text-violet-700',
  공지: 'bg-rose-100 text-rose-700',
};

function statusBadge(s: string) {
  if (s === '게시') return 'bg-emerald-500 text-white';
  if (s === '임시저장') return 'bg-gray-100 text-gray-600';
  return 'bg-amber-100 text-amber-700'; // 보관
}

export default function FeedListPage() {
  const router = useRouter();
  const [tab, setTab] = useState<FeedType>('소식');
  const [statusFilter, setStatusFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const byType = useMemo(() => feedItems.filter((f) => f.type === tab), [tab]);

  const stats = useMemo(() => ({
    게시: byType.filter((f) => f.status === '게시').length,
    임시저장: byType.filter((f) => f.status === '임시저장').length,
    보관: byType.filter((f) => f.status === '보관').length,
  }), [byType]);

  const filtered = byType
    .filter((f) => (statusFilter ? f.status === statusFilter : true))
    .filter((f) => (groupFilter ? f.groupName === groupFilter : true))
    .filter((f) => (keyword ? f.title.KO.toLowerCase().includes(keyword.toLowerCase()) : true));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleStatus = (s: string) => { setStatusFilter((prev) => (prev === s ? '' : s)); setPage(1); };
  const switchTab = (t: FeedType) => { setTab(t); setStatusFilter(''); setKeyword(''); setPage(1); };
  const reset = () => { setStatusFilter(''); setGroupFilter(''); setKeyword(''); setPage(1); };

  const whenCell = (f: FeedItem) =>
    f.type === '일정'
      ? `${f.date}${f.time ? ` ${f.time}` : ''}${f.location ? ` · ${f.location}` : ''}`
      : f.date;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="소식/일정" breadcrumbItems={[{ label: '아티스트' }, { label: '소식/일정' }]} />
        <button
          onClick={() => router.push('/artists/feed/create')}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-4 h-4" />작성하기
        </button>
      </div>

      {/* 타입 탭 */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >{t}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCardRow label="게시" count={stats.게시} onClick={() => toggleStatus('게시')} active={statusFilter === '게시'} />
        <StatCardRow label="임시저장" count={stats.임시저장} onClick={() => toggleStatus('임시저장')} active={statusFilter === '임시저장'} />
        <StatCardRow label="보관" count={stats.보관} onClick={() => toggleStatus('보관')} active={statusFilter === '보관'} countClassName="text-amber-600" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">상태(전체)</option>
            <option value="게시">게시</option>
            <option value="임시저장">임시저장</option>
            <option value="보관">보관</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={groupFilter}
            onChange={(e) => { setGroupFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[160px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">그룹(전체)</option>
            {FEED_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="제목 입력"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[260px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={reset}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >초기화</button>
      </div>

      <SimpleTable<FeedItem>
        columns={[
          { key: 'status', label: '상태', width: '90px', render: (r) => (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(r.status)}`}>{r.status}</span>
          )},
          { key: 'type', label: '타입', width: '80px', render: (r) => (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${typeBadge[r.type]}`}>{r.type}</span>
          )},
          { key: 'title', label: '제목', render: (r) => <span className="block max-w-[420px] truncate font-medium text-gray-900">{r.title.KO}</span> },
          { key: 'groupName', label: '그룹', width: '150px' },
          { key: 'official', label: '공식', width: '70px', render: (r) => (
            r.type === '공지' ? <span className="text-gray-300">—</span>
              : r.official ? <span className="text-xs font-medium text-indigo-600">공식</span>
              : <span className="text-gray-300">—</span>
          )},
          { key: 'when', label: '일시', width: '260px', render: (r) => <span className="text-gray-600">{whenCell(r)}</span> },
        ]}
        rows={paged}
        onRowClick={(f) => router.push(`/artists/feed/${f.id}`)}
        emptyMessage={statusFilter || groupFilter || keyword ? '검색 결과가 없습니다.' : '등록된 콘텐츠가 없습니다.'}
      />

      <SimplePagination page={page} totalPages={totalPages || 1} onChange={setPage} />
    </div>
  );
}
