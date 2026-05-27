'use client';

import { useMemo, useState } from 'react';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import {
  dukActiveGroups,
  dukSeasons,
  getDukRanking,
  getSeasonsByGroup,
  type DukRankingRow,
} from '@/mock/duk';

// [CEB-BO-ART-401] §2-2 탭 2 — 덕력랭킹
// 시즌·그룹 필터 + 회원 검색 → 누적 덕력 순위

const PAGE_SIZE = 20;

function rankBadge(rank: number) {
  if (rank === 1) return 'bg-amber-100 text-amber-800';
  if (rank === 2) return 'bg-slate-200 text-slate-700';
  if (rank === 3) return 'bg-orange-100 text-orange-800';
  return 'bg-gray-100 text-gray-600';
}

export default function RankingTab() {
  const [groupId, setGroupId] = useState<number>(dukActiveGroups[0].id);
  const groupSeasons = useMemo(() => getSeasonsByGroup(groupId), [groupId]);
  const defaultSeason = useMemo(() => {
    const active = groupSeasons.find((s) => s.status === '진행중');
    return active ? active.id : groupSeasons[0]?.id ?? 'all';
  }, [groupSeasons]);
  const [seasonId, setSeasonId] = useState<number | 'all'>(defaultSeason);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  // 그룹 변경 시 시즌 기본값 갱신
  const handleGroupChange = (v: number) => {
    setGroupId(v);
    const next = dukSeasons.find((s) => s.artistGroupId === v && s.status === '진행중');
    setSeasonId(next ? next.id : 'all');
    setPage(1);
  };

  const ranking = useMemo<DukRankingRow[]>(() => getDukRanking(groupId, seasonId), [groupId, seasonId]);
  const filtered = useMemo(() => {
    if (!keyword.trim()) return ranking;
    return ranking.filter((r) => r.memberNickname.includes(keyword.trim()));
  }, [ranking, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {/* 필터 바 */}
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">그룹</label>
          <select
            value={groupId}
            onChange={(e) => handleGroupChange(Number(e.target.value))}
            className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {dukActiveGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">시즌</label>
          <select
            value={seasonId}
            onChange={(e) => {
              const v = e.target.value;
              setSeasonId(v === 'all' ? 'all' : Number(v));
              setPage(1);
            }}
            className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[220px]"
          >
            <option value="all">전체 시즌 (누적)</option>
            {groupSeasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">회원 검색</label>
          <input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            placeholder="닉네임 부분 일치"
            className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <SimpleTable
        columns={[
          {
            key: 'rank',
            label: '순위',
            width: '80px',
            render: (r: DukRankingRow) => (
              <span
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${rankBadge(r.rank)}`}
              >
                {r.rank}
              </span>
            ),
          },
          { key: 'memberNickname', label: '회원' },
          {
            key: 'totalAmount',
            label: '누적 덕력',
            align: 'right',
            render: (r: DukRankingRow) => (
              <span className="font-semibold text-indigo-700">
                {r.totalAmount.toLocaleString()} DUK
              </span>
            ),
          },
          { key: 'lastChangedAt', label: '최근 변동일' },
        ]}
        rows={slice}
        emptyMessage="해당 필터 조건에 일치하는 회원이 없습니다."
      />

      {filtered.length > 0 && <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />}
    </div>
  );
}
