'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { dukActiveGroups, dukLedger, dukSeasons, type DukLedger, type DukLedgerType } from '@/mock/duk';

// [CEB-BO-ART-401] v1.7 §2-3 탭 3 — 덕력내역
// 내부 sub-tab 2개: [획득 내역] / [사용 내역]
// 두 LedgerSection 모두 마운트 유지 + display 토글로 state 보존
// v1.7 — 회원 닉네임 Link + 기간 시작>종료 인라인 검증

const PAGE_SIZE = 20;

function defaultStartDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}
function defaultEndDate() {
  return new Date().toISOString().slice(0, 10);
}
function dotDate(iso: string) {
  return iso.replaceAll('-', '.');
}

interface LedgerSectionProps {
  type: DukLedgerType;
}

function LedgerSection({ type }: LedgerSectionProps) {
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
  // v1.7 — 기간 검증
  const periodInvalid = !!startDate && !!endDate && startDate > endDate;

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

      {/* v1.7 — 기간 검증 인라인 에러 */}
      {periodInvalid && (
        <p className="mb-3 text-xs text-rose-600">
          기간 시작은 종료보다 이전이어야 합니다.
        </p>
      )}

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
          {
            key: 'memberNickname',
            label: '회원',
            render: (r: DukLedger) => (
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
    </div>
  );
}

const SUB_TABS: { key: DukLedgerType; label: string }[] = [
  { key: '획득', label: '획득 내역' },
  { key: '사용', label: '사용 내역' },
];

export default function HistoryTab() {
  // sub-tab은 페이지 내부 state로만 관리 (URL 쿼리 미반영 — 단순화)
  // 두 LedgerSection 모두 마운트 유지 + display 토글로 직전 state 보존
  const [subTab, setSubTab] = useState<DukLedgerType>('획득');

  return (
    <div>
      {/* sub-tab 메뉴 */}
      <div className="border-b border-gray-200 mb-5">
        <nav className="-mb-px flex gap-1">
          {SUB_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                subTab === t.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className={subTab === '획득' ? '' : 'hidden'}>
        <LedgerSection type="획득" />
      </div>
      <div className={subTab === '사용' ? '' : 'hidden'}>
        <LedgerSection type="사용" />
      </div>
    </div>
  );
}
