'use client';

import { useCallback } from 'react';

import { EmptyState, ErrorState, PageSkeleton } from '../_components/feedback';
import { MUTED } from '../_components/ui';
import { useApiResource } from '../_components/use-api-resource';
import { OrderCard } from './order-card';
import { api } from '@/lib/api-client';

/** A5 주문 내역 목록 */
export default function OrdersPage() {
  const loadOrders = useCallback(() => api.orders(), []);
  const { state, reload } = useApiResource(loadOrders);

  return (
    <main>
      <header className="px-4 pb-3 pt-6">
        <h1 className="text-[20px] font-extrabold">주문 내역</h1>
        <p className={`mt-1 text-[12.5px] ${MUTED}`}>
          입금 확인 후 지급 대기로 바뀌고, 티켓 지급이 끝나면 내 티켓에서 확인할 수 있습니다.
        </p>
      </header>

      <section className="px-4 pb-6">
        {state.status === 'LOADING' ? (
          <PageSkeleton rows={2} />
        ) : state.status === 'ERROR' ? (
          <ErrorState message={state.reason} onRetry={() => void reload()} />
        ) : state.data.orders.length === 0 ? (
          <EmptyState
            title="주문 내역이 없습니다"
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
    </main>
  );
}
