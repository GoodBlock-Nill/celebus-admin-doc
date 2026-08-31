import Link from 'next/link';

import { Badge } from '../_components/badge';
import { ChevronRightIcon, TicketIcon } from '../_components/icons';
import { TICKET_STATUS_META } from '../_components/status-meta';
import { CARD, MUTED, NUMERIC } from '../_components/ui';
import { poolLabel, type TicketSummaryView } from '@/lib/api-types';
import { formatDateTime } from '@/lib/format';

/** 내 티켓 목록 카드 */
export function TicketCard({ ticket }: { ticket: TicketSummaryView }) {
  const statusMeta = TICKET_STATUS_META[ticket.status];

  return (
    <Link href={`/app/tickets/${ticket.id}`} className={`${CARD} flex items-center gap-3 p-4`}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#20222A] text-[#F0426E]">
        <TicketIcon className="h-6 w-6" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
          <span className={`truncate text-[11.5px] ${MUTED}`}>{poolLabel(ticket.poolType)}</span>
        </div>
        <p className="mt-2 truncate text-[14px] font-bold">{ticket.concertTitle}</p>
        <p className={`mt-1 truncate text-[12px] ${MUTED} ${NUMERIC}`}>
          {ticket.sessionStartAt ? `${ticket.sessionName} · ${formatDateTime(ticket.sessionStartAt)}` : '-'}
        </p>
      </div>

      <ChevronRightIcon className="h-5 w-5 shrink-0 text-[#5F606B]" />
    </Link>
  );
}
