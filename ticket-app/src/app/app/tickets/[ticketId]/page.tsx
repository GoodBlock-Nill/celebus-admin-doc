'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback } from 'react';

import { AppHeader } from '../../_components/app-header';
import { Badge } from '../../_components/badge';
import { ErrorState, PageSkeleton } from '../../_components/feedback';
import { InfoRow } from '../../_components/section';
import { TICKET_STATUS_META } from '../../_components/status-meta';
import { GHOST_BUTTON, MUTED } from '../../_components/ui';
import { useApiResource } from '../../_components/use-api-resource';
import { TicketEntryNotice } from '../ticket-entry-notice';
import { api } from '@/lib/api-client';
import { poolLabel } from '@/lib/api-types';
import { formatDateTime } from '@/lib/format';

const TICKET_NOTICE =
  '본 티켓은 양도할 수 없습니다. 공연 당일 입장 확인은 CELEBUS 앱의 티켓 화면에서 진행됩니다.';

/** A6 티켓 상세 — 절취선 티켓 카드 + 지급 상태·입장 안내 */
export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = typeof params.ticketId === 'string' ? params.ticketId : '';

  const loadTicket = useCallback(() => api.ticket(ticketId), [ticketId]);
  const { state, reload } = useApiResource(loadTicket);

  if (state.status === 'LOADING') {
    return (
      <main>
        <AppHeader title="티켓 상세" backHref="/app/tickets" />
        <PageSkeleton rows={2} />
      </main>
    );
  }

  if (state.status === 'ERROR') {
    return (
      <main>
        <AppHeader title="티켓 상세" backHref="/app/tickets" />
        <div className="flex flex-col gap-4 px-4 py-5">
          <ErrorState message={state.reason} onRetry={() => void reload()} />
          <Link href="/app/tickets" className={GHOST_BUTTON}>
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const ticket = state.data.ticket;
  const statusMeta = TICKET_STATUS_META[ticket.status];

  return (
    <main>
      <AppHeader
        title="티켓 상세"
        backHref="/app/tickets"
        right={<Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>}
      />

      <div className="flex flex-col gap-4 px-4 py-5">
        <article className="overflow-hidden rounded-3xl border border-[#2A2C34] bg-[#191A20]">
          <div className="bg-linear-to-br from-[#F0426E] via-[#8B4BD6] to-[#191A20] px-5 pb-5 pt-5">
            <p className="text-[11px] font-bold tracking-[0.2em] text-white/85">{ticket.artist}</p>
            <h2 className="mt-1.5 text-[18px] font-extrabold leading-snug text-white">
              {ticket.concertTitle}
            </h2>
          </div>

          <div className="px-5 py-1">
            <InfoRow label="회차" value={ticket.sessionName} />
            <InfoRow label="일시" value={formatDateTime(ticket.sessionStartAt)} />
            <InfoRow label="장소" value={ticket.venue} />
            <InfoRow label="좌석" value={ticket.seatType} />
            <InfoRow label="수령 경로" value={poolLabel(ticket.poolType)} />
          </div>

          <div className="relative">
            <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#0F1014]" />
            <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#0F1014]" />
            <div className="mx-5 border-t border-dashed border-[#3A3C46]" />
          </div>

          <TicketEntryNotice ticket={ticket} />
        </article>

        <p className={`px-1 text-[11.5px] leading-relaxed ${MUTED}`}>{TICKET_NOTICE}</p>
      </div>
    </main>
  );
}
