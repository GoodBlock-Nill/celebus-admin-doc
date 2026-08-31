'use client';

import { useMemo } from 'react';

import { DataTable } from '../../_components/data-table';
import type { Column } from '../../_components/data-table';
import type { IssuanceRowView } from '@/lib/admin-types';
import { poolLabel } from '@/lib/api-types';

interface Row {
  key: string;
  label: string;
  issued: number;
  used: number;
  waiting: number;
  revoked: number;
  isTotal: boolean;
}

const COLUMNS: Array<Column<Row>> = [
  {
    key: 'label',
    header: '분류',
    render: (row) => <span className={row.isTotal ? 'font-bold' : 'font-semibold'}>{row.label}</span>,
  },
  {
    key: 'issued',
    header: '지급',
    numeric: true,
    render: (row) => <span className={row.isTotal ? 'font-bold' : ''}>{row.issued.toLocaleString('ko-KR')}</span>,
  },
  {
    key: 'used',
    header: '입장 완료 (CELEBUS 앱 체크인 기준)',
    numeric: true,
    render: (row) => <span className="font-semibold text-[#188A5B]">{row.used.toLocaleString('ko-KR')}</span>,
  },
  {
    key: 'waiting',
    header: '입장 전',
    numeric: true,
    render: (row) => <span className={row.isTotal ? 'font-bold' : ''}>{row.waiting.toLocaleString('ko-KR')}</span>,
  },
  {
    key: 'revoked',
    header: '회수',
    numeric: true,
    render: (row) => (
      <span className={row.revoked > 0 ? 'text-[#C2402A]' : ''}>{row.revoked.toLocaleString('ko-KR')}</span>
    ),
  },
];

/** 회차 1건의 분류별 티켓 지급 현황 (지급·입장 완료·입장 전·회수) */
export function IssuanceTable({ rows }: { rows: IssuanceRowView[] }) {
  const tableRows = useMemo<Row[]>(() => {
    const base: Row[] = rows.map((row) => ({
      key: row.poolType,
      label: poolLabel(row.poolType),
      issued: row.issued,
      used: row.used,
      waiting: row.waiting,
      revoked: row.revoked,
      isTotal: false,
    }));

    const total = base.reduce<Row>(
      (acc, row) => ({
        ...acc,
        issued: acc.issued + row.issued,
        used: acc.used + row.used,
        waiting: acc.waiting + row.waiting,
        revoked: acc.revoked + row.revoked,
      }),
      { key: 'total', label: '합계', issued: 0, used: 0, waiting: 0, revoked: 0, isTotal: true },
    );

    return [...base, total];
  }, [rows]);

  return <DataTable columns={COLUMNS} rows={tableRows} rowKey={(row) => row.key} minWidth="520px" />;
}
