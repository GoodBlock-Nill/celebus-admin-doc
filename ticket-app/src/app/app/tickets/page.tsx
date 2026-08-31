'use client';

import { useMemo } from 'react';

import { DemoTip, EmptyState, PageSkeleton } from '../_components/feedback';
import { MUTED } from '../_components/ui';
import { useOrderExpiry } from '../_components/use-app-clock';
import { TicketCard } from './ticket-card';
import { useTicketStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';

/** A6 내 티켓 목록 */
export default function TicketsPage() {
  const isHydrated = useHydrated();
  useOrderExpiry();

  const tickets = useTicketStore((state) => state.tickets);
  const concerts = useTicketStore((state) => state.concerts);
  const sessions = useTicketStore((state) => state.sessions);
  const currentUserId = useTicketStore((state) => state.currentUserId);

  const myTickets = useMemo(
    () =>
      tickets
        .filter((ticket) => ticket.userId === currentUserId)
        .slice()
        .sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime()),
    [tickets, currentUserId],
  );

  return (
    <main>
      <header className="px-4 pb-3 pt-6">
        <h1 className="text-[20px] font-extrabold">내 티켓</h1>
        <p className={`mt-1 text-[12.5px] ${MUTED}`}>
          입장 코드는 공연 시작 60분 전부터 활성화됩니다.
        </p>
      </header>

      <section className="flex flex-col gap-3 px-4 pb-6">
        {!isHydrated ? (
          <PageSkeleton rows={2} />
        ) : myTickets.length === 0 ? (
          <EmptyState
            title="보유한 티켓이 없습니다"
            description="입금이 확인되면 티켓이 자동으로 지급됩니다."
            actionLabel="주문 내역 보기"
            actionHref="/app/orders"
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {myTickets.map((ticket) => (
              <li key={ticket.id}>
                <TicketCard
                  ticket={ticket}
                  concert={concerts.find((item) => item.id === ticket.concertId)}
                  session={sessions.find((item) => item.id === ticket.sessionId)}
                />
              </li>
            ))}
          </ul>
        )}

        <DemoTip>데모: 허브의 시간 이동으로 공연 임박 상태를 재현할 수 있습니다.</DemoTip>
      </section>
    </main>
  );
}
