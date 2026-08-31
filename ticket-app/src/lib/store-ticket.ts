import { ACTOR_OPERATOR } from './constants';
import { issueTicketsForOrder } from './store-deposit-match';
import {
  appendLog,
  clampToZero,
  createId,
  generateTicketCode,
  makeLog,
  poolRemaining,
  updatePool,
  userLabel,
} from './store-helpers';
import type { IssueCompTicketsInput, StoreGet, StoreSet, TicketStore } from './store-types';
import type { CheckInResult, PoolType, Ticket } from './types';

type TicketSlice = Pick<
  TicketStore,
  'issueCompTickets' | 'issueOrderTickets' | 'reallocatePool' | 'checkInTicket'
>;

const POOL_LABELS: Record<PoolType, string> = {
  PAID_SALE: '유상 판매',
  CELEBUS_WINNER: 'CELEBUS 당첨자',
  IX_INVITATION: '소속사 초대',
  OPERATION_HOLD: '운영 보류분',
};

/** 배정 풀 한국어 표기 */
export function poolLabel(poolType: PoolType): string {
  return POOL_LABELS[poolType];
}

/** 무상 발급·풀 재배정·체크인 액션 */
export function createTicketSlice(set: StoreSet, get: StoreGet): TicketSlice {
  return {
    issueCompTickets: (input: IssueCompTicketsInput) => {
      const state = get();
      if (!Number.isInteger(input.qty) || input.qty < 1) {
        return { ok: false as const, reason: '발급 매수를 확인해 주세요.' };
      }

      const session = state.sessions.find((item) => item.id === input.sessionId);
      if (!session) return { ok: false as const, reason: '회차 정보를 찾을 수 없습니다.' };

      const user = state.users.find((item) => item.id === input.userId);
      if (!user) return { ok: false as const, reason: '대상 회원을 찾을 수 없습니다.' };

      const reason = input.reason.trim();
      if (input.poolType === 'OPERATION_HOLD' && !reason) {
        return { ok: false as const, reason: '운영 보류분 발급은 사유 입력이 필수입니다.' };
      }

      if (poolRemaining(session.pools[input.poolType]) < input.qty) {
        return { ok: false as const, reason: `${poolLabel(input.poolType)} 잔여 수량이 부족합니다.` };
      }

      const nowDate = state.now();
      const issuedAt = nowDate.toISOString();
      const usedCodes = new Set(state.tickets.map((ticket) => ticket.code));
      const issued: Ticket[] = [];

      for (let index = 0; index < input.qty; index += 1) {
        const code = generateTicketCode(usedCodes);
        usedCodes.add(code);
        issued.push({
          id: createId('ticket'),
          code,
          userId: input.userId,
          concertId: session.concertId,
          sessionId: session.id,
          poolType: input.poolType,
          status: 'VALID',
          issuedAt,
        });
      }

      set((current) => ({
        tickets: [...current.tickets, ...issued],
        sessions: updatePool(current.sessions, session.id, input.poolType, (stock) => ({
          ...stock,
          issued: stock.issued + input.qty,
        })),
        logs: appendLog(
          current.logs,
          makeLog(
            ACTOR_OPERATOR,
            '무상 티켓 발급',
            `${session.name} · ${poolLabel(input.poolType)} ${input.qty}매 → ${userLabel(current, input.userId)}${reason ? ` · 사유 ${reason}` : ''}`,
            nowDate,
          ),
        ),
      }));

      return { ok: true as const };
    },

    issueOrderTickets: (orderId) => {
      const state = get();
      const order = state.orders.find((item) => item.id === orderId);
      if (!order) return { ok: false as const, reason: '주문을 찾을 수 없습니다.' };
      if (order.status !== 'DEPOSIT_CONFIRMED') {
        return { ok: false as const, reason: '입금 확인이 끝난 지급 대기 주문만 티켓을 지급할 수 있습니다.' };
      }

      const nowDate = state.now();
      const newTickets = issueTicketsForOrder(state, order, nowDate.toISOString());

      set((current) => ({
        orders: current.orders.map((item) =>
          item.id === order.id ? { ...item, status: 'PAID' as const } : item,
        ),
        tickets: [...current.tickets, ...newTickets],
        sessions: updatePool(current.sessions, order.sessionId, 'PAID_SALE', (stock) => ({
          ...stock,
          reserved: clampToZero(stock.reserved - order.qty),
          issued: stock.issued + order.qty,
        })),
        logs: appendLog(
          current.logs,
          makeLog(
            ACTOR_OPERATOR,
            '티켓 지급',
            `주문 ${order.orderNo} · 실명 티켓 ${order.qty}매 지급 완료`,
            nowDate,
          ),
        ),
      }));

      return { ok: true as const };
    },

    reallocatePool: (sessionId, from, to, qty) => {
      const state = get();
      if (from === to) return { ok: false as const, reason: '동일한 배정 풀로는 이동할 수 없습니다.' };
      if (!Number.isInteger(qty) || qty < 1) return { ok: false as const, reason: '이동 수량을 확인해 주세요.' };

      const session = state.sessions.find((item) => item.id === sessionId);
      if (!session) return { ok: false as const, reason: '회차 정보를 찾을 수 없습니다.' };

      if (poolRemaining(session.pools[from]) < qty) {
        return { ok: false as const, reason: `${poolLabel(from)} 잔여 수량이 부족합니다.` };
      }

      const nowDate = state.now();
      set((current) => {
        const decreased = updatePool(current.sessions, sessionId, from, (stock) => ({
          ...stock,
          allocated: stock.allocated - qty,
        }));
        const increased = updatePool(decreased, sessionId, to, (stock) => ({
          ...stock,
          allocated: stock.allocated + qty,
        }));

        return {
          sessions: increased,
          logs: appendLog(
            current.logs,
            makeLog(
              ACTOR_OPERATOR,
              '배정 수량 이동',
              `${session.name} · ${poolLabel(from)} → ${poolLabel(to)} ${qty}매`,
              nowDate,
            ),
          ),
        };
      });

      return { ok: true as const };
    },

    checkInTicket: (code) => {
      const state = get();
      const normalized = code.trim().toUpperCase();
      const ticket = state.tickets.find((item) => item.code === normalized);
      if (!ticket) return { kind: 'INVALID' } satisfies CheckInResult;

      const nowDate = state.now();

      if (ticket.status === 'REVOKED') {
        return { kind: 'REVOKED', ticket } satisfies CheckInResult;
      }

      if (ticket.status === 'USED') {
        return { kind: 'DUPLICATE', ticket } satisfies CheckInResult;
      }

      const usedTicket: Ticket = { ...ticket, status: 'USED', usedAt: nowDate.toISOString() };
      set((current) => ({
        tickets: current.tickets.map((item) => (item.id === ticket.id ? usedTicket : item)),
        logs: appendLog(
          current.logs,
          makeLog(ACTOR_OPERATOR, '입장 확인', `티켓 ${ticket.code} 입장 처리`, nowDate),
        ),
      }));

      return { kind: 'OK', ticket: usedTicket } satisfies CheckInResult;
    },
  };
}
