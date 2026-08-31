'use client';

import Link from 'next/link';
import { useCallback } from 'react';

import { DataTable } from '../_components/data-table';
import type { Column } from '../_components/data-table';
import { useAdminResource } from '../_components/hooks';
import { CONCERT_STATUS_VIEW } from '../_components/labels';
import { Card, PageHeader, StatusBadge } from '../_components/ui';
import { adminApi } from '@/lib/admin-client';
import type { AdminConcertRowView } from '@/lib/admin-types';
import { formatDateTime, formatKrw } from '@/lib/format';

const COLUMNS: Array<Column<AdminConcertRowView>> = [
  {
    key: 'title',
    header: '공연',
    render: (row) => (
      <Link href={`/admin/concerts/${row.id}`} className="font-semibold text-[#3056D3] hover:underline">
        {row.title}
      </Link>
    ),
  },
  { key: 'artist', header: '아티스트', render: (row) => row.artist },
  {
    key: 'period',
    header: '판매 기간',
    render: (row) => (
      <span className="whitespace-nowrap tabular-nums text-[12px] text-[#4A4E5A]">
        {formatDateTime(row.salesStartAt)} ~ {formatDateTime(row.salesEndAt)}
      </span>
    ),
  },
  { key: 'price', header: '가격', numeric: true, render: (row) => formatKrw(row.priceKrw) },
  {
    key: 'status',
    header: '상태',
    render: (row) => <StatusBadge view={CONCERT_STATUS_VIEW[row.status]} />,
  },
  {
    key: 'sales',
    header: '판매 현황 (발급/전체)',
    numeric: true,
    render: (row) => (
      <span>
        {row.issued.toLocaleString('ko-KR')} / {row.allocated.toLocaleString('ko-KR')}
        <span className="ml-1 text-[11px] text-[#6B7080]">선점 {row.reserved}</span>
      </span>
    ),
  },
  { key: 'sessions', header: '회차', numeric: true, render: (row) => `${row.sessionCount}회차` },
];

export default function AdminConcertListPage() {
  const loadConcerts = useCallback(() => adminApi.concerts(), []);
  const { state } = useAdminResource(loadConcerts);

  return (
    <>
      <PageHeader
        title="공연·재고 관리"
        description="공연별 회차 재고를 4개 분류(유상 판매·당첨자·초대·운영 보류)로 나누어 관리합니다."
        actions={
          <Link
            href="/admin/concerts/new"
            className="rounded-lg border border-[#3056D3] bg-[#3056D3] px-4 py-2 text-[13px] font-semibold text-white hover:border-[#2545A8] hover:bg-[#2545A8]"
          >
            공연 등록
          </Link>
        }
      />
      <Card>
        {state.status === 'READY' ? (
          <DataTable
            columns={COLUMNS}
            rows={state.data.items}
            rowKey={(row) => row.id}
            emptyText="등록된 공연이 없습니다."
            minWidth="880px"
          />
        ) : (
          <p className="text-[13px] text-[#6B7080]">
            {state.status === 'LOADING' ? '공연 정보를 불러오는 중입니다…' : state.reason}
          </p>
        )}
      </Card>
    </>
  );
}
