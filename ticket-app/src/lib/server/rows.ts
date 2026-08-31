import type { ConcertStatus, OrderStatus, PoolType, TicketStatus } from '@/lib/api-types';

/** 데이터베이스 조회 결과 형태 — 컬럼 표기 그대로 받아 화면용 타입으로 변환한다. */

export interface ConcertRow {
  id: string;
  title: string;
  artist: string;
  venue: string;
  price_krw: number;
  max_per_user: number;
  seat_type: string;
  status: ConcertStatus;
  refund_policy: string;
  notice: string;
  sales_start_at: string;
  sales_end_at: string;
}

export interface PublicSessionRow {
  id: string;
  concert_id: string;
  name: string;
  start_at: string;
  entry_open_minutes_before: number;
  remaining: number;
}

export interface OrderRow {
  id: string;
  order_no: string;
  status: OrderStatus;
  qty: number;
  amount_krw: number;
  created_at: string;
  deposit_deadline: string;
  concert_id: string;
  session_id: string;
  depositor_name_rule: string;
  wants_cash_receipt: boolean;
  cash_receipt_phone_enc: string | null;
  hold_reason: string | null;
  deposit_confirmed_at: string | null;
  cancel_requested_at: string | null;
  refunded_at: string | null;
}

export interface TicketRow {
  id: string;
  code: string;
  order_id: string | null;
  concert_id: string;
  session_id: string;
  pool_type: PoolType;
  status: TicketStatus;
  issued_at: string;
  used_at: string | null;
}

export interface VerificationRow {
  real_name: string;
  birth: string;
  phone_enc: string | null;
  provider: string | null;
  verified_at: string;
}

export interface SettingsRow {
  bank_name: string;
  bank_account: string;
  bank_holder: string;
}

/** 주문·티켓 목록에 곁들이는 공연 요약 */
export interface ConcertBrief {
  id: string;
  title: string;
  artist: string;
  venue: string;
  seat_type: string;
}

/** 주문·티켓 목록에 곁들이는 회차 요약 */
export interface SessionBrief {
  id: string;
  name: string;
  start_at: string;
  entry_open_minutes_before: number;
}

export const CONCERT_COLUMNS =
  'id, title, artist, venue, price_krw, max_per_user, seat_type, status, refund_policy, notice, sales_start_at, sales_end_at';

export const PUBLIC_SESSION_COLUMNS =
  'id, concert_id, name, start_at, entry_open_minutes_before, remaining';

export const ORDER_COLUMNS =
  'id, order_no, status, qty, amount_krw, created_at, deposit_deadline, concert_id, session_id, ' +
  'depositor_name_rule, wants_cash_receipt, cash_receipt_phone_enc, hold_reason, ' +
  'deposit_confirmed_at, cancel_requested_at, refunded_at';

export const TICKET_COLUMNS =
  'id, code, order_id, concert_id, session_id, pool_type, status, issued_at, used_at';

export const CONCERT_BRIEF_COLUMNS = 'id, title, artist, venue, seat_type';

export const SESSION_BRIEF_COLUMNS = 'id, name, start_at, entry_open_minutes_before';
