import { ACTOR_OPERATOR, ACTOR_SYSTEM } from './constants';
import { formatKrw } from './format';
import {
  HOLD_REASON_NAME_MISMATCH,
  issueTicketsForOrder,
  matchDeposit,
} from './store-deposit-match';
import { appendLog, clampToZero, createId, makeLog, updatePool } from './store-helpers';
import type { AddDepositInput, StoreGet, StoreSet, TicketStore } from './store-types';
import type { DepositRecord } from './types';

type DepositSlice = Pick<
  TicketStore,
  | 'addDeposit'
  | 'confirmDeposit'
  | 'holdDeposit'
  | 'markRefundTarget'
  | 'refundDeposit'
  | 'manualMatch'
>;

/** 입금 대조·확정·보류·반환 액션 */
export function createDepositSlice(set: StoreSet, get: StoreGet): DepositSlice {
  const findDeposit = (depositId: string): DepositRecord | undefined =>
    get().deposits.find((item) => item.id === depositId);

  return {
    addDeposit: (input: AddDepositInput) => {
      const state = get();
      const depositorName = input.depositorName.trim();
      if (!depositorName) return { ok: false as const, reason: '입금자명을 입력해 주세요.' };
      if (!Number.isFinite(input.amountKrw) || input.amountKrw <= 0) {
        return { ok: false as const, reason: '입금액을 확인해 주세요.' };
      }

      const nowDate = state.now();
      const outcome = matchDeposit(state, depositorName, input.amountKrw);
      const deposit: DepositRecord = {
        id: createId('deposit'),
        depositorName,
        amountKrw: input.amountKrw,
        depositedAt: nowDate.toISOString(),
        status: outcome.status,
        matchedOrderId: outcome.matchedOrderId,
        memo: outcome.memo,
      };

      set((current) => ({
        deposits: [...current.deposits, deposit],
        orders: current.orders.map((order) =>
          order.id === outcome.holdOrderId
            ? { ...order, status: 'ON_HOLD' as const, holdReason: HOLD_REASON_NAME_MISMATCH }
            : order,
        ),
        logs: appendLog(
          current.logs,
          makeLog(
            ACTOR_SYSTEM,
            '입금 자동 대조',
            `${depositorName} · ${formatKrw(input.amountKrw)} · 결과 ${outcome.status}`,
            nowDate,
          ),
        ),
      }));

      return { ok: true as const, deposit };
    },

    confirmDeposit: (depositId) => {
      const state = get();
      const deposit = findDeposit(depositId);
      if (!deposit) return { ok: false as const, reason: '입금 내역을 찾을 수 없습니다.' };
      if (deposit.status !== 'AUTO_MATCHED' && deposit.status !== 'HELD') {
        return { ok: false as const, reason: '대조 완료 또는 보류 상태의 입금만 확정할 수 있습니다.' };
      }

      const order = state.orders.find((item) => item.id === deposit.matchedOrderId);
      if (!order) return { ok: false as const, reason: '연결된 주문이 없습니다. 먼저 수동 매칭해 주세요.' };
      if (order.status !== 'AWAITING_DEPOSIT' && order.status !== 'ON_HOLD') {
        return { ok: false as const, reason: '입금 확정이 가능한 주문 상태가 아닙니다.' };
      }

      const nowDate = state.now();
      const newTickets = issueTicketsForOrder(state, order, nowDate.toISOString());

      set((current) => ({
        deposits: current.deposits.map((item) =>
          item.id === depositId ? { ...item, status: 'CONFIRMED' as const } : item,
        ),
        orders: current.orders.map((item) =>
          item.id === order.id
            ? { ...item, status: 'PAID' as const, holdReason: undefined, confirmedDepositId: depositId }
            : item,
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
            '입금 확정',
            `주문 ${order.orderNo} 입금 확정 · 티켓 ${order.qty}매 발급`,
            nowDate,
          ),
        ),
      }));

      return { ok: true as const };
    },

    holdDeposit: (depositId, memo) => {
      const state = get();
      const deposit = findDeposit(depositId);
      if (!deposit) return { ok: false as const, reason: '입금 내역을 찾을 수 없습니다.' };
      if (deposit.status === 'CONFIRMED' || deposit.status === 'REFUNDED') {
        return { ok: false as const, reason: '이미 처리된 입금은 보류할 수 없습니다.' };
      }

      const nowDate = state.now();
      set((current) => ({
        deposits: current.deposits.map((item) =>
          item.id === depositId ? { ...item, status: 'HELD' as const, memo } : item,
        ),
        orders: current.orders.map((order) =>
          order.id === deposit.matchedOrderId && order.status === 'AWAITING_DEPOSIT'
            ? { ...order, status: 'ON_HOLD' as const, holdReason: memo }
            : order,
        ),
        logs: appendLog(
          current.logs,
          makeLog(ACTOR_OPERATOR, '입금 보류', `${deposit.depositorName} · 사유 ${memo}`, nowDate),
        ),
      }));

      return { ok: true as const };
    },

    markRefundTarget: (depositId, memo) => {
      const state = get();
      const deposit = findDeposit(depositId);
      if (!deposit) return { ok: false as const, reason: '입금 내역을 찾을 수 없습니다.' };
      if (deposit.status === 'CONFIRMED' || deposit.status === 'REFUNDED') {
        return { ok: false as const, reason: '이미 처리된 입금입니다.' };
      }

      const nowDate = state.now();
      set((current) => ({
        deposits: current.deposits.map((item) =>
          item.id === depositId ? { ...item, status: 'REFUND_TARGET' as const, memo } : item,
        ),
        logs: appendLog(
          current.logs,
          makeLog(ACTOR_OPERATOR, '반환 대상 지정', `${deposit.depositorName} · 사유 ${memo}`, nowDate),
        ),
      }));

      return { ok: true as const };
    },

    refundDeposit: (depositId) => {
      const state = get();
      const deposit = findDeposit(depositId);
      if (!deposit) return { ok: false as const, reason: '입금 내역을 찾을 수 없습니다.' };
      if (deposit.status === 'REFUNDED') return { ok: false as const, reason: '이미 반환된 입금입니다.' };

      const nowDate = state.now();
      set((current) => ({
        deposits: current.deposits.map((item) =>
          item.id === depositId ? { ...item, status: 'REFUNDED' as const } : item,
        ),
        logs: appendLog(
          current.logs,
          makeLog(
            ACTOR_OPERATOR,
            '입금 반환',
            `${deposit.depositorName} · ${formatKrw(deposit.amountKrw)} 반환 완료`,
            nowDate,
          ),
        ),
      }));

      return { ok: true as const };
    },

    manualMatch: (depositId, orderId) => {
      const state = get();
      const deposit = findDeposit(depositId);
      if (!deposit) return { ok: false as const, reason: '입금 내역을 찾을 수 없습니다.' };
      if (deposit.status === 'CONFIRMED' || deposit.status === 'REFUNDED') {
        return { ok: false as const, reason: '이미 처리된 입금입니다.' };
      }

      const order = state.orders.find((item) => item.id === orderId);
      if (!order) return { ok: false as const, reason: '주문을 찾을 수 없습니다.' };
      if (order.status !== 'AWAITING_DEPOSIT' && order.status !== 'ON_HOLD') {
        return { ok: false as const, reason: '입금대기 또는 보류 상태의 주문만 매칭할 수 있습니다.' };
      }

      const previousOrderId = deposit.matchedOrderId;
      const nowDate = state.now();

      set((current) => ({
        deposits: current.deposits.map((item) =>
          item.id === depositId
            ? { ...item, status: 'AUTO_MATCHED' as const, matchedOrderId: orderId }
            : item,
        ),
        orders: current.orders.map((item) => {
          if (item.id === orderId) {
            return { ...item, status: 'AWAITING_DEPOSIT' as const, holdReason: undefined };
          }
          if (item.id === previousOrderId && item.status === 'ON_HOLD') {
            return { ...item, status: 'AWAITING_DEPOSIT' as const, holdReason: undefined };
          }
          return item;
        }),
        logs: appendLog(
          current.logs,
          makeLog(
            ACTOR_OPERATOR,
            '입금 수동 매칭',
            `${deposit.depositorName} 입금을 주문 ${order.orderNo}에 연결했습니다.`,
            nowDate,
          ),
        ),
      }));

      return { ok: true as const };
    },
  };
}
