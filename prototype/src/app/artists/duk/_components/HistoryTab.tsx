'use client';

import { useMemo, useState } from 'react';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { dukActiveGroups, dukLedger, dukSeasons, type DukLedger, type DukLedgerType } from '@/mock/duk';

// [CEB-BO-ART-401] v1.1 §2-3 탭 3 — 덕력내역
// 상하 2섹션 분리: 위 = 획득 내역 / 아래 = 사용 내역
// 각 섹션은 독립 필터·요약·페이지네이션 (LedgerSection 공통 컴포넌트)

const PAGE_SIZE = 20;

function defaultStartDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
function defaultEndDate() {
  return new Date().toISOString().slice(0, 10);
}
function dotDate(iso: string) {
  return iso.replaceAll('-', '.');
}

interface LedgerSectionProps {
  type: DukLedgerType;
  title: string;
}

function LedgerSection({ type, title }: LedgerSectionProps) {
  const [groupId, setGroupId] = useState<number | 'all'>('all');
  const [startDate, setStartDate] = useState<string>(defaultStartDate());
  const [endDate, setEndDate] = useState<string>(defaultEndDate());
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const reset = () => {
    setGroupId('all');
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
        if (l.type !== type) return false;
        if (groupId !== 'all' && l.artistGroupId !== groupId) return false;
        if (l.occurredAt < startDot || l.occurredAt > endDot) return false;
        if (keyword.trim() && !l.memberNickname.includes(keyword.trim())) return false;
        return true;
      })
      .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
  }, [type, groupId, startDate, endDate, keyword]);

  const total = filtered.reduce((sum, l) => sum + l.amount, 0);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isEarn = type === '획득';
  const amountColor = isEarn ? 'text-emerald-600' : 'text-rose-600';
  const sign = isEarn ? '+' : '-';

  return (
    <section className="bg-white border border-gray-100 rounded-xl px-5 py-5">
      <h2 className="text-base font-semibold text-gray-900 mb-4">{title}</h2>

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
        <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500">필터 결과</p>
          <p className="text-xl font-semibold text-gray-900">{filtered.length.toLocaleString()} 건</p>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500">{isEarn ? '획득 합계' : '사용 합계'}</p>
          <p className={`text-xl font-semibold ${amountColor}`}>
            {sign}
            {total.toLocaleString()} DUK
          </p>
        </div>
      </div>

      <SimpleTable
        columns={[
          { key: 'occurredAt', label: '일시' },
          { key: 'memberNickname', label: '회원' },
          { key: 'artistGroupName', label: '그룹' },
          { key: 'source', label: '출처' },
          {
            key: 'amount',
            label: '변동',
            align: 'right',
            render: (r: DukLedger) => (
              <span className={`font-semibold ${amountColor}`}>
                {sign}
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
    </section>
  );
}

export default function HistoryTab() {
  return (
    <div className="space-y-6">
      <LedgerSection type="획득" title="획득 내역" />
      <LedgerSection type="사용" title="사용 내역" />
    </div>
  );
}
