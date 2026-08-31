import { ACTOR_OPERATOR, ACTOR_SYSTEM } from './constants';
import { formatKrw } from './format';
import {
  appendLog,
  clampToZero,
  countHeldQty,
  createId,
  depositorNameRuleText,
  findVerification,
  makeLog,
  makeOrderNo,
  poolRemaining,
  updatePool,
  userLabel,
} from './store-helpers';
import { endOfKstDayIso, isPast } from './time';
import type { CreateOrderInput, StoreGet, StoreSet, TicketStore } from './store-types';
import type { ActivityLog, ConcertSession, Order } from './types';

type OrderSlice = Pick<
  TicketStore,
  'createOrder' | 'expireOverdueOrders' | 'requestCancel' | 'cancelAwaitingOrder' | 'approveRefund'
>;

const MIN_ORDER_QTY = 1;

/** 예매 좌석 반환 — 유상 판매 풀의 예약분을 되돌린다. */
function releaseReserved(sessions: ConcertSession[], sessionId: string, qty: number): ConcertSession[] {
  return updatePool(sessions, sessionId, 'PAID_SALE', (stock) => ({
    ...stock,
    reserved: clampToZero(stock.reserved - qty),
  }));
}

/** 주문 생성 전 검증 — 실패 사유(한국어)를 반환하고, 통과 시 undefined */
function validateOrder(state: TicketStore, input: CreateOrderInput): string | undefined {
  const nowMs = state.now().getTime();
  const verification = findVerification(state, state.currentUserId);
  if (!verification) return '본인확인을 먼저 완료해 주세요.';

  const concert = state.concerts.find((item) => item.id === input.concertId);
  if (!concert) return '공연 정보를 찾을 수 없습니다.';
  if (concert.status !== 'ON_SALE') return '현재 예매할 수 있는 공연이 아닙니다.';
  if (nowMs < new Date(concert.salesStartAt).getTime()) return '아직 예매가 시작되지 않았습니다.';
  if (nowMs > new Date(concert.salesEndAt).getTime()) return '예매가 마감되었습니다.';

  const session = state.sessions.find(
    (item) => item.id === input.sessionId && item.concertId === concert.id,
  );
  if (!session) return '회차 정보를 찾을 수 없습니다.';

  if (!Number.isInteger(input.qty) || input.qty < MIN_ORDER_QTY) return '예매 매수를 확인해 주세요.';

  const heldQty = countHeldQty(state, state.currentUserId, concert.id);
  if (heldQty + input.qty > concert.maxPerUser) {
    return `1인 최대 ${concert.maxPerUser}매까지 예매할 수 있습니다. (현재 보유 ${heldQty}매)`;
  }

  if (poolRemaining(session.pools.PAID_SALE) < input.qty) return '잔여 좌석이 부족합니다.';

  if (input.wantsCashReceipt && !input.cashReceiptPhone?.trim()) {
    return '현금영수증 발급용 휴대폰번호를 입력해 주세요.';
  }

  return undefined;
}

