'use client';

import { useMemo } from 'react';

import { EmptyState, PageSkeleton } from '../_components/feedback';
import { MUTED } from '../_components/ui';
import { useOrderExpiry } from '../_components/use-app-clock';
import { OrderCard } from './order-card';
import { useTicketStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';

/** A5 주문 내역 목록 */
export default function OrdersPage() {
  const isHydrated = useHydrated();
  useOrderExpiry();

  const orders = useTicketStore((state) => state.orders);
  const concerts = useTicketStore((state) => state.concerts);
  const sessions = useTicketStore((state) => state.sessions);
  const currentUserId = useTicketStore((state) => state.currentUserId);

  const myOrders = useMemo(
    () =>
      orders
        .filter((order) => order.userId === currentUserId)
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders, currentUserId],
  );

  return (
    <main>
      <header className="px-4 pb-3 pt-6">
        <h1 className="text-[20px] font-extrabold">주문 내역</h1>
        <p className={`mt-1 text-[12.5px] ${MUTED}`}>
          입금 확인이 끝나면 티켓이 자동으로 지급됩니다.
        </p>
      </header>

      <section className="px-4 pb-6">
        {!isHydrated ? (
          <PageSkeleton rows={2} />
        ) : myOrders.length === 0 ? (
          <EmptyState
            title="주문 내역이 없습니다"
            description="예매를 신청하면 이곳에서 입금 안내와 진행 상태를 확인할 수 있습니다."
            actionLabel="공연 보러가기"
            actionHref="/app"
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {myOrders.map((order) => (
              <li key={order.id}>
                <OrderCard
                  order={order}
                  concert={concerts.find((item) => item.id === order.concertId)}
                  session={sessions.find((item) => item.id === order.sessionId)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
