'use client';

import { useCallback, useMemo, useState } from 'react';

import { AppHeader } from '../_components/app-header';
import { EmptyState, ErrorState, PageSkeleton } from '../_components/feedback';
import { orderTabOf, type OrderTabKey } from '../_components/status-meta';
import { useApiResource } from '../_components/use-api-resource';
import { OrderCard } from './order-card';
import { OrderTabs } from './order-tabs';
import { api } from '@/lib/api-client';
import type { OrderSummaryView } from '@/lib/api-types';

const TAB_LABEL: Record<OrderTabKey, string> = {
  ONGOING: '진행중',
  DONE: '완료',
  CANCELED: '취소',
};

const EMPTY_TITLE: Record<OrderTabKey, string> = {
  ONGOING: '진행 중인 예매가 없습니다',
  DONE: '티켓 지급이 완료된 예매가 없습니다',
  CANCELED: '취소·만료된 예매가 없습니다',
};

const TAB_ORDER: OrderTabKey[] = ['ONGOING', 'DONE', 'CANCELED'];

function groupByTab(orders: OrderSummaryView[]): Record<OrderTabKey, OrderSummaryView[]> {
  const grouped: Record<OrderTabKey, OrderSummaryView[]> = { ONGOING: [], DONE: [], CANCELED: [] };
  orders.forEach((order) => grouped[orderTabOf(order.status)].push(order));
  return grouped;
}

/** A5 예매 내역 목록 — 진행중 / 완료 / 취소 세 갈래로 나눠 본다. */
export default function OrdersPage() {
  const loadOrders = useCallback(() => api.orders(), []);
  const { state, reload } = useApiResource(loadOrders);
  const [activeTab, setActiveTab] = useState<OrderTabKey>('ONGOING');

  const orders = state.status === 'READY' ? state.data.orders : [];
  const grouped = useMemo(() => groupByTab(orders), [orders]);
  const visible = grouped[activeTab];

  return (
    <main>
      <AppHeader
        title="예매 내역"
        description="입금이 확인되면 예매가 확정되고, 티켓은 공연 당일 CELEBUS 앱으로 지급됩니다."
      />

      <section className="flex flex-col gap-3 px-4 pb-2">
        {state.status === 'LOADING' ? (
          <PageSkeleton rows={2} />
        ) : state.status === 'ERROR' ? (
          <ErrorState message={state.reason} onRetry={() => void reload()} />
        ) : (
          <>
            <OrderTabs
              items={TAB_ORDER.map((key) => ({
                key,
                label: TAB_LABEL[key],
                count: grouped[key].length,
              }))}
              activeKey={activeTab}
              onChange={setActiveTab}
            />

            {visible.length === 0 ? (
              <EmptyState
                title={EMPTY_TITLE[activeTab]}
                description={
                  activeTab === 'ONGOING'
                    ? '예매를 신청하면 이곳에서 입금 안내와 진행 상태를 확인할 수 있습니다.'
                    : undefined
                }
                actionLabel={activeTab === 'ONGOING' ? '공연 보러가기' : undefined}
                actionHref={activeTab === 'ONGOING' ? '/app' : undefined}
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {visible.map((order) => (
                  <li key={order.id}>
                    <OrderCard order={order} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </main>
  );
}
