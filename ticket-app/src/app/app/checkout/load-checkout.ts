'use client';

import { api, type ApiResult } from '@/lib/api-client';
import type { ConcertView, SessionView } from '@/lib/api-types';
import { countHeldQty } from '@/lib/held-qty';

const NOT_FOUND_STATUS = 404;

export interface CheckoutData {
  concert: ConcertView;
  session: SessionView;
  /** 이미 보유 중인 매수 (1인 한도 표시용) */
  heldQty: number;
}

/** 예매 신청 화면에 필요한 회차·공연·보유 매수를 한 번에 모은다. */
export async function loadCheckout(sessionId: string): Promise<ApiResult<CheckoutData>> {
  const concerts = await api.concerts();
  if (!concerts.ok) return concerts;

  const matched = concerts.data.items.find((item) =>
    item.sessions.some((session) => session.id === sessionId),
  );
  const session = matched?.sessions.find((item) => item.id === sessionId);
  if (!matched || !session) {
    return { ok: false, reason: '회차 정보를 찾을 수 없습니다.', status: NOT_FOUND_STATUS };
  }

  const [orders, tickets] = await Promise.all([api.orders(), api.tickets()]);
  if (!orders.ok) return orders;
  if (!tickets.ok) return tickets;

  return {
    ok: true,
    data: {
      concert: matched.concert,
      session,
      heldQty: countHeldQty(orders.data.orders, tickets.data.tickets, matched.concert.id),
    },
  };
}
