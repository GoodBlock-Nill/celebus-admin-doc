/**
 * 관리자 영역 서버 API 응답 타입 — 서버(매핑)와 관리자 화면(표시)이 함께 사용한다.
 * 회원 개인정보는 원칙적으로 마스킹해 내려주고, 입금 대조에 필요한 실명만 예외로 노출한다.
 */

import type { ConcertStatus, OrderStatus, PoolType, TicketStatus } from './api-types';

export type DepositStatus =
  | 'UNMATCHED'
  | 'AUTO_MATCHED'
  | 'CONFIRMED'
  | 'HELD'
  | 'REFUND_TARGET'
  | 'REFUNDED';

export type ReportStatus = 'RECEIVED' | 'BLOCKED' | 'SUBMITTED' | 'CLOSED';

export type ReportActionType =
  | '노출 차단'
  | '수사기관 제출'
  | '계정 제재'
  | '티켓 무효화'
  | '종결';

/** 무상 발급이 가능한 배정 분류 (유상 판매분 제외) */
export type CompPoolType = Exclude<PoolType, 'PAID_SALE'>;

export interface AdminSummaryView {
  /** 입금 확인 대기 + 티켓 지급 대기 */
  depositPending: number;
  autoMatched: number;
  unmatched: number;
  held: number;
  issuePending: number;
  refundPending: number;
  /** 가장 급한 취소 요청의 접수 시각 (없으면 null) */
  nearestCancelRequestedAt: string | null;
  reportPending: number;
  /** 가장 급한 미조치 신고의 처리 기한 (없으면 null) */
  nearestReportDeadlineAt: string | null;
  todayQty: number;
  todayAmountKrw: number;
}

/** 주문에 곁들이는 주문자 표기 — 실명은 입금 대조 목적에 한해 노출한다. */
export interface OrderPartyView {
  realName: string;
  nickname: string;
}

export interface AdminOrderView {
  id: string;
  orderNo: string;
  status: OrderStatus;
  qty: number;
  amountKrw: number;
  createdAt: string;
  depositDeadline: string;
  sessionName: string;
  holdReason: string | null;
  depositConfirmedAt: string | null;
  cancelRequestedAt: string | null;
  refundedAt: string | null;
  party: OrderPartyView;
}

export interface AdminDepositView {
  id: string;
  depositorName: string;
  amountKrw: number;
  depositedAt: string;
  status: DepositStatus;
  memo: string | null;
  order: AdminOrderView | null;
}

/** 취소·환불 화면 행 — 회수 대상 티켓 매수 포함 */
export interface AdminRefundView extends AdminOrderView {
  ticketCount: number;
}

export interface PoolStockView {
  poolType: PoolType;
  allocated: number;
  reserved: number;
  issued: number;
}

export interface AdminSessionView {
  id: string;
  name: string;
  startAt: string;
  entryOpenMinutesBefore: number;
  pools: PoolStockView[];
}

export interface AdminConcertRowView {
  id: string;
  title: string;
  artist: string;
  status: ConcertStatus;
  priceKrw: number;
  salesStartAt: string;
  salesEndAt: string;
  sessionCount: number;
  allocated: number;
  reserved: number;
  issued: number;
}

export interface AdminConcertDetailView {
  id: string;
  title: string;
  artist: string;
  venue: string;
  seatType: string;
  status: ConcertStatus;
  priceKrw: number;
  maxPerUser: number;
  salesStartAt: string;
  salesEndAt: string;
  notice: string;
  refundPolicy: string;
  sessions: AdminSessionView[];
}

/** 무상 발급 대상 — 본인확인을 마친 회원만 후보가 되며 실명은 마스킹해 노출한다. */
export interface AdminMemberOptionView {
  id: string;
  nickname: string;
  realNameMasked: string;
}

export interface AdminLogView {
  id: string;
  actor: string;
  action: string;
  detail: string;
  createdAt: string;
}

export interface AdminReportActionView {
  actionType: string;
  actedAt: string;
  adminName: string;
}

export interface AdminReportView {
  id: string;
  targetType: string;
  reason: string;
  detail: string;
  evidenceUrl: string | null;
  source: string;
  createdAt: string;
  deadlineAt: string;
  status: ReportStatus;
  actions: AdminReportActionView[];
}

export type CheckInKind = 'OK' | 'DUPLICATE' | 'REVOKED' | 'INVALID' | 'EXPIRED_TOKEN';

export interface CheckInTicketView {
  code: string;
  concertTitle: string;
  sessionName: string;
  poolType: PoolType;
  status: TicketStatus;
  usedAt: string | null;
  memberNickname: string;
}

export interface CheckInResultView {
  kind: CheckInKind;
  ticket: CheckInTicketView | null;
}

/** 회차·분류별 발급/입장 집계 */
export interface IssuanceRowView {
  poolType: PoolType;
  issued: number;
  used: number;
  waiting: number;
  revoked: number;
}

export interface IssuanceSessionView {
  sessionId: string;
  sessionName: string;
  rows: IssuanceRowView[];
}
