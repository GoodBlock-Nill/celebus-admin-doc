import {
  MAX_ACTIVITY_LOGS,
  ORDER_NO_PREFIX,
  ORDER_NO_TAIL_LENGTH,
  ORDER_SEQ_DIGITS,
  TICKET_CODE_ALPHABET,
  TICKET_CODE_LENGTH,
} from './constants';
import { kstYymmdd } from './time';
import type { TicketDataState } from './store-types';
import type { ActivityLog, ConcertSession, PoolStock, PoolType } from './types';

const ID_RADIX = 36;
const ID_RANDOM_LENGTH = 6;
const CODE_RETRY_LIMIT = 20;

/** 데모용 식별자 생성 */
export function createId(prefix: string): string {
  const stamp = Date.now().toString(ID_RADIX);
  const random = Math.random().toString(ID_RADIX).slice(2, 2 + ID_RANDOM_LENGTH);
  return `${prefix}-${stamp}${random}`;
}

/** 주문번호 채번 — T250901-0001 */
export function makeOrderNo(now: Date, seq: number): string {
  return `${ORDER_NO_PREFIX}${kstYymmdd(now)}-${String(seq).padStart(ORDER_SEQ_DIGITS, '0')}`;
}

/** 주문번호 끝 4자리 */
export function orderNoTail(orderNo: string): string {
  return orderNo.slice(-ORDER_NO_TAIL_LENGTH);
}

/** 중복되지 않는 8자리 체크인 코드 생성 */
export function generateTicketCode(usedCodes: Set<string>): string {
  for (let attempt = 0; attempt < CODE_RETRY_LIMIT; attempt += 1) {
    let code = '';
    for (let i = 0; i < TICKET_CODE_LENGTH; i += 1) {
      const index = Math.floor(Math.random() * TICKET_CODE_ALPHABET.length);
      code += TICKET_CODE_ALPHABET[index];
    }
    if (!usedCodes.has(code)) return code;
  }
  return `${Date.now().toString(ID_RADIX).toUpperCase()}`.slice(-TICKET_CODE_LENGTH);
}

/** 활동 로그 1건 생성 */
export function makeLog(actor: string, action: string, detail: string, at: Date): ActivityLog {
  return { id: createId('log'), actor, action, detail, at: at.toISOString() };
}

/** 최신 로그가 앞에 오도록 추가하고 보관 한도를 적용 */
export function appendLog(logs: ActivityLog[], entry: ActivityLog): ActivityLog[] {
  return [entry, ...logs].slice(0, MAX_ACTIVITY_LOGS);
}

/** 배정 풀 잔여 수량 */
export function poolRemaining(stock: PoolStock): number {
  return stock.allocated - stock.reserved - stock.issued;
}

/** 특정 회차의 특정 풀 재고를 불변 갱신 */
export function updatePool(
  sessions: ConcertSession[],
  sessionId: string,
  poolType: PoolType,
  updater: (stock: PoolStock) => PoolStock,
): ConcertSession[] {
  return sessions.map((session) =>
    session.id === sessionId
      ? { ...session, pools: { ...session.pools, [poolType]: updater(session.pools[poolType]) } }
      : session,
  );
}

/** 재고 수치를 0 미만으로 내려가지 않게 보정 */
export function clampToZero(value: number): number {
  return value < 0 ? 0 : value;
}

/** 사용자의 본인확인 정보 */
export function findVerification(state: TicketDataState, userId: string) {
  return state.verifications.find((item) => item.userId === userId);
}

/** 로그 주체 표기용 사용자 닉네임 */
export function userLabel(state: TicketDataState, userId: string): string {
  return state.users.find((user) => user.id === userId)?.nickname ?? userId;
}

/** 1인 구매 한도 계산에 포함되는 수량 (유효 주문 + 무주문 발급 티켓) */
export function countHeldQty(state: TicketDataState, userId: string, concertId: string): number {
  const activeOrderStatuses = new Set([
    'AWAITING_DEPOSIT',
    'ON_HOLD',
    'DEPOSIT_CONFIRMED',
    'PAID',
    'CANCEL_REQUESTED',
  ]);
  const orderQty = state.orders
    .filter(
      (order) =>
        order.userId === userId &&
        order.concertId === concertId &&
        activeOrderStatuses.has(order.status),
    )
    .reduce((sum, order) => sum + order.qty, 0);

  const compTicketQty = state.tickets.filter(
    (ticket) =>
      ticket.userId === userId &&
      ticket.concertId === concertId &&
      ticket.orderId === undefined &&
      ticket.status !== 'REVOKED',
  ).length;

  return orderQty + compTicketQty;
}

/** 입금자명 안내 문구 */
export function depositorNameRuleText(realName: string): string {
  return `${realName} (동명이인 등으로 확인이 어려우면 "${realName}+주문번호 끝 4자리")`;
}

/** 입금자명이 주문의 입금자명 규칙과 일치하는지 판정 */
export function isDepositorNameMatched(
  depositorName: string,
  realName: string,
  orderNo: string,
): boolean {
  const normalized = depositorName.replace(/\s/g, '');
  const name = realName.replace(/\s/g, '');
  return normalized === name || normalized === `${name}${orderNoTail(orderNo)}`;
}
