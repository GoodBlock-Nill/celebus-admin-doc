'use client';

import { useCallback } from 'react';

import { AppHeader } from '../_components/app-header';
import { EmptyState, ErrorState, PageSkeleton } from '../_components/feedback';
import { useApiResource } from '../_components/use-api-resource';
import { GrantedTicketSection } from './granted-tickets';
import { OrderCard } from './order-card';
import { api } from '@/lib/api-client';

/** A5 예매 내역 목록 */
export default function OrdersPage() {
  const loadOrders = useCallback(() => api.orders(), []);
  const { state, reload } = useApiResource(loadOrders);

  return (
    <main>
      <AppHeader
        title="예매 내역"
        description="입금이 확인되면 예매가 확정되고, 티켓은 공연 당일 CELEBUS 앱으로 지급됩니다."
      />

      <section className="px-4 pb-2">
        {state.status === 'LOADING' ? (
          <PageSkeleton rows={2} />
        ) : state.status === 'ERROR' ? (
          <ErrorState message={state.reason} onRetry={() => void reload()} />
        ) : state.data.orders.length === 0 ? (
          <EmptyState
            title="예매 내역이 없습니다"
            description="예매를 신청하면 이곳에서 입금 안내와 진행 상태를 확인할 수 있습니다."
            actionLabel="공연 보러가기"
            actionHref="/app"
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {state.data.orders.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <GrantedTicketSection />
    </main>
  );
}
