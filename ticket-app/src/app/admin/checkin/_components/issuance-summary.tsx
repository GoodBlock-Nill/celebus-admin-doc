'use client';

import { DataTable } from '../../_components/data-table';
import type { Column } from '../../_components/data-table';
import { Card } from '../../_components/ui';
import type { IssuanceSessionView } from '@/lib/admin-types';
import { poolLabel } from '@/lib/api-types';

interface SummaryRow {
  key: string;
  label: string;
  issued: number;
  used: number;
  waiting: number;
  revoked: number;
  isTotal: boolean;
}

const COLUMNS: Array<Column<SummaryRow>> = [
  {
    key: 'label',
    header: '분류',
    render: (row) => <span className={row.isTotal ? 'font-bold' : 'font-semibold'}>{row.label}</span>,
  },
  { key: 'issued', header: '발급', numeric: true, render: (row) => row.issued.toLocaleString('ko-KR') },
  {
    key: 'used',
    header: '입장 완료',
    numeric: true,
    render: (row) => <span className="font-semibold text-[#188A5B]">{row.used.toLocaleString('ko-KR')}</span>,
  },
  { key: 'waiting', header: '입장 전', numeric: true, render: (row) => row.waiting.toLocaleString('ko-KR') },
  {
    key: 'revoked',
    header: '회수',
    numeric: true,
    render: (row) => (
      <span className={row.revoked > 0 ? 'text-[#C2402A]' : ''}>{row.revoked.toLocaleString('ko-KR')}</span>
    ),
  },
];

function toRows(session: IssuanceSessionView): SummaryRow[] {
  const base: SummaryRow[] = session.rows.map((row) => ({
    key: row.poolType,
    label: poolLabel(row.poolType),
    issued: row.issued,
    used: row.used,
    waiting: row.waiting,
    revoked: row.revoked,
    isTotal: false,
  }));

  const total = base.reduce<SummaryRow>(
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
}

/** 회차별·분류별 발급/사용 집계 */
export function IssuanceSummary({ items }: { items: IssuanceSessionView[] }) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((session) => (
        <Card key={session.sessionId} title={`${session.sessionName} 발급 현황`}>
          <DataTable columns={COLUMNS} rows={toRows(session)} rowKey={(row) => row.key} minWidth="420px" />
        </Card>
      ))}
    </div>
  );
}
