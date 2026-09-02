/**
 * 회원 영역 서버 API 응답 타입 — 서버(매핑)와 화면(표시)이 함께 사용한다.
 * 서버는 스네이크 표기 컬럼을 이 형태로 변환해 내려주고, 화면은 이 타입만 알면 된다.
 */

export type PoolType = 'PAID_SALE' | 'CELEBUS_WINNER' | 'IX_INVITATION' | 'OPERATION_HOLD';

/**
 * 공연 판매 상태.
 *  · CANCELED = 공연 취소 (예매 중단 + 전 예매 환불 전환)
 */
export type ConcertStatus = 'UPCOMING' | 'ON_SALE' | 'CLOSED' | 'CANCELED';

/** 좌석 방식 — 등록 시 선택하는 세 가지 (현장배정 = 입장 순서대로 현장에서 자리 안내) */
export type SeatType = '자유석' | '구역제' | '현장배정';

/**
 * 예매 진행 상태.
 *  · AWAITING_DEPOSIT  = 입금 대기 (계좌 이체 전)
 *  · DEPOSIT_REPORTED  = 입금 확인중 (회원이 입금확인을 요청해 운영자가 확인하는 중)
 *  · DEPOSIT_CONFIRMED = 입금 확인 (티켓 지급 처리 전)
 *  · PAID              = 티켓 지급
 */
export type OrderStatus =
  | 'AWAITING_DEPOSIT'
  | 'DEPOSIT_REPORTED'
  | 'ON_HOLD'
  | 'DEPOSIT_CONFIRMED'
  | 'PAID'
  | 'EXPIRED'
  | 'CANCEL_REQUESTED'
  | 'REFUNDED';

export type TicketStatus = 'VALID' | 'USED' | 'REVOKED';

/**
 * 같은 회차에 아직 끝나지 않은 예매가 있어 신청이 거부됐을 때 서버가 함께 내려주는 안내 정보.
 * 화면은 이 정보로 "기존 예매 보기 / 추가로 예매하기"를 묻는다.
 */
export interface ExistingOrderInfo {
  orderId: string;
  orderNo: string;
  status: OrderStatus;
  qty: number;
  amountKrw: number;
  depositDeadline: string;
}

/**
 * 확인 보류 표준 사유 구분.
 *  · NAME   = 입금자명이 예매 정보와 다름
 *  · AMOUNT = 보낸 금액이 예매 금액과 다름 (오입금)
 *  · BOTH   = 두 가지 모두 다름
 *  · OTHER  = 그 밖의 사유 (운영자가 직접 보류한 건)
 */
export type HoldCauseCode = 'NAME' | 'AMOUNT' | 'BOTH' | 'OTHER';

export type ReportTargetType = '게시물' | '계정' | '외부 링크';

/**
 * 현금영수증 발급 번호의 출처.
 *  · verified = 본인확인에 사용한 휴대폰 번호 (번호 원문은 서버에서만 다룬다)
 *  · manual   = 회원이 직접 입력한 다른 번호
 */
export type CashReceiptSource = 'verified' | 'manual';

export interface ConcertView {
  id: string;
  title: string;
  artist: string;
  venue: string;
  /** 공연장 도로명 주소 — 등록 시 선택 입력이라 없을 수 있다 */
  venueAddress: string | null;
  /** 지도 링크 — 있으면 공연 상세에서 새 창으로 연다 */
  venueMapUrl: string | null;
  /** 포스터 이미지 주소 (3:4 세로형) — 등록 전 공연은 값이 없을 수 있다 */
  posterUrl: string | null;
  /** 공연 소개 — 상세 이미지 안 정보를 보완하는 요약 텍스트 (없을 수 있다) */
  description: string | null;
  /** 상세 이미지 주소 목록 — 공연 상세에서 순서대로 세로 나열한다 */
  detailImageUrls: string[];
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
  /** 회원이 입금확인을 요청한 시각 (요청 전·취소 후에는 없다) */
  depositReportedAt: string | null;
  /** 운영자가 미입금으로 반려한 시각 (재요청 안내에 사용) */
  reportRejectedAt: string | null;
  /** 운영자가 확인 보류를 반려해 입금 대기로 되돌린 시각 (환불·재송금 안내에 사용) */
  holdRejectedAt: string | null;
  /** 운영자가 취소 요청을 반려한 시각 (반려 안내에 사용) */
  cancelRejectedAt: string | null;
  /** 입금 확인 요청 누적 횟수 — 남은 요청 횟수 안내에 사용 */
  depositReportCount: number;
  /** 환불 확정 수수료·실환불액 (환불 승인 시 기록, 그 전엔 null) */
  refundFeeKrw: number | null;
  refundAmountKrw: number | null;
  concertId: string;
  concertTitle: string;
  /** 공연 판매 상태 — 공연 취소 안내를 예매 화면에서 함께 보여 주기 위해 내려준다 */
  concertStatus: ConcertStatus;
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
  /** 확인 보류 표준 사유 구분 — 화면 분기는 이 값을 먼저 본다 (없으면 사유 문구로 판단) */
  holdCause: HoldCauseCode | null;
  /**
   * 이 예매에 연결된 반환 대상 입금이 있는지 여부.
   * 마감·취소 이후 도착한 입금처럼 "돌려줘야 할 돈"이 남아 있음을 뜻한다.
   */
  hasRefundTargetDeposit: boolean;
  /** 확인 보류를 풀기 위해 회원이 알린 실제 입금자명 (미제출이면 null) */
  holdActualDepositor: string | null;
  /** 오입금 환불 계좌 — 계좌번호는 마스킹 값만 내려받는다 */
  refundBank: string | null;
  refundAccountMasked: string | null;
  refundHolder: string | null;
  /** 보류 해결 정보를 마지막으로 알린 시각 (미제출이면 null) */
  holdInfoSubmittedAt: string | null;
  depositConfirmedAt: string | null;
  cancelRequestedAt: string | null;
  refundedAt: string | null;
  /** 이 주문으로 지급된 티켓의 최초 발급 시각 (미지급이면 null) */
  ticketIssuedAt: string | null;
  /** 취소 요청 상태의 환불 견적 — 수수료·예상 환불액·적용 기준 (그 외 상태는 null) */
  refundQuote: {
    ratePercent: number;
    feeKrw: number;
    refundKrw: number;
    basis: string;
  } | null;
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
