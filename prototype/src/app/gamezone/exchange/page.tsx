'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { Cog6ToothIcon, WalletIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import ExchangeDetailModal from '@/components/gamezone/ExchangeDetailModal';
import {
  exchanges,
  exchangeOverview,
  operationWallets,
  truncateAddress,
  type ExchangeDirection,
  type ExchangeEntry,
  type OperationWallet,
} from '@/mock/gamezone';

const PAGE_SIZE = 20;

// [CEB-BO-GZ-501] v1.5 정합 — 운영 지갑 현황 + 통계 5종 + 필터 3종 +
// 테이블 8컬럼 + 행 클릭 모달 + 헤더 [지갑 관리][교환 설정]
export default function ExchangePage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'전체' | ExchangeDirection>('전체');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ExchangeEntry | null>(null);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return exchanges.filter((e) => {
      if (directionFilter !== '전체' && e.direction !== directionFilter) return false;
      if (q) {
        const nick = e.nickname?.toLowerCase() ?? '';
        if (!nick.includes(q)) return false;
      }
      return true;
    });
  }, [keyword, directionFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="GP 교환소" breadcrumbItems={[{ label: '게임존' }, { label: 'GP 교환소' }]} />
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/gamezone/exchange/wallets')}
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <WalletIcon className="w-4 h-4" />
            지갑 관리
          </button>
          <button
            onClick={() => router.push('/gamezone/exchange/settings')}
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Cog6ToothIcon className="w-4 h-4" />
            교환 설정
          </button>
        </div>
      </div>

      {/* 운영 지갑 현황 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">운영 지갑 현황</h3>
        <div className="grid grid-cols-2 gap-3">
          {operationWallets.map((w) => (
            <WalletCard key={w.type} wallet={w} />
          ))}
        </div>
      </div>

      {/* 통계 카드 5종 */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <StatCard label="오늘 GP 충전" value={`${exchangeOverview.todayCharge.toLocaleString()} GP`} accent="indigo" />
        <StatCard label="오늘 GP 출금" value={`${exchangeOverview.todayWithdraw.toLocaleString()} GP`} accent="rose" />
        <StatCard label="오늘 교환 건수(건)" value={`${exchangeOverview.todayCount}`} accent="amber" />
        <StatCard label="전체 유저 보유 GP" value={`${exchangeOverview.totalActiveUserGp.toLocaleString()} GP`} accent="emerald" />
        <StatCard label="탈퇴 유저 GP" value={`${exchangeOverview.withdrawnUserGp.toLocaleString()} GP`} accent="gray" />
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-2 mb-4">
        <select
          value={directionFilter}
          onChange={(e) => {
            setDirectionFilter(e.target.value as typeof directionFilter);
            setPage(1);
          }}
          className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="전체">교환 방향 전체</option>
          <option value="GP 충전">GP 충전</option>
          <option value="GP 출금">GP 출금</option>
        </select>
        <div className="relative">
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
      </div>

      {/* 테이블 */}
      <SimpleTable<ExchangeEntry>
        columns={[
          { key: 'occurredAt', label: '일시' },
          {
            key: 'nickname',
            label: '닉네임',
            render: (e) =>
              e.nickname && e.uid ? (
                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    router.push(`/members/${e.uid}?tab=basic`);
                  }}
                  className="font-medium text-indigo-600 hover:underline"
                >
                  {e.nickname}
                </button>
              ) : (
                <span className="text-gray-400">-</span>
              ),
          },
          { key: 'txid', label: 'Txid', render: (e) => <span className="font-mono text-xs text-gray-500">{truncateAddress(e.txid, 8, 4)}</span> },
          {
            key: 'direction',
            label: '교환 방향',
            render: (e) => (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  e.direction === 'GP 충전' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {e.direction}
              </span>
            ),
          },
          { key: 'gpAmount', label: 'GP 수량', render: (e) => `${e.gpAmount} GP` },
          { key: 'celbAmount', label: 'CELB 수량', render: (e) => `${e.celbAmount} CELB` },
          { key: 'ratioText', label: '비율', render: (e) => <span className="text-xs text-gray-600">{e.ratioText}</span> },
          {
            key: 'status',
            label: '상태',
            render: (e) => (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                  e.status === '성공'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {e.status}
              </span>
            ),
          },
        ]}
        rows={paged}
        emptyMessage="교환 내역이 없습니다."
        onRowClick={(e) => setSelected(e)}
      />

      <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />

      <ExchangeDetailModal isOpen={!!selected} onClose={() => setSelected(null)} entry={selected} />
    </div>
  );
}

function WalletCard({ wallet }: { wallet: OperationWallet }) {
  const typeBadge =
    wallet.type === 'CHARGE'
      ? { label: '충전 지갑', bg: 'bg-indigo-50', text: 'text-indigo-700' }
      : { label: '출금 지갑', bg: 'bg-gray-100', text: 'text-gray-700' };
  const lowGas = wallet.bnbBalance < 0.01;

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${typeBadge.bg} ${typeBadge.text}`}>
          {typeBadge.label}
        </span>
        {wallet.isPrimary && (
          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
            대표
          </span>
        )}
      </div>
      <div className="text-lg font-bold text-indigo-700 tabular-nums">
        {wallet.celbBalance.toLocaleString(undefined, { maximumFractionDigits: 8 })} CELB
      </div>
      <div className={`text-xs tabular-nums mt-0.5 ${lowGas ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
        {lowGas && <ExclamationTriangleIcon className="inline w-3.5 h-3.5 mr-1" />}
        {wallet.bnbBalance.toFixed(8)} BNB
      </div>
      <div className="text-xs text-gray-400 font-mono mt-1.5">{truncateAddress(wallet.address, 10, 6)}</div>
      <div className="text-xs text-gray-500 mt-1">상태: {wallet.status}</div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: 'indigo' | 'rose' | 'amber' | 'emerald' | 'gray' }) {
  const accentColor = {
    indigo: 'text-indigo-700',
    rose: 'text-rose-700',
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
    gray: 'text-gray-700',
  }[accent];
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-bold ${accentColor}`}>{value}</div>
    </div>
  );
}
