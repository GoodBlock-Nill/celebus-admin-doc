'use client';

import { useMemo, useState } from 'react';
import { useTicketStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';
import { DataTable } from '../_components/data-table';
import type { Column } from '../_components/data-table';
import { Tabs } from '../_components/tabs';
import { Card, Collapsible, PageHeader } from '../_components/ui';
import {
  amountColumn,
  depositedAtColumn,
  depositorColumn,
  memoColumn,
  orderColumn,
  statusColumn,
} from './_components/deposit-columns';
import { buildDepositRows, buildIssuePendingRows } from './_components/deposit-rows';
import type { DepositRow } from './_components/deposit-rows';
import { HeldTab } from './_components/held-tab';
import { IssuePendingTab } from './_components/issue-pending-tab';
import { MockDepositPanel } from './_components/mock-deposit-panel';
import { PendingTab } from './_components/pending-tab';
import { RefundTargetTab } from './_components/refund-target-tab';

type TabKey = 'pending' | 'issue' | 'held' | 'refund';

const HISTORY_COLUMNS: Array<Column<DepositRow>> = [
  depositorColumn,
  amountColumn,
  depositedAtColumn,
  statusColumn,
  orderColumn,
  memoColumn,
];

export default function DepositsPage() {
  const hydrated = useHydrated();
  const deposits = useTicketStore((state) => state.deposits);
  const orders = useTicketStore((state) => state.orders);
  const sessions = useTicketStore((state) => state.sessions);
  const verifications = useTicketStore((state) => state.verifications);
  const users = useTicketStore((state) => state.users);
  const [activeTab, setActiveTab] = useState<TabKey>('pending');

  const rows = useMemo(
    () => buildDepositRows(deposits, orders, verifications, users),
    [deposits, orders, verifications, users],
  );

  const issuePendingRows = useMemo(
    () => buildIssuePendingRows(orders, sessions, verifications, users),
    [orders, sessions, verifications, users],
  );

  const grouped = useMemo(
    () => ({
      pending: rows.filter((row) => row.deposit.status === 'AUTO_MATCHED'),
      held: rows.filter((row) => row.deposit.status === 'HELD' || row.deposit.status === 'UNMATCHED'),
      refund: rows.filter((row) => row.deposit.status === 'REFUND_TARGET'),
      done: rows.filter(
        (row) => row.deposit.status === 'CONFIRMED' || row.deposit.status === 'REFUNDED',
      ),
    }),
    [rows],
  );

  return (
    <>
      <PageHeader
        title="주문·입금 확인"
        description="무통장입금 건을 자동 대조 결과별로 확인하고, 입금 확인 → 티켓 지급 두 단계로 나눠 처리합니다."
      />

      {!hydrated ? (
        <Card>
          <p className="text-[13px] text-[#6B7080]">입금 내역을 불러오는 중입니다…</p>
        </Card>
      ) : (
        <>
          <MockDepositPanel />

          <Card>
            <Tabs
              items={[
                { key: 'pending', label: '① 확인 대기', count: grouped.pending.length },
                { key: 'issue', label: '② 지급 대기', count: issuePendingRows.length },
                { key: 'held', label: '③ 보류', count: grouped.held.length },
                { key: 'refund', label: '④ 환불 대상', count: grouped.refund.length },
              ]}
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as TabKey)}
            />
            <div className="pt-4">
              {activeTab === 'pending' ? <PendingTab rows={grouped.pending} /> : null}
              {activeTab === 'issue' ? <IssuePendingTab rows={issuePendingRows} /> : null}
              {activeTab === 'held' ? <HeldTab rows={grouped.held} /> : null}
              {activeTab === 'refund' ? <RefundTargetTab rows={grouped.refund} /> : null}
            </div>
          </Card>

          <Collapsible summary={`처리 완료 이력 (${grouped.done.length}건)`}>
            <DataTable
              columns={HISTORY_COLUMNS}
              rows={grouped.done}
              rowKey={(row) => row.deposit.id}
              emptyText="처리 완료된 입금이 없습니다."
              minWidth="900px"
            />
          </Collapsible>
        </>
      )}
    </>
  );
}
