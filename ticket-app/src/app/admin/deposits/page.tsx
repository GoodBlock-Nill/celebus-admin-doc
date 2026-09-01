'use client';

import { useCallback, useMemo } from 'react';

import { DataTable } from '../_components/data-table';
import type { Column } from '../_components/data-table';
import { useAdminResource } from '../_components/hooks';
import { Card, Collapsible, PageHeader } from '../_components/ui';
import { OrderSearchSection } from './_components/archive/order-search';
import { UnknownDepositsSection } from './_components/archive/unknown-deposits';
import {
  amountColumn,
  depositedAtColumn,
  depositorColumn,
  memoColumn,
  orderColumn,
  statusColumn,
} from './_components/deposit-columns';
import { IssueDaySection } from './_components/issue-day/section';
import { WorklistSection } from './_components/worklist/section';
import { adminApi } from '@/lib/admin-client';
import type { AdminDepositView } from '@/lib/admin-types';

const HISTORY_COLUMNS: Array<Column<AdminDepositView>> = [
  depositorColumn,
  amountColumn,
  depositedAtColumn,
  statusColumn,
  orderColumn,
  memoColumn,
];

/**
 * 주문·입금 확인 — 주문 중심 작업함 (재설계서 §5).
 * ① 할 일(주문 단일 큐) · ② 공연 당일 지급 · ③ 조회·기타 세 구획으로 구성한다.
 */
export default function AdminDepositsPage() {
  const loadDeposits = useCallback(() => adminApi.deposits(), []);
  const { state, reload } = useAdminResource(loadDeposits);

  const deposits = state.status === 'READY' ? state.data.deposits : [];
  // 등록 취소한 입금도 처리 이력에 남겨 어떤 건을 왜 무효로 돌렸는지 확인할 수 있게 한다.
  const history = useMemo(
    () =>
      deposits.filter(
        (row) => row.status === 'CONFIRMED' || row.status === 'REFUNDED' || row.status === 'VOIDED',
      ),
    [deposits],
  );

  const refresh = () => void reload();

  return (
    <>
      <PageHeader
        title="주문·입금 확인"
        description="처리할 예매를 한 줄로 모은 작업함입니다. ① 할 일에서 예매 단위로 처리하고, ② 공연 당일 지급에서 회차 단위로 티켓을 지급하며, ③ 조회·기타에서 지난 예매와 주문 미상 입금을 확인합니다."
      />

      {state.status !== 'READY' ? (
        <Card>
          <p className="text-[13px] text-[#6B7080]">
            {state.status === 'LOADING' ? '작업함을 불러오는 중입니다…' : state.reason}
          </p>
        </Card>
      ) : (
        <>
          <WorklistSection
            items={state.data.worklist}
            allDeposits={state.data.deposits}
            candidates={state.data.matchable}
            onRefresh={refresh}
          />

          <IssueDaySection
            sessions={state.data.issueSessions}
            recentIssued={state.data.recentIssued}
            onRefresh={refresh}
          />

          <h2 className="mt-2 text-[15px] font-bold text-[#1B1D22]">③ 조회·기타</h2>

          <OrderSearchSection />

          <UnknownDepositsSection
            deposits={state.data.deposits}
            candidates={state.data.matchable}
            onRefresh={refresh}
          />

          <Collapsible summary={`처리 완료 이력 (${history.length}건)`}>
            <DataTable
              columns={HISTORY_COLUMNS}
              rows={history}
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
