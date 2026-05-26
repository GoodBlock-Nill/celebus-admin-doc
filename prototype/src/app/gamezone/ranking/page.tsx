'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { Cog6ToothIcon, MagnifyingGlassMinusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { rankings, type RankingEntry } from '@/mock/gamezone';

const PAGE_SIZE = 50;

// [CEB-BO-GZ-401] v1.3 정합 — 안내 띠 / TOP 10 5×2 카드(메달) / 테이블 6컬럼 /
// 닉네임 클릭 → `/members/{id}?tab=basic` 같은 탭 이동 / 페이지 50건 / Previous-Next 영문
export default function RankingPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return rankings;
    return rankings.filter((r) => r.nickname.toLowerCase().includes(q));
  }, [keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // TOP 10 — 검색이 활성이면 검색 결과 상위 10명 (운영 BO는 검색 시 TOP 10 유지/축소)
  const top10 = filtered.slice(0, 10);

  const goMember = (uid: number) => router.push(`/members/${uid}?tab=basic`);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="랭킹" breadcrumbItems={[{ label: '게임존' }, { label: '랭킹' }]} />
        <button
          onClick={() => router.push('/gamezone/ranking/settings')}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Cog6ToothIcon className="w-4 h-4" />
          랭킹 설정
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
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(1);
          }}
          placeholder="닉네임 검색"
          className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[280px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <h3 className="text-base font-semibold text-gray-900 mb-3">TOP 10</h3>
      {top10.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center mb-8">
          <MagnifyingGlassMinusIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">TOP 10 데이터가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-3 mb-8">
          {top10.map((r) => (
            <RankingTopCard key={r.uid} entry={r} onClick={() => goMember(r.uid)} />
          ))}
        </div>
      )}

      <SimpleTable<RankingEntry>
        columns={[
          { key: 'rank', label: '순위', width: '80px', render: (r) => `${r.rank}위` },
          {
            key: 'nickname',
            label: '닉네임',
            render: (r) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goMember(r.uid);
                }}
                className="font-medium text-indigo-600 hover:underline"
              >
                {r.nickname}
              </button>
            ),
          },
          { key: 'totalGp', label: '누적 GP', render: (r) => `${r.totalGp.toLocaleString()} GP` },
          { key: 'playCount', label: '참여 횟수', render: (r) => `${r.playCount}회` },
          { key: 'winRate', label: '승률', render: (r) => `${r.winRate.toFixed(1)}%` },
          { key: 'lastPlayedAt', label: '최근 참여일' },
        ]}
        rows={paged}
        emptyMessage="검색 결과가 없습니다."
        onRowClick={(r) => goMember(r.uid)}
      />

      <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

// ─────────── TOP 10 카드 — 5×2 그리드 (운영 BO 실측 디자인) ───────────
function RankingTopCard({ entry, onClick }: { entry: RankingEntry; onClick: () => void }) {
  const medalBg =
    entry.rank === 1
      ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white'
      : entry.rank === 2
      ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
      : entry.rank === 3
      ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white'
      : 'bg-gray-100 text-gray-700';

  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-indigo-300 hover:shadow-md transition"
    >
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold mb-2 ${medalBg}`}>
        {entry.rank}
      </div>
      <div className="text-base font-bold text-indigo-600 mb-1">
        {entry.totalGp.toLocaleString()} GP
      </div>
      <div className="text-sm font-medium text-gray-900 mb-1 truncate">{entry.nickname}</div>
      <div className="text-xs text-gray-500">참여 {entry.playCount}회</div>
      <div className="text-xs text-gray-500">승률 {entry.winRate.toFixed(1)}%</div>
    </button>
  );
}
