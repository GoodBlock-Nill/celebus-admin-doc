import type { BadgeTone } from './badge';
import type { ConcertStatus, OrderStatus } from '@/lib/api-types';

export interface StatusMeta {
  label: string;
  tone: BadgeTone;
}

/** 공연 판매 상태 */
export const CONCERT_STATUS_META: Record<ConcertStatus, StatusMeta> = {
  ON_SALE: { label: '판매중', tone: 'accent' },
  UPCOMING: { label: '판매예정', tone: 'warning' },
  CLOSED: { label: '판매종료', tone: 'muted' },
};

/** 예매 상태 */
export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  AWAITING_DEPOSIT: { label: '입금 확인중', tone: 'warning' },
  ON_HOLD: { label: '확인 보류', tone: 'warning' },
  DEPOSIT_CONFIRMED: { label: '지급 대기', tone: 'successSoft' },
  PAID: { label: '지급 완료', tone: 'success' },
  EXPIRED: { label: '기한 만료·취소', tone: 'muted' },
  CANCEL_REQUESTED: { label: '취소 요청됨', tone: 'accent' },
  REFUNDED: { label: '환불 완료', tone: 'muted' },
};

/** 티켓 상태 */
/** 입금 안내를 다시 보여줘야 하는 예매 상태 */
export function needsDepositGuide(status: OrderStatus): boolean {
  return status === 'AWAITING_DEPOSIT' || status === 'ON_HOLD';
}

/** 취소·환불 요청을 접수할 수 있는 예매 상태 (입금 확인 이후) */
export function canRequestCancel(status: OrderStatus): boolean {
  return status === 'DEPOSIT_CONFIRMED' || status === 'PAID';
}
