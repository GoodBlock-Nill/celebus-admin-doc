import Link from 'next/link';

import { Badge } from '../_components/badge';
import { ChevronRightIcon, TicketIcon } from '../_components/icons';
import { TicketPerforation } from '../_components/perforation';
import { TICKET_STATUS_META } from '../_components/status-meta';
import { CARD, MUTED, NUMERIC } from '../_components/ui';
import { poolLabel, type TicketSummaryView } from '@/lib/api-types';
import { formatDateTime } from '@/lib/format';

/** 내 티켓 목록 카드 — 실물 티켓 절취선 장식 */
export function TicketCard({ ticket }: { ticket: TicketSummaryView }) {
  const statusMeta = TICKET_STATUS_META[ticket.status];

  return (
    <Link href={`/app/tickets/${ticket.id}`} className={`${CARD} block px-4 pb-3 pt-4`}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FDF2F7] text-[#D6336C]">
          <TicketIcon className="h-6 w-6" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
            <span className={`truncate text-[12.5px] ${MUTED}`}>{poolLabel(ticket.poolType)}</span>
          </div>
          <p className="mt-1.5 truncate text-[16px] font-bold text-[#191F28]">{ticket.concertTitle}</p>
        </div>

        <ChevronRightIcon className="h-5 w-5 shrink-0 text-[#B0B8C1]" />
      </div>

      {/* 카드 좌우 끝까지 닿아야 노치가 절취 자국으로 보이므로 좌우 여백을 상쇄한다. */}
      <TicketPerforation className="-mx-4 mt-3" />

      <p className={`truncate pt-2.5 text-[13px] ${MUTED} ${NUMERIC}`}>
        {ticket.sessionStartAt
          ? `${ticket.sessionName} · ${formatDateTime(ticket.sessionStartAt)}`
          : ticket.sessionName}
      </p>
    </Link>
  );
}
