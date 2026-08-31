import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';

import { createSeedState } from './seed';
import { createDemoSlice } from './store-demo';
import { createDepositSlice } from './store-deposit';
import { createOrderSlice } from './store-order';
import { createReportSlice } from './store-report';
import { createTicketSlice } from './store-ticket';
import type { TicketDataState, TicketStore } from './store-types';

export const TICKET_STORE_KEY = 'celebus-ticket-demo';
const STORE_VERSION = 1;

/** 서버 렌더링 구간에서는 저장소가 없으므로 아무것도 보존하지 않는다. */
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

function resolveStorage(): StateStorage {
  return typeof window === 'undefined' ? noopStorage : window.localStorage;
}

/** localStorage에 보존할 데이터 영역만 추려낸다. */
function partializeState(state: TicketStore): TicketDataState {
  return {
    users: state.users,
    currentUserId: state.currentUserId,
    verifications: state.verifications,
    concerts: state.concerts,
    sessions: state.sessions,
    orders: state.orders,
    tickets: state.tickets,
    deposits: state.deposits,
    reports: state.reports,
    logs: state.logs,
    settings: state.settings,
    demoOffsetMs: state.demoOffsetMs,
    orderSeq: state.orderSeq,
  };
}

export const useTicketStore = create<TicketStore>()(
  persist(
    (set, get) => ({
      ...createSeedState(),
      ...createDemoSlice(set, get),
      ...createOrderSlice(set, get),
      ...createDepositSlice(set, get),
      ...createTicketSlice(set, get),
      ...createReportSlice(set, get),
    }),
    {
      name: TICKET_STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => partializeState(state),
    },
  ),
);

/** 현재 로그인한 데모 사용자 */
export function selectCurrentUser(state: TicketStore) {
  return state.users.find((user) => user.id === state.currentUserId);
}

/** 현재 사용자의 본인확인 정보 */
export function selectCurrentVerification(state: TicketStore) {
  return state.verifications.find((item) => item.userId === state.currentUserId);
}

/** 특정 사용자의 주문 목록 (최신순) */
export function selectOrdersByUser(state: TicketStore, userId: string) {
  return state.orders
    .filter((order) => order.userId === userId)
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** 특정 사용자의 유효 티켓 목록 (발급 순) */
export function selectTicketsByUser(state: TicketStore, userId: string) {
  return state.tickets
    .filter((ticket) => ticket.userId === userId)
    .slice()
    .sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime());
}

/** 공연에 속한 회차 목록 */
export function selectSessionsByConcert(state: TicketStore, concertId: string) {
  return state.sessions.filter((session) => session.concertId === concertId);
}
