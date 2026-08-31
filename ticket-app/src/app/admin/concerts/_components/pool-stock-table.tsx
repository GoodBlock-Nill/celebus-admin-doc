'use client';

import { useMemo } from 'react';

import { DataTable } from '../../_components/data-table';
import type { Column } from '../../_components/data-table';
import type { AdminSessionView, PoolStockView } from '@/lib/admin-types';
import { poolLabel } from '@/lib/api-types';

interface PoolRow {
  key: string;
  label: string;
  stock: Omit<PoolStockView, 'poolType'>;
  isTotal: boolean;
}

function remaining(stock: PoolRow['stock']): number {
  return stock.allocated - stock.reserved - stock.issued;
}

function numberCell(value: number, isTotal: boolean) {
  return <span className={isTotal ? 'font-bold' : ''}>{value.toLocaleString('ko-KR')}</span>;
}

/** 회차 1건의 4분류 재고 표 (배정·선점·발급·잔여) */
export function PoolStockTable({ session }: { session: AdminSessionView }) {
  const rows = useMemo<PoolRow[]>(() => {
    const base: PoolRow[] = session.pools.map((pool) => ({
      key: pool.poolType,
      label: poolLabel(pool.poolType),
      stock: { allocated: pool.allocated, reserved: pool.reserved, issued: pool.issued },
      isTotal: false,
    }));

    const total = base.reduce(
      (acc, row) => ({
        allocated: acc.allocated + row.stock.allocated,
        reserved: acc.reserved + row.stock.reserved,
        issued: acc.issued + row.stock.issued,
      }),
      { allocated: 0, reserved: 0, issued: 0 },
    );

    return [...base, { key: 'total', label: '합계', stock: total, isTotal: true }];
  }, [session]);

  const columns: Array<Column<PoolRow>> = [
    {
      key: 'label',
      header: '분류',
      render: (row) => <span className={row.isTotal ? 'font-bold' : 'font-semibold'}>{row.label}</span>,
    },
    { key: 'allocated', header: '배정', numeric: true, render: (row) => numberCell(row.stock.allocated, row.isTotal) },
    { key: 'reserved', header: '선점', numeric: true, render: (row) => numberCell(row.stock.reserved, row.isTotal) },
    { key: 'issued', header: '발급', numeric: true, render: (row) => numberCell(row.stock.issued, row.isTotal) },
    {
      key: 'remaining',
      header: '잔여',
      numeric: true,
      render: (row) => (
        <span className={remaining(row.stock) === 0 ? 'font-bold text-[#C2402A]' : row.isTotal ? 'font-bold' : ''}>
          {remaining(row.stock).toLocaleString('ko-KR')}
        </span>
      ),
    },
  ];

  return <DataTable columns={columns} rows={rows} rowKey={(row) => row.key} minWidth="420px" />;
}