/** 예매·취소·환불 승인 액션 */
export function createOrderSlice(set: StoreSet, get: StoreGet): OrderSlice {
  return {
    createOrder: (input) => {
      const state = get();
      const invalidReason = validateOrder(state, input);
      if (invalidReason) return { ok: false as const, reason: invalidReason };

      const verification = findVerification(state, state.currentUserId);
      const concert = state.concerts.find((item) => item.id === input.concertId);
      if (!verification || !concert) return { ok: false as const, reason: '주문 정보를 확인할 수 없습니다.' };

      const nowDate = state.now();
      const seq = state.orderSeq + 1;
      const addDays = state.settings.depositDeadlineMode === 'NEXT_DAY' ? 1 : 0;

      const order: Order = {
        id: createId('order'),
        orderNo: makeOrderNo(nowDate, seq),
        userId: state.currentUserId,
        concertId: concert.id,
        sessionId: input.sessionId,
        qty: input.qty,
        amountKrw: concert.priceKrw * input.qty,
        status: 'AWAITING_DEPOSIT',
        createdAt: nowDate.toISOString(),
        depositDeadline: endOfKstDayIso(nowDate, addDays),
        depositorNameRule: depositorNameRuleText(verification.realName),
        wantsCashReceipt: input.wantsCashReceipt,
        cashReceiptPhone: input.wantsCashReceipt ? input.cashReceiptPhone?.trim() : undefined,
      };

      set((current) => ({
        orders: [...current.orders, order],
        orderSeq: seq,
        sessions: updatePool(current.sessions, input.sessionId, 'PAID_SALE', (stock) => ({
          ...stock,
          reserved: stock.reserved + input.qty,
        })),
        logs: appendLog(
          current.logs,
          makeLog(
            userLabel(current, current.currentUserId),
            '예매 신청',
            `주문 ${order.orderNo} · ${order.qty}매 · ${formatKrw(order.amountKrw)} 입금대기`,
            nowDate,
          ),
        ),
      }));

      return { ok: true as const, order };
    },

    expireOverdueOrders: () => {
      const state = get();
      const nowDate = state.now();
      const overdue = state.orders.filter(
        (order) =>
          (order.status === 'AWAITING_DEPOSIT' || order.status === 'ON_HOLD') &&
          isPast(order.depositDeadline, nowDate),
      );
      if (overdue.length === 0) return;

      const overdueIds = new Set(overdue.map((order) => order.id));

      set((current) => {
        let nextSessions = current.sessions;
        let nextLogs = current.logs;

        overdue.forEach((order) => {
          nextSessions = releaseReserved(nextSessions, order.sessionId, order.qty);
          nextLogs = appendLog(
            nextLogs,
            makeLog(
              ACTOR_SYSTEM,
              '입금 마감 자동 취소',
              `주문 ${order.orderNo} 입금 미확인으로 자동 취소되었습니다.`,
              nowDate,
            ),
          );
        });

        return {
          orders: current.orders.map((order) =>
            overdueIds.has(order.id) ? { ...order, status: 'EXPIRED' as const } : order,
          ),
          sessions: nextSessions,
          logs: nextLogs,
        };
      });
    },

    requestCancel: (orderId) => {
      const state = get();
      const order = state.orders.find((item) => item.id === orderId);
      if (!order) return { ok: false as const, reason: '주문을 찾을 수 없습니다.' };

      if (order.status === 'AWAITING_DEPOSIT' || order.status === 'ON_HOLD') {
        return get().cancelAwaitingOrder(orderId);
      }

      if (order.status !== 'PAID') return { ok: false as const, reason: '취소할 수 있는 상태가 아닙니다.' };

      const nowDate = state.now();
      set((current) => ({
        orders: current.orders.map((item) =>
          item.id === orderId
            ? { ...item, status: 'CANCEL_REQUESTED' as const, cancelRequestedAt: nowDate.toISOString() }
            : item,
        ),
        logs: appendLog(
          current.logs,
          makeLog(
            userLabel(current, order.userId),
            '취소 요청',
            `주문 ${order.orderNo} 취소를 요청했습니다. (24시간 이내 환불 처리)`,
            nowDate,
          ),
        ),
      }));

      return { ok: true as const };
    },

    cancelAwaitingOrder: (orderId) => {
      const state = get();
      const order = state.orders.find((item) => item.id === orderId);
      if (!order) return { ok: false as const, reason: '주문을 찾을 수 없습니다.' };
      if (order.status !== 'AWAITING_DEPOSIT' && order.status !== 'ON_HOLD') {
        return { ok: false as const, reason: '입금대기 상태의 주문만 즉시 취소할 수 있습니다.' };
      }

      const nowDate = state.now();
      set((current) => ({
        orders: current.orders.map((item) =>
          item.id === orderId ? { ...item, status: 'EXPIRED' as const, holdReason: undefined } : item,
        ),
        sessions: releaseReserved(current.sessions, order.sessionId, order.qty),
        logs: appendLog(
          current.logs,
          makeLog(
            userLabel(current, order.userId),
            '사용자 취소',
            `주문 ${order.orderNo}을(를) 입금 전에 취소했습니다.`,
            nowDate,
          ),
        ),
      }));

      return { ok: true as const };
    },

    approveRefund: (orderId) => {
      const state = get();
      const order = state.orders.find((item) => item.id === orderId);
      if (!order) return { ok: false as const, reason: '주문을 찾을 수 없습니다.' };
      if (order.status !== 'CANCEL_REQUESTED') {
        return { ok: false as const, reason: '취소 요청된 주문만 환불 처리할 수 있습니다.' };
      }

      const nowDate = state.now();
      const targetTickets = state.tickets.filter(
        (ticket) => ticket.orderId === orderId && ticket.status !== 'REVOKED',
      );

      set((current) => {
        const refundLog: ActivityLog = makeLog(
          ACTOR_OPERATOR,
          '환불 승인',
          `주문 ${order.orderNo} 환불 처리 · 티켓 ${targetTickets.length}매 무효화`,
          nowDate,
        );

        return {
          orders: current.orders.map((item) =>
            item.id === orderId
              ? { ...item, status: 'REFUNDED' as const, refundedAt: nowDate.toISOString() }
              : item,
          ),
          tickets: current.tickets.map((ticket) =>
            ticket.orderId === orderId && ticket.status !== 'REVOKED'
              ? { ...ticket, status: 'REVOKED' as const }
              : ticket,
          ),
          sessions: updatePool(current.sessions, order.sessionId, 'PAID_SALE', (stock) => ({
            ...stock,
            issued: clampToZero(stock.issued - targetTickets.length),
          })),
          deposits: current.deposits.map((deposit) =>
            deposit.id === order.confirmedDepositId
              ? { ...deposit, status: 'REFUNDED' as const }
              : deposit,
          ),
          logs: appendLog(current.logs, refundLog),
        };
      });

      return { ok: true as const };
    },
  };
}
