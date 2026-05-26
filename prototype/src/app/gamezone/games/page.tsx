'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { ARTIST_GROUPS, games, type ArtistGroup, type GameStatus, type GameType, type PMGame, type STGame } from '@/mock/gamezone';

// [CEB-BO-GZ-201] 게임 리스트 — 운영 BO 정합 v1.6 (RFT/RFL 양식)
// 라우트: /gamezone/games?type={PM|ST} (기본 PM)

const STATUS_OPTIONS: { label: string; value: GameStatus | '' }[] = [
  { label: '상태 전체', value: '' },
  { label: '임시저장', value: '임시저장' },
  { label: '게시대기', value: '게시대기' },
  { label: '진행중', value: '진행중' },
  { label: '결과대기', value: '결과대기' },
  { label: '결과확정', value: '결과확정' },
  { label: '종료', value: '종료' },
];

const STATUS_BADGE: Record<GameStatus, string> = {
  '임시저장': 'bg-gray-100 text-gray-700',
  '게시대기': 'bg-blue-100 text-blue-700',
  '진행중': 'bg-emerald-100 text-emerald-700',
  '결과대기': 'bg-amber-100 text-amber-700',
  '결과확정': 'bg-violet-100 text-violet-700',
  '종료': 'bg-zinc-200 text-zinc-700',
};

const PAGE_SIZE = 20;

export default function GamesPage() {
  const [type, setType] = useState<GameType>('PM');
  const [status, setStatus] = useState<GameStatus | ''>('');
  const [artistFilter, setArtistFilter] = useState<ArtistGroup | ''>('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = games.filter((g) => g.type === type);
    if (status) list = list.filter((g) => g.status === status);
    if (artistFilter) list = list.filter((g) => g.artistGroup === artistFilter);
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      list = list.filter((g) =>
        g.title.toLowerCase().includes(kw) ||
        g.titleEN.toLowerCase().includes(kw),
      );
    }
    // 정렬: 생성일 내림차순
    return list.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [type, status, artistFilter, keyword]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pagedRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isPM = type === 'PM';

  const pmColumns = [
    { key: 'title', label: '타이틀', wrap: true },
    { key: 'artist', label: '아티스트', width: '120px' },
    { key: 'status', label: '상태', width: '120px' },
    { key: 'participants', label: '참여자 수', width: '110px' },
    { key: 'totalPrize', label: '총 상금 GP', width: '120px' },
    { key: 'period', label: '참여기간', width: '200px' },
    { key: 'createdAt', label: '생성일', width: '140px' },
    { key: 'admin', label: '관리자', width: '110px' },
  ];

  const stColumns = [
    { key: 'title', label: '타이틀', wrap: true },
    { key: 'artist', label: '아티스트', width: '120px' },
    { key: 'status', label: '상태', width: '100px' },
    { key: 'participants', label: '참여자 / 정원', width: '130px' },
    { key: 'maxPrize', label: '최대 상금 GP', width: '130px' },
    { key: 'cost', label: '참여 비용', width: '100px' },
    { key: 'startDateTime', label: '시작일시', width: '160px' },
    { key: 'admin', label: '관리자', width: '100px' },
  ];

  const rows = pagedRows.map((g) => {
    const badge = (
      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[g.status]}`}>
        {g.status}
      </span>
    );
    const titleCell = (
      <Link href={`/gamezone/games/${g.id}`} className="text-gray-900 hover:text-indigo-600 hover:underline">
        {g.title}
      </Link>
    );
    const artistBadge = (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
        {g.artistGroup}
      </span>
    );
    if (isPM) {
      const pm = g as PMGame;
      const period = pm.votingStart ? `${pm.votingStart} ~ ${pm.votingEnd}` : '-';
      return {
        title: titleCell,
        artist: artistBadge,
        status: badge,
        participants: pm.participants.toLocaleString(),
        totalPrize: `${pm.totalPrize.toLocaleString()} GP`,
        period,
        createdAt: pm.createdAt,
        admin: pm.admin,
      };
    }
    const st = g as STGame;
    const enrollment = st.maxParticipants === -1 ? `${st.participants} / ∞` : `${st.participants} / ${st.maxParticipants}`;
    return {
      title: titleCell,
      artist: artistBadge,
      status: badge,
      participants: enrollment,
      maxPrize: `${st.maxPrize.toLocaleString()} GP`,
      cost: `${st.participationCost.toLocaleString()} GP`,
      startDateTime: st.startDateTime,
      admin: st.admin,
    };
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="게임 관리"
          breadcrumbItems={[{ label: '게임존', href: '/gamezone/home' }, { label: '게임 관리' }]}
        />
        <Link
          href="/gamezone/games/create"
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-4 h-4" />게임 생성
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={type}
            onChange={(e) => { setType(e.target.value as GameType); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="PM">Prediction Market</option>
            <option value="ST">Survival Trivia</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as GameStatus | ''); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[140px]"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={artistFilter}
            onChange={(e) => { setArtistFilter(e.target.value as ArtistGroup | ''); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[140px]"
          >
            <option value="">아티스트 전체</option>
            {ARTIST_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setPage(1); }}
            placeholder="게임 타이틀 검색"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <SimpleTable
        columns={isPM ? pmColumns : stColumns}
        rows={rows}
        emptyMessage={status || keyword ? '검색 조건에 맞는 게임이 없습니다.' : '등록된 게임이 없습니다.'}
      />

      <div className="mt-6 flex items-center justify-center">
        <SimplePagination page={page} totalPages={pageCount} onChange={setPage} />
      </div>
    </div>
  );
}
