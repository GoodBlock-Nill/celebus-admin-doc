/**
 * 관리자 영역 서버 API 응답 타입 — 서버(매핑)와 관리자 화면(표시)이 함께 사용한다.
 * 회원 개인정보는 원칙적으로 마스킹해 내려주고, 입금 대조에 필요한 실명만 예외로 노출한다.
 */

import type { HoldCauseCode, OrderStatus, PoolType } from './api-types';

// 공연·회차·배정 타입, 주문 작업함 타입은 분량이 커 별도 파일에 두고 여기서 함께 내보낸다.
export * from './admin-concert-types';
export * from './admin-worklist-types';

/** VOIDED = 운영자가 잘못 등록한 입금을 사유와 함께 등록 취소한 상태 */
export type DepositStatus =
  | 'UNMATCHED'
  | 'AUTO_MATCHED'
  | 'CONFIRMED'
  | 'HELD'
  | 'REFUND_TARGET'
  | 'REFUNDED'
  | 'VOIDED';

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
  /** 확인 보류 표준 사유 구분 — 사유 문구와 함께 뱃지로 보여 준다 */
  holdCause: HoldCauseCode | null;
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
  /** 운영자가 취소 요청을 반려한 시각 */
  cancelRejectedAt: string | null;
  /** 입금 확인 요청 누적 횟수 — 남용 여부 판단에 쓴다 */
  depositReportCount: number;
  refundedAt: string | null;
  /** 환불 승인 때 확정된 환불 수수료 (승인 전에는 null) */
  refundFeeKrw: number | null;
  /** 환불 승인 때 실제로 돌려준 금액 (승인 전에는 null) */
  refundAmountKrw: number | null;
  party: OrderPartyView;
}

/**
 * 환불 수수료 자동 계산 결과 — 서버 단계표(관람일 기준)로 계산한 값이다.
 * 운영자가 조정하지 않으면 이 금액 그대로 승인된다.
 */
export interface RefundFeeQuoteView {
  ratePercent: number;
  feeKrw: number;
  refundKrw: number;
  /** 어떤 단계가 적용됐는지 알려 주는 한 줄 설명 */
  basis: string;
}

/** 최근 지급 완료 목록 1건 — 지급 취소 판단에 필요한 지급 시각을 함께 내려준다 */
export interface AdminIssuedOrderView extends AdminOrderView {
  issuedAt: string;
}

/** 수동 매칭 후보 예매 1건 — 어느 예매의 돈인지 고를 때 쓰는 최소 정보 */
export interface DepositMatchCandidateView {
  orderId: string;
  orderNo: string;
  realName: string;
  qty: number;
  amountKrw: number;
}

/**
 * 분할 입금 후보 — 같은 입금자명으로 나눠 들어온 미대조 입금의 합계가
 * 어떤 진행 중 예매 금액과 딱 맞을 때 서버가 계산해 붙여 주는 힌트다.
 */
export interface SplitDepositHintView {
  /** 함께 연결해야 하는 입금 식별자 묶음 (이 입금 포함) */
  depositIds: string[];
  totalKrw: number;
  order: DepositMatchCandidateView;
}

/**
 * 입금 1건의 기본 표시 항목.
 * 주문 작업함에서는 예매가 이미 행의 주인이라 예매 정보를 겹쳐 싣지 않는다.
 */
export interface AdminLinkedDepositView {
  id: string;
  depositorName: string;
  amountKrw: number;
  depositedAt: string;
  status: DepositStatus;
  memo: string | null;
  /**
   * 예매가 연결되지 않은 입금의 동일 금액 진행 중 예매 후보.
   * 2건 이상이면 자동 매칭을 하지 않았다는 뜻이며 운영자 확인이 필요하다.
   */
  matchCandidates: DepositMatchCandidateView[];
  /** 분할 입금 후보 (없으면 null) */
  splitHint: SplitDepositHintView | null;
}

/** 입금 목록용 — 어느 예매의 돈인지 함께 보여 준다 */
export interface AdminDepositView extends AdminLinkedDepositView {
  order: AdminOrderView | null;
}

/** 취소·환불 화면 행 — 회수 대상 티켓 매수 + 자동 계산 환불 수수료 포함 */
export interface AdminRefundView extends AdminOrderView {
  ticketCount: number;
  /** 승인 전 미리 보여 주는 자동 계산 수수료 (계산 실패 시 null) */
  feeQuote: RefundFeeQuoteView | null;
}

/** 재고 정합 점검 결과 1건 — 기대값과 어긋난 회차·분류 */
export interface PoolIntegrityItemView {
  sessionId: string;
  sessionName: string;
  concertTitle: string;
  poolType: PoolType;
  poolLabel: string;
  reserved: number;
  expectedReserved: number;
  issued: number;
  expectedIssued: number;
}

export interface PoolIntegrityView {
  checkedAt: string;
  checkedCount: number;
  mismatchCount: number;
  items: PoolIntegrityItemView[];
}

/** 주문 조회 결과 1건 — 연결 입금·티켓 요약을 함께 내려준다 */
export interface AdminOrderSearchView extends AdminOrderView {
  concertTitle: string;
  deposits: Array<{
    id: string;
    depositorName: string;
    amountKrw: number;
    depositedAt: string;
    status: DepositStatus;
  }>;
  ticketCount: number;
  revokedTicketCount: number;
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
