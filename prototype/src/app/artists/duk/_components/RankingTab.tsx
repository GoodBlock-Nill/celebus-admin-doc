'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import {
  dukActiveGroups,
  dukSeasons,
  getDukRankingBySeason,
  type DukRankingRow,
  type DukSeason,
  type DukSeasonStatus,
} from '@/mock/duk';

// [CEB-BO-ART-401-RANKING] 덕력 랭킹
// 그룹 + 연도 + 시즌 선택 → 해당 시즌(1개월)에 획득한 덕력 누적 순위
// 시즌 = 1개월이므로 연도 선택 후 그 연도의 시즌(월)을 골라 랭킹 조회 ([CEB-000] §1.4 정합)

const PAGE_SIZE = 20;

function rankBadge(rank: number) {
  if (rank === 1) return 'bg-amber-100 text-amber-800';
  if (rank === 2) return 'bg-slate-200 text-slate-700';
  if (rank === 3) return 'bg-orange-100 text-orange-800';
  return 'bg-gray-100 text-gray-600';
}

const STATUS_BADGE: Record<DukSeasonStatus, string> = {
  예정: 'bg-gray-100 text-gray-600',
  진행중: 'bg-emerald-100 text-emerald-700',
  종료: 'bg-gray-800 text-white',
};

// 시즌 startAt "YYYY.MM.DD HH:mm" → { year, month }
function seasonYearMonth(s: DukSeason): { year: number; month: number } {
  const m = s.startAt.match(/^(\d{4})\.(\d{2})/);
  return { year: m ? Number(m[1]) : 0, month: m ? Number(m[2]) : 0 };
}

function seasonsOfGroup(groupId: number): DukSeason[] {
  return dukSeasons
    .filter((s) => s.artistGroupId === groupId)
    .sort((a, b) => (a.startAt < b.startAt ? 1 : -1)); // 최신 시즌 먼저
}

// 그룹의 활동 연도 (시즌 보유 연도, 최신순)
function activeYearsOf(groupId: number): number[] {
  return [...new Set(seasonsOfGroup(groupId).map((s) => seasonYearMonth(s).year))].sort((a, b) => b - a);
}

// 그룹 + 연도의 시즌 목록 (최신 월 먼저)
function seasonsOfGroupYear(groupId: number, year: number): DukSeason[] {
  return seasonsOfGroup(groupId).filter((s) => seasonYearMonth(s).year === year);
}

// 그룹의 기본 연도 = 진행중 시즌의 연도, 없으면 최신 연도
function defaultYearOf(groupId: number): number {
  const active = seasonsOfGroup(groupId).find((s) => s.status === '진행중');
  if (active) return seasonYearMonth(active).year;
  return activeYearsOf(groupId)[0] ?? new Date().getFullYear();
}

// 그룹 + 연도의 기본 시즌 = 진행중 우선, 없으면 그 연도 최신 시즌
function defaultSeasonOfYear(groupId: number, year: number): DukSeason | undefined {
  const list = seasonsOfGroupYear(groupId, year);
  return list.find((s) => s.status === '진행중') ?? list[0];
}

export default function RankingTab() {
  const initialGroup = dukActiveGroups[0].id;
  const initialYear = defaultYearOf(initialGroup);
  const [groupId, setGroupId] = useState<number>(initialGroup);
  const [year, setYear] = useState<number>(initialYear);
  const [seasonId, setSeasonId] = useState<number | undefined>(() => defaultSeasonOfYear(initialGroup, initialYear)?.id);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const activeYears = useMemo(() => activeYearsOf(groupId), [groupId]);
  const seasonsInYear = useMemo(() => seasonsOfGroupYear(groupId, year), [groupId, year]);
  const season = seasonsInYear.find((s) => s.id === seasonId);

  const handleGroupChange = (v: number) => {
    setGroupId(v);
    const y = defaultYearOf(v);
    setYear(y);
    setSeasonId(defaultSeasonOfYear(v, y)?.id);
    setPage(1);
  };

  const handleYearChange = (y: number) => {
    setYear(y);
    setSeasonId(defaultSeasonOfYear(groupId, y)?.id);
    setPage(1);
  };

  // 선택 시즌(1개월)의 획득 덕력 랭킹 — 시즌 id 단위 집계
  const ranking = useMemo<DukRankingRow[]>(() => {
    if (!season) return [];
    return getDukRankingBySeason(season.id);
  }, [season]);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return ranking;
    return ranking.filter((r) => r.memberNickname.includes(keyword.trim()));
  }, [ranking, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const groupName = dukActiveGroups.find((g) => g.id === groupId)?.name ?? '';
  const memberCount = ranking.length;
  const totalSum = ranking.reduce((s, r) => s + r.totalAmount, 0);

  return (
    <div>
      {/* 안내 문구 */}
      <p className="text-sm text-gray-500 mb-4">
        회원의 그룹별 덕력 순위를 시즌 단위로 조회합니다. 연도를 선택한 뒤 해당 연도의 시즌(1개월)을 고르면, 그 시즌에 획득한 덕력 누적 기준 순위가 표시됩니다.
      </p>

      {/* 필터 바 — 그룹 + 연도 + 시즌 선택 + 회원 검색 */}
      <div className="flex items-end gap-3 mb-4">
        <div className="min-w-[170px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">그룹</label>
          <select
            value={groupId}
            onChange={(e) => handleGroupChange(Number(e.target.value))}
            className="h-10 w-full px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {dukActiveGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[110px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">연도</label>
          <select
            value={year}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="h-10 w-full px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {activeYears.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[210px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">시즌</label>
          <select
            value={seasonId ?? ''}
            onChange={(e) => {
              setSeasonId(e.target.value === '' ? undefined : Number(e.target.value));
              setPage(1);
            }}
            className="h-10 w-full px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {seasonsInYear.length === 0 && <option value="">시즌 없음</option>}
            {seasonsInYear.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name.ko} ({s.status})
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[220px] ml-auto">
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

      {/* 컨텍스트 카드 — 선택 시즌·상태·활동 회원·누적 */}
      <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-sm">
        <span className="font-semibold text-gray-900">{groupName}</span>
        {season ? (
          <>
            <span className="text-gray-700">{season.name.ko}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[season.status]}`}>
              {season.status}
            </span>
          </>
        ) : (
          <span className="text-gray-500">시즌 없음</span>
        )}
        <span className="text-gray-500">— 활동 회원 {memberCount.toLocaleString()}명 · 획득 누적 {totalSum.toLocaleString()} DUK</span>
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
          {
            key: 'memberNickname',
            label: '회원',
            render: (r: DukRankingRow) => (
              <Link
                href={`/members/${r.memberId}?tab=basic`}
                target="_blank"
                rel="noreferrer"
                className="text-gray-700 hover:text-indigo-600 hover:underline"
              >
                {r.memberNickname}
              </Link>
            ),
          },
          {
            key: 'totalAmount',
            label: '획득 덕력',
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
        emptyMessage="해당 시즌에 획득 내역이 있는 회원이 없습니다."
      />

      {filtered.length > 0 && <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />}
    </div>
  );
}
