'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { formatDateTime, formatKrw } from '@/lib/format';
import { useTicketStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';
import type { Concert } from '@/lib/types';
import { DataTable } from '../_components/data-table';
import type { Column } from '../_components/data-table';
import { CONCERT_STATUS_VIEW } from '../_components/labels';
import { Card, PageHeader, StatusBadge } from '../_components/ui';

interface ConcertRow {
  concert: Concert;
  sessionCount: number;
  allocated: number;
  issued: number;
  reserved: number;
}

export default function ConcertListPage() {
  const hydrated = useHydrated();
  const concerts = useTicketStore((state) => state.concerts);
  const sessions = useTicketStore((state) => state.sessions);

  const rows = useMemo<ConcertRow[]>(
    () =>
      concerts.map((concert) => {
        const own = sessions.filter((session) => session.concertId === concert.id);
        const totals = own.reduce(
          (acc, session) => {
            Object.values(session.pools).forEach((stock) => {
              acc.allocated += stock.allocated;
              acc.issued += stock.issued;
              acc.reserved += stock.reserved;
            });
            return acc;
          },
          { allocated: 0, issued: 0, reserved: 0 },
        );
        return { concert, sessionCount: own.length, ...totals };
      }),
    [concerts, sessions],
  );

  const columns: Array<Column<ConcertRow>> = [
    {
      key: 'title',
      header: '공연',
      render: (row) => (
        <Link href={`/bo/concerts/${row.concert.id}`} className="font-semibold text-[#3056D3] hover:underline">
          {row.concert.title}
        </Link>
      ),
    },
    { key: 'artist', header: '아티스트', render: (row) => row.concert.artist },
    {
      key: 'period',
      header: '판매 기간',
      render: (row) => (
        <span className="whitespace-nowrap tabular-nums text-[12px] text-[#4A4E5A]">
          {formatDateTime(row.concert.salesStartAt)} ~ {formatDateTime(row.concert.salesEndAt)}
        </span>
      ),
    },
    { key: 'price', header: '가격', numeric: true, render: (row) => formatKrw(row.concert.priceKrw) },
    {
      key: 'status',
      header: '상태',
      render: (row) => <StatusBadge view={CONCERT_STATUS_VIEW[row.concert.status]} />,
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
    {
      key: 'sessions',
      header: '회차',
      numeric: true,
      render: (row) => `${row.sessionCount}회차`,
    },
  ];

  return (
    <>
      <PageHeader
        title="공연·재고 관리"
        description="공연별 회차 재고를 4개 분류(유상 판매·당첨자·초대·운영 보류)로 나누어 관리합니다."
      />
      <Card>
        {hydrated ? (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.concert.id}
            emptyText="등록된 공연이 없습니다."
            minWidth="880px"
          />
        ) : (
          <p className="text-[13px] text-[#6B7080]">공연 정보를 불러오는 중입니다…</p>
        )}
      </Card>
    </>
  );
}
