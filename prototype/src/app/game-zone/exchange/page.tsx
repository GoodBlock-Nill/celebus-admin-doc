'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import DataTable from '@/components/ui/DataTable';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import ExchangeDetailModal from '@/components/modals/ExchangeDetailModal';
import { mockExchanges } from '@/mock/exchanges';
import { mockGPStats, mockOperationWallets } from '@/mock/settings';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { formatDateTime, formatGP, formatCELB, formatNumber, truncateHash } from '@/lib/utils';
import type { Exchange } from '@/lib/types';

export default function ExchangePage() {
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Exchange | null>(null);
  const [period, setPeriod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  function getDateRange(p: string, sd: string, ed: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (p) {
      case 'today': return { start: todayStart, end: now };
      case '7days': return { start: new Date(todayStart.getTime() - 6 * 86400000), end: now };
      case '30days': return { start: new Date(todayStart.getTime() - 29 * 86400000), end: now };
      case 'custom':
        return {
          start: sd ? new Date(sd) : new Date(0),
          end: ed ? new Date(ed + 'T23:59:59') : now,
        };
      default: return { start: new Date(0), end: now };
    }
  }

  const { start, end } = getDateRange(period, startDate, endDate);

  const filtered = mockExchanges.filter(e => {
    const dt = new Date(e.datetime);
    if (dt < start || dt > end) return false;
    if (direction && e.direction !== direction) return false;
    if (search && !e.nickname.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayExchanges = mockExchanges.filter(e => new Date(e.datetime) >= todayStart);
  const todayCharge = todayExchanges.filter(e => e.direction === 'CHARGE' && e.status === 'SUCCESS').reduce((s, e) => s + e.gpAmount, 0);
  const todayWithdraw = todayExchanges.filter(e => e.direction === 'WITHDRAW' && e.status === 'SUCCESS').reduce((s, e) => s + e.gpAmount, 0);

  const chargeWallet = mockOperationWallets.find(w => w.type === 'CHARGE' && w.isPrimary)
    || mockOperationWallets.find(w => w.type === 'CHARGE');
  const withdrawWallet = mockOperationWallets.find(w => w.type === 'WITHDRAW' && w.isPrimary)
    || mockOperationWallets.find(w => w.type === 'WITHDRAW');

  return (
    <div>
      <PageHeader
        title="GP 교환소"
        breadcrumbItems={[{ label: '게임존', href: '/game-zone' }, { label: 'GP 교환소' }]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/game-zone/exchange/wallets" className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              지갑 관리
            </Link>
            <Link href="/game-zone/exchange/settings" className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              교환 설정
            </Link>
          </div>
        }
      />

      {/* 운영 현황 대시보드 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">운영 현황</h3>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">
              충전 지갑 잔액
              {chargeWallet?.isPrimary && (
                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-600">대표</span>
              )}
            </p>
            <p className="text-xl font-bold text-blue-600">{formatCELB(chargeWallet?.balance || 0)}</p>
            <p className="text-xs text-gray-400 mt-1">{truncateHash(chargeWallet?.address || '-', 8, 6)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">
              출금 지갑 잔액
              {withdrawWallet?.isPrimary && (
                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-600">대표</span>
              )}
            </p>
            <p className="text-xl font-bold text-orange-600">{formatCELB(withdrawWallet?.balance || 0)}</p>
            <p className="text-xs text-gray-400 mt-1">{truncateHash(withdrawWallet?.address || '-', 8, 6)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">전체 유저 보유 GP</p>
            <p className="text-xl font-bold text-gray-900">{formatGP(mockGPStats.totalActiveUserGP)}</p>
            <p className="text-xs text-gray-400 mt-1">탈퇴유저 제외</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">탈퇴 유저 GP</p>
            <p className="text-xl font-bold text-gray-400">{formatGP(mockGPStats.totalInactiveUserGP)}</p>
            <p className="text-xs text-gray-400 mt-1">미환수 GP</p>
          </div>
        </div>
      </div>

      {/* 오늘 교환 현황 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard label="오늘 GP 충전" value={formatGP(todayCharge)} variant="gp" />
        <StatsCard label="오늘 GP 출금" value={formatGP(todayWithdraw)} variant="gp" />
        <StatsCard label="오늘 교환 건수" value={`${todayExchanges.length}건`} />
      </div>

      <div className="mb-4">
        <FilterBar
          filters={[
            { key: 'period', label: '조회기간', type: 'select', value: period, options: [
              { value: 'today', label: '오늘' },
              { value: '7days', label: '최근 7일' },
              { value: '30days', label: '최근 30일' },
              { value: 'custom', label: '커스텀' },
            ]},
            ...(period === 'custom' ? [
              { key: 'startDate', label: '시작일', type: 'date' as const, value: startDate },
              { key: 'endDate', label: '종료일', type: 'date' as const, value: endDate },
            ] : []),
            { key: 'direction', label: '교환 방향', type: 'select' as const, value: direction, options: [{ value: 'CHARGE', label: 'GP 충전' }, { value: 'WITHDRAW', label: 'GP 출금' }] },
            { key: 'search', label: '검색', type: 'search' as const, value: search, placeholder: '닉네임 검색' },
          ]}
          onFilterChange={(k, v) => {
            if (k === 'period') { setPeriod(v); if (v !== 'custom') { setStartDate(''); setEndDate(''); } }
            else if (k === 'startDate') setStartDate(v);
            else if (k === 'endDate') setEndDate(v);
            else if (k === 'direction') setDirection(v);
            else setSearch(v);
            setPage(1);
          }}
          onReset={() => { setPeriod(''); setStartDate(''); setEndDate(''); setDirection(''); setSearch(''); setPage(1); }}
        />
      </div>
      <DataTable<Exchange & Record<string, unknown>>
        columns={[
          { key: 'datetime', label: '일시', width: '160px', render: (item: Exchange) => formatDateTime(item.datetime) },
          { key: 'nickname', label: '닉네임', render: (item: Exchange) => <span className="text-blue-600">{item.nickname.toLowerCase()}</span> },
          { key: 'txid', label: 'Txid', width: '160px', render: (item: Exchange) => <span className="font-mono text-xs">{truncateHash(item.txid)}</span> },
          { key: 'direction', label: '교환 방향', align: 'center', width: '120px', render: (item: Exchange) => <Badge variant="exchangeDir" value={item.direction} /> },
          { key: 'gpAmount', label: 'GP 수량', align: 'right', width: '120px', render: (item: Exchange) => formatGP(item.gpAmount) },
          { key: 'celbAmount', label: 'CELB 수량', align: 'right', width: '120px', render: (item: Exchange) => formatCELB(item.celbAmount) },
          { key: 'rate', label: '비율', align: 'right', width: '80px', render: () => '1:1' },
          { key: 'status', label: '상태', align: 'center', width: '100px', render: (item: Exchange) => <Badge variant="exchangeStatus" value={item.status} /> },
        ]}
        data={paginated as (Exchange & Record<string, unknown>)[]}
        onRowClick={(item) => setSelected(item as unknown as Exchange)}
        rowNumber={{ page, perPage: ITEMS_PER_PAGE }}
      />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      <ExchangeDetailModal isOpen={!!selected} onClose={() => setSelected(null)} exchange={selected} />
    </div>
  );
}
