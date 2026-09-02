import type {
  ConcertStatus,
  HoldCauseCode,
  OrderStatus,
  PoolType,
  TicketStatus,
} from '@/lib/api-types';

/** 데이터베이스 조회 결과 형태 — 컬럼 표기 그대로 받아 화면용 타입으로 변환한다. */

export interface ConcertRow {
  id: string;
  title: string;
  artist: string;
  venue: string;
  venue_address: string | null;
  venue_map_url: string | null;
  poster_url: string | null;
  description: string | null;
  /** 상세 이미지 주소 목록 — 저장 형식이 자유로운 항목이라 읽은 뒤 화면용으로 다듬는다 */
  detail_image_urls: unknown;
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
  deposit_reported_at: string | null;
  report_rejected_at: string | null;
  /** 운영자가 확인 보류를 반려해 입금 대기로 되돌린 시각 */
  hold_rejected_at: string | null;
  /** 운영자가 취소 요청을 반려한 시각 */
  cancel_rejected_at: string | null;
  /** 입금 확인 요청 누적 횟수 (요청 취소로는 줄지 않는다) */
  deposit_report_count: number;
  /** 환불 확정 수수료·실환불액 (환불 승인 시 기록, 그 전엔 null) */
  refund_fee_krw: number | null;
  refund_amount_krw: number | null;
  concert_id: string;
  session_id: string;
  depositor_name_rule: string;
  wants_cash_receipt: boolean;
  cash_receipt_phone_enc: string | null;
  hold_reason: string | null;
  /** 확인 보류 표준 사유 코드 — 화면 분기 기준 (사유 문구 해석보다 우선한다) */
  hold_cause: HoldCauseCode | null;
  /** 회원이 알린 실제 입금자명 (확인 보류 대조용) */
  hold_actual_depositor: string | null;
  /** 오입금 환불 계좌 — 계좌번호는 암호문이라 복호 후 마스킹만 내려준다 */
  refund_bank: string | null;
  refund_account_enc: string | null;
  refund_holder: string | null;
  hold_info_submitted_at: string | null;
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
  /** 공연 취소 안내를 예매 화면에서 보여 주기 위해 함께 읽는다 */
  status: ConcertStatus;
}

/** 주문·티켓 목록에 곁들이는 회차 요약 */
export interface SessionBrief {
  id: string;
  name: string;
  start_at: string;
  entry_open_minutes_before: number;
}

export const CONCERT_COLUMNS =
  'id, title, artist, venue, venue_address, venue_map_url, poster_url, description, ' +
  'detail_image_urls, price_krw, max_per_user, seat_type, ' +
  'status, refund_policy, notice, sales_start_at, sales_end_at';

export const PUBLIC_SESSION_COLUMNS =
  'id, concert_id, name, start_at, entry_open_minutes_before, remaining';

export const ORDER_COLUMNS =
  'id, order_no, status, qty, amount_krw, created_at, deposit_deadline, ' +
  'deposit_reported_at, report_rejected_at, hold_rejected_at, cancel_rejected_at, ' +
  'deposit_report_count, concert_id, session_id, ' +
  'depositor_name_rule, wants_cash_receipt, cash_receipt_phone_enc, hold_reason, hold_cause, ' +
  'hold_actual_depositor, refund_bank, refund_account_enc, refund_holder, hold_info_submitted_at, ' +
  'deposit_confirmed_at, cancel_requested_at, refunded_at, refund_fee_krw, refund_amount_krw';

export const TICKET_COLUMNS =
  'id, code, order_id, concert_id, session_id, pool_type, status, issued_at, used_at';

export const CONCERT_BRIEF_COLUMNS = 'id, title, artist, venue, seat_type, status';

export const SESSION_BRIEF_COLUMNS = 'id, name, start_at, entry_open_minutes_before';
