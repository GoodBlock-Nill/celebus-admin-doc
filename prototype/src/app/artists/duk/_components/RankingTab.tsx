'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import {
  dukActiveGroups,
  getActiveYears,
  getDukRankingByPeriod,
  type DukRankingRow,
} from '@/mock/duk';

// [CEB-BO-ART-401] v1.7 §2-2 탭 2 — 덕력랭킹
// 그룹 + 단위 토글(년/월) + 단위별 Dropdown + 회원 검색 → 누적 덕력 순위
// 시즌과 무관하게 ledger 발생 일시(occurredAt) 기준으로 년/월 집계
// v1.7 — 컨텍스트 카드(선택 기간·활동 회원·누적) + 회원 닉네임 Link

const PAGE_SIZE = 20;
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

function rankBadge(rank: number) {
  if (rank === 1) return 'bg-amber-100 text-amber-800';
  if (rank === 2) return 'bg-slate-200 text-slate-700';
  if (rank === 3) return 'bg-orange-100 text-orange-800';
  return 'bg-gray-100 text-gray-600';
}

export default function RankingTab() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [groupId, setGroupId] = useState<number>(dukActiveGroups[0].id);
  const [unit, setUnit] = useState<'year' | 'month'>('year');
  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(currentMonth);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  // 선택 그룹의 활동 연도 (ledger 기반)
  const activeYears = useMemo(() => {
    const years = getActiveYears(groupId);
    return years.length > 0 ? years : [currentYear];
  }, [groupId, currentYear]);

  // 그룹 변경 시 기간 기본값 정합
  const handleGroupChange = (v: number) => {
    setGroupId(v);
    const years = getActiveYears(v);
    if (years.length > 0 && !years.includes(year)) {
      setYear(years[years.length - 1]); // 최신 활동 연도
    }
    setPage(1);
  };

  const ranking = useMemo<DukRankingRow[]>(
    () => getDukRankingByPeriod(groupId, unit === 'year' ? { unit, year } : { unit, year, month }),
    [groupId, unit, year, month],
  );

  const filtered = useMemo(() => {
    if (!keyword.trim()) return ranking;
    return ranking.filter((r) => r.memberNickname.includes(keyword.trim()));
  }, [ranking, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // v1.7 — 컨텍스트 카드 데이터
  const periodLabel = unit === 'year' ? `${year}년` : `${year}년 ${month}월`;
  const groupName = dukActiveGroups.find((g) => g.id === groupId)?.name ?? '';
  const memberCount = ranking.length;
  const totalSum = ranking.reduce((s, r) => s + r.totalAmount, 0);

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
          <label className="block text-xs font-medium text-gray-600 mb-1">단위</label>
          <div role="radiogroup" className="inline-flex bg-white border border-gray-200 rounded-lg p-0.5">
            {([
              { v: 'year', label: '년 단위' },
              { v: 'month', label: '월 단위' },
            ] as const).map((opt) => (
              <button
                key={opt.v}
                role="radio"
                aria-checked={unit === opt.v}
                onClick={() => {
                  setUnit(opt.v);
                  setPage(1);
                }}
                className={`h-9 px-3 text-xs font-medium rounded-md ${
                  unit === opt.v ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {unit === 'year' ? (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">년</label>
            <select
              value={year}
              onChange={(e) => {
                setYear(Number(e.target.value));
                setPage(1);
              }}
              className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {activeYears.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">년-월</label>
            <div className="inline-flex gap-2">
              <select
                value={year}
                onChange={(e) => {
                  setYear(Number(e.target.value));
                  setPage(1);
                }}
                className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {activeYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                value={String(month).padStart(2, '0')}
                onChange={(e) => {
                  setMonth(Number(e.target.value));
                  setPage(1);
                }}
                className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {MONTHS.map((mm) => (
                  <option key={mm} value={mm}>
                    {Number(mm)}월
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

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

      {/* v1.7 — 컨텍스트 카드 */}
      <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-indigo-50/60 border border-indigo-100 rounded-lg text-sm">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-600 text-white">
          {periodLabel}
        </span>
        <span className="font-semibold text-gray-900">{groupName}</span>
        <span className="text-gray-500">— 활동 회원 {memberCount.toLocaleString()}명 · 누적 {totalSum.toLocaleString()} DUK</span>
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
