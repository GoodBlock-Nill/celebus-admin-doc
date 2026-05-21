'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { getQuestsWithPending, REPEAT_CYCLE_LABEL, type Quest } from '@/mock/fanquest';
import { QUEST_STATUS_BADGE } from '@/app/sq/quests/page';

const ARTIST_OPTIONS = ['전체', 'V01D', 'iKON', 'CELEBUS'] as const;
type ArtistFilter = typeof ARTIST_OPTIONS[number];

const PAGE_SIZE = 20;

export default function FanquestPendingPage() {
  const router = useRouter();
  const [artist, setArtist] = useState<ArtistFilter>('전체');
  const [page, setPage] = useState(1);

  // [CEB-BO-SQ-301] §2-3 정합 — 검토 필요(대기 건수) 내림차순 정렬 (2026-05-21 sync 정정)
  const all = useMemo(
    () => [...getQuestsWithPending()].sort((a, b) => (b.pendingCount ?? 0) - (a.pendingCount ?? 0)),
    []
  );
  const filtered = useMemo(
    () => (artist === '전체' ? all : all.filter((q) => q.artist === artist)),
    [all, artist],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="팬퀘스트 대기내역"
        breadcrumbItems={[{ label: '에피소드' }, { label: '팬퀘스트 대기내역' }]}
      />

      <p className="text-sm text-gray-500 mb-5 -mt-2">
        대기 중인 제출이 있는 팬퀘스트를 모아 빠르게 검수할 수 있습니다.
      </p>

      {/* 필터 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={artist}
            onChange={(e) => { setArtist(e.target.value as ArtistFilter); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            {ARTIST_OPTIONS.map((a) => (
              <option key={a} value={a}>{a === '전체' ? '아티스트(전체)' : a}</option>
            ))}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* 테이블 */}
      <SimpleTable<Quest>
        columns={[
          {
            key: 'status',
            label: '상태',
            width: '100px',
            render: (r) => (
              <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${QUEST_STATUS_BADGE[r.status]}`}>
                {r.status}
              </span>
            ),
          },
          { key: 'title', label: '타이틀', render: (r) => <span className="text-gray-900">{r.title}</span> },
          { key: 'artist', label: '아티스트', width: '100px' },
          {
            key: 'kind',
            label: '진행 방식',
            width: '90px',
            render: (r) => (
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                r.kind === '반복' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'
              }`}>{r.kind}</span>
            ),
          },
          {
            key: 'repeatCycle',
            label: '반복 주기',
            width: '90px',
            render: (r) =>
              r.kind === '반복' && r.repeatCycle
                ? <span className="text-gray-700">{REPEAT_CYCLE_LABEL[r.repeatCycle]}</span>
                : <span className="text-gray-300">-</span>,
          },
          {
            key: 'pendingCount',
            label: '검토필요',
            width: '100px',
            align: 'right',
            render: (r) => (
              <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                {r.pendingCount}
              </span>
            ),
          },
        ]}
        rows={paged}
        emptyMessage="검수가 필요한 팬퀘스트가 없습니다."
        onRowClick={(q) => router.push(`/fanquest/${q.id}?tab=pending`)}
      />

      <SimplePagination page={safePage} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
