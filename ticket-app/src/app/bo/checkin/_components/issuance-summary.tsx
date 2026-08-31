'use client';

import { useMemo } from 'react';
import { useTicketStore } from '@/lib/store';
import { poolLabel } from '@/lib/store-ticket';
import type { PoolType, Ticket } from '@/lib/types';
import { DataTable } from '../../_components/data-table';
import type { Column } from '../../_components/data-table';
import { POOL_TYPES } from '../../_components/pools';
import { Card } from '../../_components/ui';

interface SummaryRow {
  key: string;
  label: string;
  issued: number;
  used: number;
  waiting: number;
  revoked: number;
  isTotal: boolean;
}

function countBy(tickets: Ticket[], poolType: PoolType): SummaryRow {
  const own = tickets.filter((ticket) => ticket.poolType === poolType);
  return {
    key: poolType,
    label: poolLabel(poolType),
    issued: own.length,
    used: own.filter((ticket) => ticket.status === 'USED').length,
    waiting: own.filter((ticket) => ticket.status === 'VALID').length,
    revoked: own.filter((ticket) => ticket.status === 'REVOKED').length,
    isTotal: false,
  };
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

/** 회차별·분류별 발급/사용 집계 */
export function IssuanceSummary() {
  const sessions = useTicketStore((state) => state.sessions);
  const tickets = useTicketStore((state) => state.tickets);

  const bySession = useMemo(
    () =>
      sessions.map((session) => {
        const own = tickets.filter((ticket) => ticket.sessionId === session.id);
        const rows = POOL_TYPES.map((poolType) => countBy(own, poolType));
        const total = rows.reduce<SummaryRow>(
          (acc, row) => ({
            ...acc,
            issued: acc.issued + row.issued,
            used: acc.used + row.used,
            waiting: acc.waiting + row.waiting,
            revoked: acc.revoked + row.revoked,
          }),
          { key: 'total', label: '합계', issued: 0, used: 0, waiting: 0, revoked: 0, isTotal: true },
        );
        return { session, rows: [...rows, total] };
      }),
    [sessions, tickets],
  );

  return (
    <div className="flex flex-col gap-4">
      {bySession.map(({ session, rows }) => (
        <Card key={session.id} title={`${session.name} 발급 현황`}>
          <DataTable columns={COLUMNS} rows={rows} rowKey={(row) => row.key} minWidth="420px" />
        </Card>
      ))}
    </div>
  );
}
