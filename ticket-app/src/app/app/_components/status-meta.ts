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
  AWAITING_DEPOSIT: { label: '입금 대기', tone: 'warning' },
  DEPOSIT_REPORTED: { label: '입금 확인중', tone: 'info' },
  ON_HOLD: { label: '확인 보류', tone: 'warning' },
  DEPOSIT_CONFIRMED: { label: '입금 확인', tone: 'successSoft' },
  PAID: { label: '티켓 지급', tone: 'success' },
  EXPIRED: { label: '기한 만료·취소', tone: 'muted' },
  CANCEL_REQUESTED: { label: '취소 요청됨', tone: 'accent' },
  REFUNDED: { label: '환불 완료', tone: 'muted' },
};

/** 입금 안내를 다시 보여줘야 하는 예매 상태 (입금 확인중에도 계좌 안내를 유지한다) */
export function needsDepositGuide(status: OrderStatus): boolean {
  return status === 'AWAITING_DEPOSIT' || status === 'DEPOSIT_REPORTED' || status === 'ON_HOLD';
}

/** 예매 내역 목록 탭 구분 */
export type OrderTabKey = 'ONGOING' | 'DONE' | 'CANCELED';

const ORDER_TAB_BY_STATUS: Record<OrderStatus, OrderTabKey> = {
  AWAITING_DEPOSIT: 'ONGOING',
  DEPOSIT_REPORTED: 'ONGOING',
  ON_HOLD: 'ONGOING',
  DEPOSIT_CONFIRMED: 'ONGOING',
  PAID: 'DONE',
  CANCEL_REQUESTED: 'CANCELED',
  REFUNDED: 'CANCELED',
  EXPIRED: 'CANCELED',
};

/** 예매 상태가 속하는 목록 탭 */
export function orderTabOf(status: OrderStatus): OrderTabKey {
  return ORDER_TAB_BY_STATUS[status];
}

/**
 * 취소·환불 요청을 접수할 수 있는 예매 상태.
 * 티켓 지급은 공연 당일에 이뤄지므로 지급된 예매는 취소·환불 대상이 아니다.
 */
export function canRequestCancel(status: OrderStatus): boolean {
  return status === 'DEPOSIT_CONFIRMED';
}

/**
 * 회원이 즉시 취소할 수 있는 예매 상태 (입금 확인 전).
 * 입금 확인중은 운영자가 입금 내역을 대조하는 중이라 제외한다 —
 * 취소가 필요하면 입금확인 요청을 먼저 취소해야 한다.
 */
export function canCancelBeforeDeposit(status: OrderStatus): boolean {
  return status === 'AWAITING_DEPOSIT' || status === 'ON_HOLD';
}
