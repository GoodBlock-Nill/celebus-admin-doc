'use client';

import { useCallback } from 'react';

import { Badge } from '../_components/badge';
import { TicketIcon } from '../_components/icons';
import { TICKET_STATUS_META } from '../_components/status-meta';
import { CARD, MUTED, NUMERIC } from '../_components/ui';
import { useApiResource } from '../_components/use-api-resource';
import { api } from '@/lib/api-client';
import { poolLabel, type TicketSummaryView } from '@/lib/api-types';

/** 예매 없이 지급된 티켓만 남긴다 — 주문이 연결된 티켓은 예매 카드에서 진행 상태로 확인한다. */
function isGrantedTicket(ticket: TicketSummaryView): boolean {
  return ticket.orderId === null;
}

/** 지급받은 티켓 한 줄 — 예매 카드와 구분되는 컴팩트 행 */
function GrantedTicketRow({ ticket }: { ticket: TicketSummaryView }) {
  const statusMeta = TICKET_STATUS_META[ticket.status];

  return (
    <div className={`${CARD} flex items-center gap-3 px-3.5 py-3`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FDF2F7] text-[#D6336C]">
        <TicketIcon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold text-[#A61E4D]">
          {poolLabel(ticket.poolType)}
        </p>
        <p className="mt-0.5 truncate text-[14.5px] font-bold text-[#191F28]">
          {ticket.concertTitle}
        </p>
        <p className={`mt-0.5 truncate text-[12.5px] ${MUTED} ${NUMERIC}`}>{ticket.sessionName}</p>
      </div>

      <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
    </div>
  );
}

/**
 * 예매내역 하단 "지급받은 티켓" 섹션.
 * 래플 당첨·소속사 초대·운영 지급처럼 예매 없이 받은 티켓의 유일한 회원 확인 창구다.
 * 해당 티켓이 없으면(로딩·조회 실패 포함) 섹션 자체를 노출하지 않아 예매 목록 흐름을 방해하지 않는다.
 */
export function GrantedTicketSection() {
  const loadTickets = useCallback(() => api.tickets(), []);
  const { state } = useApiResource(loadTickets);

  if (state.status !== 'READY') return null;

  const grantedTickets = state.data.tickets.filter(isGrantedTicket);
  if (grantedTickets.length === 0) return null;

  return (
    <section className="px-4 pb-2 pt-5">
      <h2 className="px-1 text-[16px] font-bold text-[#191F28]">지급받은 티켓</h2>
      <p className={`mt-1 px-1 text-[13px] leading-relaxed ${MUTED}`}>
        예매 없이 지급받은 티켓입니다.
      </p>

      <ul className="mt-3 flex flex-col gap-2">
        {grantedTickets.map((ticket) => (
          <li key={ticket.id}>
            <GrantedTicketRow ticket={ticket} />
          </li>
        ))}
      </ul>

      <p className={`mt-2.5 px-1 text-[12.5px] leading-relaxed ${MUTED}`}>
        입장에 사용할 티켓은 공연 당일 CELEBUS 앱에서 확인할 수 있습니다.
      </p>
    </section>
  );
}
