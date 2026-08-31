'use client';

import { useParams } from 'next/navigation';

import { AppHeader } from '../../_components/app-header';
import { Badge } from '../../_components/badge';
import { DemoTip, NotFoundNotice, PageSkeleton } from '../../_components/feedback';
import { InfoRow } from '../../_components/section';
import { TICKET_STATUS_META } from '../../_components/status-meta';
import { MUTED } from '../../_components/ui';
import { TicketQrPanel } from '../ticket-qr-panel';
import { formatDateTime } from '@/lib/format';
import { poolLabel } from '@/lib/store-ticket';
import { useTicketStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';

const TICKET_NOTICE = '본 티켓은 양도할 수 없으며, 캡처 화면으로는 입장할 수 없습니다.';

/** A6 티켓 상세 — 절취선 티켓 카드 + 입장 코드 */
export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = typeof params.ticketId === 'string' ? params.ticketId : '';
  const isHydrated = useHydrated();

  const tickets = useTicketStore((state) => state.tickets);
  const concerts = useTicketStore((state) => state.concerts);
  const sessions = useTicketStore((state) => state.sessions);

  const ticket = tickets.find((item) => item.id === ticketId);
  const session = sessions.find((item) => item.id === ticket?.sessionId);
  const concert = concerts.find((item) => item.id === ticket?.concertId);

  if (!isHydrated) {
    return (
      <main>
        <AppHeader title="티켓 상세" backHref="/app/tickets" />
        <PageSkeleton rows={2} />
      </main>
    );
  }

  if (!ticket || !session || !concert) {
    return (
      <main>
        <AppHeader title="티켓 상세" backHref="/app/tickets" />
        <NotFoundNotice message="티켓 정보를 찾을 수 없습니다." backHref="/app/tickets" />
      </main>
    );
  }

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
            <p className="text-[11px] font-bold tracking-[0.2em] text-white/85">{concert.artist}</p>
            <h2 className="mt-1.5 text-[18px] font-extrabold leading-snug text-white">
              {concert.title}
            </h2>
          </div>

          <div className="px-5 py-1">
            <InfoRow label="회차" value={session.name} />
            <InfoRow label="일시" value={formatDateTime(session.startAt)} />
            <InfoRow label="장소" value={concert.venue} />
            <InfoRow label="좌석" value={concert.seatType} />
            <InfoRow label="수령 경로" value={poolLabel(ticket.poolType)} />
          </div>

          <div className="relative">
            <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#0F1014]" />
            <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#0F1014]" />
            <div className="mx-5 border-t border-dashed border-[#3A3C46]" />
          </div>

          <TicketQrPanel ticket={ticket} session={session} />
        </article>

        <p className={`px-1 text-[11.5px] leading-relaxed ${MUTED}`}>{TICKET_NOTICE}</p>

        <DemoTip>데모: 허브의 시간 이동으로 공연 임박 상태를 재현할 수 있습니다.</DemoTip>
      </div>
    </main>
  );
}
