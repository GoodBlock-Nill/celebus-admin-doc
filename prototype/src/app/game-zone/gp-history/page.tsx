'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import DataTable from '@/components/ui/DataTable';
import FilterBar from '@/components/ui/FilterBar';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import GPDisplay from '@/components/ui/GPDisplay';
import GPChangeDetailModal from '@/components/modals/GPChangeDetailModal';
import { mockGPChanges } from '@/mock/gp-changes';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { formatDateTime, formatNumber } from '@/lib/utils';
import type { GPChange } from '@/lib/types';

export default function GPHistoryPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<GPChange | null>(null);
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

  const filtered = mockGPChanges.filter(c => {
    const dt = new Date(c.datetime);
    if (dt < start || dt > end) return false;
    if (type && c.type !== type) return false;
    if (search && !c.nickname.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div>
      <PageHeader title="GP 변동 내역" breadcrumbItems={[{ label: '게임존', href: '/game-zone' }, { label: 'GP 변동 내역' }]} />
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
            { key: 'type', label: '변동 유형', type: 'select' as const, value: type, options: [
              { value: 'PARTICIPATION', label: '참여' }, { value: 'BOOSTING', label: '부스팅' },
              { value: 'REFUND', label: '환급' }, { value: 'REWARD', label: '보상' },
              { value: 'EXCHANGE_IN', label: 'GP 가져오기' }, { value: 'EXCHANGE_OUT', label: 'CELB으로 보내기' },
              { value: 'REFUND_CANCEL', label: '환불' },
            ]},
            { key: 'search', label: '검색', type: 'search' as const, value: search, placeholder: '닉네임 검색' },
          ]}
          onFilterChange={(k, v) => {
            if (k === 'period') { setPeriod(v); if (v !== 'custom') { setStartDate(''); setEndDate(''); } }
            else if (k === 'startDate') setStartDate(v);
            else if (k === 'endDate') setEndDate(v);
            else if (k === 'type') setType(v);
            else setSearch(v);
            setPage(1);
          }}
          onReset={() => { setPeriod(''); setStartDate(''); setEndDate(''); setType(''); setSearch(''); setPage(1); }}
        />
      </div>
      <DataTable<GPChange & Record<string, unknown>>
        columns={[
          { key: 'datetime', label: '일시', width: '160px', render: (item: GPChange) => formatDateTime(item.datetime) },
          { key: 'nickname', label: '닉네임', render: (item: GPChange) => <span className="text-blue-600">{item.nickname.toLowerCase()}</span> },
          { key: 'type', label: '유형', align: 'center', width: '140px', render: (item: GPChange) => <Badge variant="gpType" value={item.type} /> },
          {
            key: 'relatedGameType',
            label: '게임유형',
            align: 'center' as const,
            width: '100px',
            render: (item: GPChange) => item.relatedGameType ? (
              <Badge variant="gameType" value={item.relatedGameType} />
            ) : <span className="text-gray-400">-</span>,
          },
          { key: 'amount', label: 'GP 변동', align: 'right', width: '130px', render: (item: GPChange) => <GPDisplay amount={item.amount} showSign /> },
          { key: 'balanceAfter', label: '변동 후 잔액', align: 'right', width: '130px', render: (item: GPChange) => `${formatNumber(item.balanceAfter)} GP` },
          { key: 'notes', label: '비고', width: '200px' },
        ]}
        data={paginated as (GPChange & Record<string, unknown>)[]}
        onRowClick={(item) => setSelected(item as unknown as GPChange)}
      />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      <GPChangeDetailModal isOpen={!!selected} onClose={() => setSelected(null)} change={selected} />
    </div>
  );
}
