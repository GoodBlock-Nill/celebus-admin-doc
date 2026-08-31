/**
 * 회원 영역 서버 API 응답 타입 — 서버(매핑)와 화면(표시)이 함께 사용한다.
 * 서버는 스네이크 표기 컬럼을 이 형태로 변환해 내려주고, 화면은 이 타입만 알면 된다.
 */

export type PoolType = 'PAID_SALE' | 'CELEBUS_WINNER' | 'IX_INVITATION' | 'OPERATION_HOLD';

export type ConcertStatus = 'UPCOMING' | 'ON_SALE' | 'CLOSED';

/** 좌석 방식 — 등록 시 선택하는 두 가지 */
export type SeatType = '자유석' | '구역제';

/** DEPOSIT_CONFIRMED = 입금 확인 완료·티켓 지급 대기 (운영자 지급 처리 전) */
export type OrderStatus =
  | 'AWAITING_DEPOSIT'
  | 'ON_HOLD'
  | 'DEPOSIT_CONFIRMED'
  | 'PAID'
  | 'EXPIRED'
  | 'CANCEL_REQUESTED'
  | 'REFUNDED';

export type TicketStatus = 'VALID' | 'USED' | 'REVOKED';

export type ReportTargetType = '게시물' | '계정' | '외부 링크';

export interface ConcertView {
  id: string;
  title: string;
  artist: string;
  venue: string;
  priceKrw: number;
  maxPerUser: number;
  seatType: string;
  status: ConcertStatus;
  refundPolicy: string;
  notice: string;
  salesStartAt: string;
  salesEndAt: string;
}

export interface SessionView {
  id: string;
  concertId: string;
  name: string;
  startAt: string;
  entryOpenMinutesBefore: number;
  /** 유상 판매분 잔여 좌석 (서버 계산값) */
  remaining: number;
}

export interface ConcertWithSessions {
  concert: ConcertView;
  sessions: SessionView[];
}

/** 본인확인 상태 — 실명·휴대폰번호는 마스킹만 노출한다(설계서 §3.1 완화 구조) */
export interface VerificationView {
  realNameMasked: string;
  phoneMasked: string;
  provider: string;
  verifiedAt: string;
}

export interface MeView {
  nickname: string;
  verified: boolean;
  verification: VerificationView | null;
}

export interface OrderSummaryView {
  id: string;
  orderNo: string;
  status: OrderStatus;
  qty: number;
  amountKrw: number;
  createdAt: string;
  depositDeadline: string;
  concertId: string;
  concertTitle: string;
  sessionId: string;
  sessionName: string;
  sessionStartAt: string;
}

export interface BankAccountView {
  name: string;
  account: string;
  holder: string;
}

export interface OrderDetailView extends OrderSummaryView {
  venue: string;
  /** 입금자명 안내 문구 — 본인 실명 기준 (입금 대조에 필요) */
  depositorNameRule: string;
  /** 입금자명 안내에 사용할 본인 실명 */
  depositorName: string;
  wantsCashReceipt: boolean;
  cashReceiptPhoneMasked: string | null;
  holdReason: string | null;
  depositConfirmedAt: string | null;
  cancelRequestedAt: string | null;
  refundedAt: string | null;
  /** 이 주문으로 지급된 티켓의 최초 발급 시각 (미지급이면 null) */
  ticketIssuedAt: string | null;
  bank: BankAccountView;
}

export interface TicketSummaryView {
  id: string;
  code: string;
  /** 무상 발급(당첨자·초대·운영 보류분) 티켓은 연결된 주문이 없다 */
  orderId: string | null;
  poolType: PoolType;
  status: TicketStatus;
  issuedAt: string;
  usedAt: string | null;
  concertId: string;
  concertTitle: string;
  artist: string;
  sessionId: string;
  sessionName: string;
  sessionStartAt: string;
}

export interface TicketDetailView extends TicketSummaryView {
  venue: string;
  seatType: string;
  entryOpenMinutesBefore: number;
}

/** 배정 풀 한국어 표기 */
export const POOL_LABELS: Record<PoolType, string> = {
  PAID_SALE: '유상 판매',
  CELEBUS_WINNER: 'CELEBUS 당첨자',
  IX_INVITATION: '소속사 초대',
  OPERATION_HOLD: '운영 보류분',
};

export function poolLabel(poolType: PoolType): string {
  return POOL_LABELS[poolType] ?? poolType;
}
