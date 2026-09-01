'use client';

import { useCallback, useMemo, useState } from 'react';

import { DataTable } from '../_components/data-table';
import type { Column } from '../_components/data-table';
import { useAdminResource } from '../_components/hooks';
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
import { HeldTab } from './_components/held-tab';
import { IssuePendingTab } from './_components/issue-pending-tab';
import { ManualDepositForm } from './_components/manual-deposit-form';
import { PendingTab } from './_components/pending-tab';
import { RefundTargetTab } from './_components/refund-target-tab';
import { ReportedTab } from './_components/reported-tab';
import { adminApi } from '@/lib/admin-client';
import type { AdminDepositView } from '@/lib/admin-types';

type TabKey = 'reported' | 'pending' | 'issue' | 'held' | 'refund';

const HISTORY_COLUMNS: Array<Column<AdminDepositView>> = [
  depositorColumn,
  amountColumn,
  depositedAtColumn,
  statusColumn,
  orderColumn,
  memoColumn,
];

export default function AdminDepositsPage() {
  const loadDeposits = useCallback(() => adminApi.deposits(), []);
  const { state, reload } = useAdminResource(loadDeposits);
  const [activeTab, setActiveTab] = useState<TabKey>('reported');

  const deposits = state.status === 'READY' ? state.data.deposits : [];
  const grouped = useMemo(
    () => ({
      pending: deposits.filter((row) => row.status === 'AUTO_MATCHED'),
      held: deposits.filter((row) => row.status === 'HELD' || row.status === 'UNMATCHED'),
      refund: deposits.filter((row) => row.status === 'REFUND_TARGET'),
      done: deposits.filter((row) => row.status === 'CONFIRMED' || row.status === 'REFUNDED'),
    }),
    [deposits],
  );

  const refresh = () => void reload();

  return (
    <>
      <PageHeader
        title="주문·입금 확인"
        description="회원의 입금 확인 요청과 무통장입금 건을 함께 확인하고, 입금 확인 → 티켓 지급 두 단계로 나눠 처리합니다."
      />

      {state.status !== 'READY' ? (
        <Card>
          <p className="text-[13px] text-[#6B7080]">
            {state.status === 'LOADING' ? '입금 내역을 불러오는 중입니다…' : state.reason}
          </p>
        </Card>
      ) : (
        <>
          <ManualDepositForm onDone={refresh} />

          <Card>
            <Tabs
              items={[
                { key: 'reported', label: '① 입금 확인 요청', count: state.data.reported.length },
                { key: 'pending', label: '② 확인 대기', count: grouped.pending.length },
                { key: 'issue', label: '③ 티켓 지급 대기', count: state.data.issuePending.length },
                { key: 'held', label: '④ 보류', count: grouped.held.length },
                { key: 'refund', label: '⑤ 환불 대상', count: grouped.refund.length },
              ]}
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as TabKey)}
            />
            <div className="pt-4">
              {activeTab === 'reported' ? (
                <ReportedTab rows={state.data.reported} onDone={refresh} />
              ) : null}
              {activeTab === 'pending' ? <PendingTab rows={grouped.pending} onDone={refresh} /> : null}
              {activeTab === 'issue' ? (
                <IssuePendingTab rows={state.data.issuePending} onDone={refresh} />
              ) : null}
              {activeTab === 'held' ? (
                <HeldTab rows={grouped.held} candidates={state.data.matchable} onDone={refresh} />
              ) : null}
              {activeTab === 'refund' ? <RefundTargetTab rows={grouped.refund} onDone={refresh} /> : null}
            </div>
          </Card>

          <Collapsible summary={`처리 완료 이력 (${grouped.done.length}건)`}>
            <DataTable
              columns={HISTORY_COLUMNS}
              rows={grouped.done}
              rowKey={(row) => row.id}
              emptyText="처리 완료된 입금이 없습니다."
              minWidth="900px"
            />
          </Collapsible>
        </>
      )}
    </>
  );
}
