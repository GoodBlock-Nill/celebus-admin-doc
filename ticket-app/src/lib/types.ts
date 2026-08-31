export type PoolType = 'PAID_SALE' | 'CELEBUS_WINNER' | 'IX_INVITATION' | 'OPERATION_HOLD';

export interface PoolStock { allocated: number; reserved: number; issued: number; }

export interface Concert {
  id: string; title: string; artist: string; venue: string;
  priceKrw: number; maxPerUser: number; seatType: '자유석' | '구역제';
  status: 'UPCOMING' | 'ON_SALE' | 'CLOSED';
  refundPolicy: string; notice: string;
  salesStartAt: string; salesEndAt: string; // ISO
}

export interface ConcertSession {
  id: string; concertId: string; name: string; // 예: "1회차 10/15(수) 19:00"
  startAt: string; entryOpenMinutesBefore: number; // QR 활성화 기준(기본 60)
  pools: Record<PoolType, PoolStock>;
}

export interface IdentityVerification {
  userId: string; realName: string; birth: string; phone: string;
  di: string; verifiedAt: string;
}

/** DEPOSIT_CONFIRMED = 입금 확인 완료·티켓 지급 대기 (운영자 지급 처리 전) */
export type OrderStatus =
  | 'AWAITING_DEPOSIT'
  | 'ON_HOLD'
  | 'DEPOSIT_CONFIRMED'
  | 'PAID'
  | 'EXPIRED'
  | 'CANCEL_REQUESTED'
  | 'REFUNDED';

export interface Order {
  id: string; orderNo: string; // 예: T250901-0001
  userId: string; concertId: string; sessionId: string;
  qty: number; amountKrw: number; status: OrderStatus;
  createdAt: string; depositDeadline: string; // ISO
  depositorNameRule: string; // "홍길동" 또는 "홍길동+주문번호 끝4자리"
  wantsCashReceipt: boolean; cashReceiptPhone?: string;
  holdReason?: string; cancelRequestedAt?: string; refundedAt?: string;
  confirmedDepositId?: string; depositConfirmedAt?: string;
}

export type TicketStatus = 'VALID' | 'USED' | 'REVOKED';

export interface Ticket {
  id: string; code: string; // 체크인용 8자리 코드
  orderId?: string; userId: string; concertId: string; sessionId: string;
  poolType: PoolType; status: TicketStatus; issuedAt: string; usedAt?: string;
}

export type DepositStatus = 'UNMATCHED' | 'AUTO_MATCHED' | 'CONFIRMED' | 'HELD' | 'REFUND_TARGET' | 'REFUNDED';

export interface DepositRecord {
  id: string; depositorName: string; amountKrw: number; depositedAt: string;
  status: DepositStatus; matchedOrderId?: string; memo?: string;
}

export type ReportStatus = 'RECEIVED' | 'BLOCKED' | 'SUBMITTED' | 'CLOSED';

export interface TicketReport {
  id: string; targetType: '게시물' | '계정' | '외부 링크'; reason: string;
  detail: string; evidenceUrl?: string; source: '앱 신고' | '외부 통보';
  createdAt: string; deadlineAt: string; // 접수 +10시간
  status: ReportStatus;
  actions: Array<{ type: string; at: string }>;
}

export interface ActivityLog { id: string; actor: string; action: string; detail: string; at: string; }

export interface DemoUser { id: string; nickname: string; }

export interface AppSettings {
  depositDeadlineMode: 'SAME_DAY' | 'NEXT_DAY'; // 기본 SAME_DAY (당일 자정)
  bankName: string; bankAccount: string; bankHolder: string;
}

export type CheckInResult =
  | { kind: 'OK'; ticket: Ticket }
  | { kind: 'DUPLICATE'; ticket: Ticket }
  | { kind: 'REVOKED'; ticket: Ticket }
  | { kind: 'INVALID' };
