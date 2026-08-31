import type { DepositStatus, ReportStatus } from '@/lib/admin-types';
import type { ConcertStatus, OrderStatus, TicketStatus } from '@/lib/api-types';

/** 뱃지·상태 표기에 사용하는 색 톤 */
export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface StatusView {
  label: string;
  tone: Tone;
}

export const ORDER_STATUS_VIEW: Record<OrderStatus, StatusView> = {
  AWAITING_DEPOSIT: { label: '입금 대기', tone: 'accent' },
  ON_HOLD: { label: '확인 보류', tone: 'warning' },
  DEPOSIT_CONFIRMED: { label: '지급 대기', tone: 'accent' },
  PAID: { label: '지급 완료', tone: 'success' },
  EXPIRED: { label: '자동 취소', tone: 'neutral' },
  CANCEL_REQUESTED: { label: '취소 요청', tone: 'warning' },
  REFUNDED: { label: '환불 완료', tone: 'neutral' },
};

export const DEPOSIT_STATUS_VIEW: Record<DepositStatus, StatusView> = {
  UNMATCHED: { label: '미대조', tone: 'warning' },
  AUTO_MATCHED: { label: '자동 대조 완료', tone: 'accent' },
  CONFIRMED: { label: '입금 확정', tone: 'success' },
  HELD: { label: '보류', tone: 'warning' },
  REFUND_TARGET: { label: '반환 대상', tone: 'danger' },
  REFUNDED: { label: '반환 완료', tone: 'neutral' },
};

export const TICKET_STATUS_VIEW: Record<TicketStatus, StatusView> = {
  VALID: { label: '입장 전', tone: 'accent' },
  USED: { label: '입장 완료', tone: 'success' },
  REVOKED: { label: '회수됨', tone: 'danger' },
};

export const REPORT_STATUS_VIEW: Record<ReportStatus, StatusView> = {
  RECEIVED: { label: '접수 (미조치)', tone: 'warning' },
  BLOCKED: { label: '노출 차단', tone: 'accent' },
  SUBMITTED: { label: '수사기관 제출', tone: 'accent' },
  CLOSED: { label: '종결', tone: 'neutral' },
};

export const CONCERT_STATUS_VIEW: Record<ConcertStatus, StatusView> = {
  UPCOMING: { label: '판매 예정', tone: 'neutral' },
  ON_SALE: { label: '판매 중', tone: 'success' },
  CLOSED: { label: '판매 종료', tone: 'neutral' },
};
