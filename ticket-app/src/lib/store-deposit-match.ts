import {
  createId,
  findVerification,
  generateTicketCode,
  isDepositorNameMatched,
} from './store-helpers';
import type { TicketStore } from './store-types';
import type { DepositStatus, Order, Ticket } from './types';

export const HOLD_REASON_NAME_MISMATCH = '입금자명 불일치';

export interface MatchOutcome {
  status: DepositStatus;
  matchedOrderId?: string;
  holdOrderId?: string;
  memo?: string;
}

/**
 * 입금 건을 입금대기 주문과 자동 대조한다.
 * - 금액·입금자명 모두 일치: 대조 완료
 * - 금액만 일치: 보류(해당 주문도 보류 처리)
 * - 후보 없음: 미대조, 단 마감된 동일 금액 주문이 있으면 반환 대상
 */
export function matchDeposit(
  state: TicketStore,
  depositorName: string,
  amountKrw: number,
): MatchOutcome {
  const waitingOrders = state.orders.filter(
    (order) => order.status === 'AWAITING_DEPOSIT' && order.amountKrw === amountKrw,
  );

  const nameMatched = waitingOrders.find((order) => {
    const verification = findVerification(state, order.userId);
    return verification
      ? isDepositorNameMatched(depositorName, verification.realName, order.orderNo)
      : false;
  });
  if (nameMatched) return { status: 'AUTO_MATCHED', matchedOrderId: nameMatched.id };

  const amountOnly = waitingOrders[0];
  if (amountOnly) {
    return {
      status: 'HELD',
      matchedOrderId: amountOnly.id,
      holdOrderId: amountOnly.id,
      memo: HOLD_REASON_NAME_MISMATCH,
    };
  }

  const hasExpiredSameAmount = state.orders.some(
    (order) => order.status === 'EXPIRED' && order.amountKrw === amountKrw,
  );
  if (hasExpiredSameAmount) {
    return { status: 'REFUND_TARGET', memo: '입금 마감 이후 입금 — 반환 대상' };
  }

  return { status: 'UNMATCHED', memo: '대조 가능한 주문 없음' };
}

/** 입금이 확정된 주문에 대해 티켓을 발급한다. */
export function issueTicketsForOrder(state: TicketStore, order: Order, issuedAt: string): Ticket[] {
  const usedCodes = new Set(state.tickets.map((ticket) => ticket.code));
  const issued: Ticket[] = [];

  for (let index = 0; index < order.qty; index += 1) {
    const code = generateTicketCode(usedCodes);
    usedCodes.add(code);
    issued.push({
      id: createId('ticket'),
      code,
      orderId: order.id,
      userId: order.userId,
      concertId: order.concertId,
      sessionId: order.sessionId,
      poolType: 'PAID_SALE',
      status: 'VALID',
      issuedAt,
    });
  }

  return issued;
}
