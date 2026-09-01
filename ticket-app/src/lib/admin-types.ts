/**
 * 관리자 영역 서버 API 응답 타입 — 서버(매핑)와 관리자 화면(표시)이 함께 사용한다.
 * 회원 개인정보는 원칙적으로 마스킹해 내려주고, 입금 대조에 필요한 실명만 예외로 노출한다.
 */

import type { ConcertStatus, OrderStatus, PoolType, SeatType } from './api-types';

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

/** 이미지 업로드 용도 — 용량·보관 위치가 용도별로 다르다 */
export type AdminImageKind = 'poster' | 'detail';

export interface AdminSummaryView {
  /** 입금 확인 대기 + 티켓 지급 대기 */
  depositPending: number;
  /** 회원이 입금확인을 요청해 우선 확인이 필요한 예매 건수 */
  depositReported: number;
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
  /** 확인 보류 해결을 위해 회원이 알린 실제 입금자명 — 은행 내역 대조 힌트 */
  holdActualDepositor: string | null;
  /** 회원이 등록한 오입금 환불 계좌 (계좌번호는 마스킹 값만 내려준다) */
  refundBank: string | null;
  refundAccountMasked: string | null;
  refundHolder: string | null;
  /** 회원이 보류 해결 정보를 마지막으로 알린 시각 */
  holdInfoSubmittedAt: string | null;
  /** 회원이 입금확인을 요청한 시각 (요청이 없으면 null) */
  depositReportedAt: string | null;
  /** 운영자가 미입금으로 반려한 시각 */
  reportRejectedAt: string | null;
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

/**
 * 회차·분류별 티켓 지급 집계.
 * 입장 완료·입장 전 수치는 CELEBUS 앱 체크인 결과가 반영된 값을 그대로 보여주는 확인용이다.
 */
export interface IssuanceRowView {
  poolType: PoolType;
  issued: number;
  used: number;
  waiting: number;
  revoked: number;
}

export interface AdminSessionView {
  id: string;
  name: string;
  startAt: string;
  entryOpenMinutesBefore: number;
  pools: PoolStockView[];
  /** 실제 지급된 티켓의 분류별 상태 집계 */
  issuance: IssuanceRowView[];
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
  venueAddress: string | null;
  venueMapUrl: string | null;
  posterUrl: string | null;
  description: string | null;
  detailImageUrls: string[];
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

/** 공연 등록 시 함께 만드는 회차 1건 (분류별 배정 수량 포함) */
export interface ConcertSessionInput {
  name: string;
  /** 공연 시작 일시 — 시간대 오프셋을 포함한 문자열 */
  startAt: string;
  entryOpenMinutesBefore: number;
  pools: Record<PoolType, number>;
}

/** 공연 등록 폼이 서버로 보내는 값 — 등록 직후 상태는 항상 판매 예정이다. */
export interface ConcertCreateInput {
  title: string;
  artist: string;
  venue: string;
  /** 공연장 주소 — 선택 입력이라 비우면 보내지 않는다 */
  venueAddress?: string;
  /** 지도 링크 — 선택 입력이라 비우면 보내지 않는다 */
  venueMapUrl?: string;
  /** 포스터 이미지 주소 — 신규 등록에는 반드시 있어야 한다 */
  posterUrl: string;
  /** 공연 소개 — 선택 입력이라 비우면 보내지 않는다 */
  description?: string;
  /** 상세 이미지 주소 목록 — 화면에 보이는 순서 그대로 보낸다 (선택 입력) */
  detailImageUrls?: string[];
  priceKrw: number;
  maxPerUser: number;
  seatType: SeatType;
  refundPolicy: string;
  notice: string;
  salesStartAt: string;
  salesEndAt: string;
  sessions: ConcertSessionInput[];
}

/** 운영자가 지정할 수 있는 판매 상태 (판매 예정으로 되돌리는 전이는 없다) */
export type ConcertStatusTransition = Exclude<ConcertStatus, 'UPCOMING'>;

/** 공연장 검색 결과 1건 — 이름·주소는 검색 서비스 표기를 그대로 쓴다. */
export interface VenueSearchItemView {
  name: string;
  roadAddress: string;
  address: string;
  mapUrl: string;
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
