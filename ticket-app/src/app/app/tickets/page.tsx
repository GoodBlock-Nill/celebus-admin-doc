'use client';

import { useCallback } from 'react';

import { EmptyState, ErrorState, PageSkeleton } from '../_components/feedback';
import { MUTED } from '../_components/ui';
import { useApiResource } from '../_components/use-api-resource';
import { TicketCard } from './ticket-card';
import { api } from '@/lib/api-client';

/** A6 내 티켓 목록 */
export default function TicketsPage() {
  const loadTickets = useCallback(() => api.tickets(), []);
  const { state, reload } = useApiResource(loadTickets);

  return (
    <main>
      <header className="px-4 pb-3 pt-6">
        <h1 className="text-[20px] font-extrabold">내 티켓</h1>
        <p className={`mt-1 text-[12.5px] ${MUTED}`}>
          입장 코드는 공연 시작 60분 전부터 활성화됩니다.
        </p>
      </header>

      <section className="flex flex-col gap-3 px-4 pb-6">
        {state.status === 'LOADING' ? (
          <PageSkeleton rows={2} />
        ) : state.status === 'ERROR' ? (
          <ErrorState message={state.reason} onRetry={() => void reload()} />
        ) : state.data.tickets.length === 0 ? (
          <EmptyState
            title="보유한 티켓이 없습니다"
            description="입금 확인 후 티켓 지급 처리가 끝나면 이곳에 티켓이 표시됩니다."
            actionLabel="주문 내역 보기"
            actionHref="/app/orders"
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {state.data.tickets.map((ticket) => (
              <li key={ticket.id}>
                <TicketCard ticket={ticket} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
