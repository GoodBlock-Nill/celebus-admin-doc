'use client';

import { useMemo, useState } from 'react';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { dukActiveGroups, dukLedger, dukSeasons, type DukLedger, type DukLedgerType } from '@/mock/duk';

// [CEB-BO-ART-401] §2-3 탭 3 — 덕력내역
// 그룹·유형·기간·회원 필터 + ledger 테이블 (RFT 변동 내역 패턴 정합)

const PAGE_SIZE = 20;

function defaultStartDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
function defaultEndDate() {
  return new Date().toISOString().slice(0, 10);
}
// "YYYY-MM-DD" → "YYYY.MM.DD"
function dotDate(iso: string) {
  return iso.replaceAll('-', '.');
}

export default function HistoryTab() {
  const [groupId, setGroupId] = useState<number | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<DukLedgerType | 'all'>('all');
  const [startDate, setStartDate] = useState<string>(defaultStartDate());
  const [endDate, setEndDate] = useState<string>(defaultEndDate());
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const reset = () => {
    setGroupId('all');
    setTypeFilter('all');
    setStartDate(defaultStartDate());
    setEndDate(defaultEndDate());
    setKeyword('');
    setPage(1);
  };

  const filtered = useMemo<DukLedger[]>(() => {
    const startDot = dotDate(startDate);
    const endDot = dotDate(endDate) + ' 23:59';
    return [...dukLedger]
      .filter((l) => {
        if (groupId !== 'all' && l.artistGroupId !== groupId) return false;
        if (typeFilter !== 'all' && l.type !== typeFilter) return false;
        if (l.occurredAt < startDot || l.occurredAt > endDot) return false;
        if (keyword.trim() && !l.memberNickname.includes(keyword.trim())) return false;
        return true;
      })
      .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
  }, [groupId, typeFilter, startDate, endDate, keyword]);

  const totalEarn = filtered.filter((l) => l.type === '획득').reduce((sum, l) => sum + l.amount, 0);
  const totalSpend = filtered.filter((l) => l.type === '사용').reduce((sum, l) => sum + l.amount, 0);
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
            onChange={(e) => {
              const v = e.target.value;
              setGroupId(v === 'all' ? 'all' : Number(v));
              setPage(1);
            }}
            className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">전체</option>
            {dukActiveGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">유형</label>
          <div role="radiogroup" className="inline-flex bg-white border border-gray-200 rounded-lg p-0.5">
            {([
              { v: 'all', label: '전체', active: 'bg-gray-900 text-white' },
              { v: '획득', label: '획득', active: 'bg-emerald-100 text-emerald-700' },
              { v: '사용', label: '사용', active: 'bg-rose-100 text-rose-700' },
            ] as const).map((opt) => (
              <button
                key={opt.v}
                role="radio"
                aria-checked={typeFilter === opt.v}
                onClick={() => {
                  setTypeFilter(opt.v as DukLedgerType | 'all');
                  setPage(1);
                }}
                className={`h-9 px-3 text-xs font-medium rounded-md ${
                  typeFilter === opt.v ? opt.active : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">기간 시작</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">기간 종료</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
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
        <button
          onClick={reset}
          className="h-10 px-4 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          초기화
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-white border border-gray-100 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500">필터 결과</p>
          <p className="text-xl font-semibold text-gray-900">{filtered.length.toLocaleString()} 건</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500">합계</p>
          <p className="text-sm">
            {(typeFilter === 'all' || typeFilter === '획득') && (
              <span className="font-semibold text-emerald-600 mr-3">+{totalEarn.toLocaleString()} DUK</span>
            )}
            {(typeFilter === 'all' || typeFilter === '사용') && (
              <span className="font-semibold text-rose-600">-{totalSpend.toLocaleString()} DUK</span>
            )}
          </p>
        </div>
      </div>

      <SimpleTable
        columns={[
          { key: 'occurredAt', label: '일시' },
          { key: 'memberNickname', label: '회원' },
          { key: 'artistGroupName', label: '그룹' },
          {
            key: 'type',
            label: '유형',
            render: (r: DukLedger) => (
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  r.type === '획득' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {r.type}
              </span>
            ),
          },
          { key: 'source', label: '출처' },
          {
            key: 'amount',
            label: '변동',
            align: 'right',
            render: (r: DukLedger) => (
              <span
                className={`font-semibold ${
                  r.type === '획득' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {r.type === '획득' ? '+' : '-'}
                {r.amount.toLocaleString()} DUK
              </span>
            ),
          },
          {
            key: 'balanceAfter',
            label: '잔액',
            align: 'right',
            render: (r: DukLedger) => `${r.balanceAfter.toLocaleString()} DUK`,
          },
          {
            key: 'seasonId',
            label: '시즌',
            render: (r: DukLedger) => {
              const s = dukSeasons.find((x) => x.id === r.seasonId);
              return s ? s.name : '—';
            },
          },
        ]}
        rows={slice}
        emptyMessage="조건에 일치하는 내역이 없습니다."
      />

      {filtered.length > 0 && <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />}
    </div>
  );
}
