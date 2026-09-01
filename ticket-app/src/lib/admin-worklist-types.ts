/**
 * 주문 중심 작업함(주문·입금 확인 화면) 전용 타입.
 * 예매 목록·입금 목록 타입과 쓰임이 나뉘어 파일을 분리하고, `admin-types`에서 함께 내보낸다.
 */

import type { AdminLinkedDepositView, AdminLogView, AdminOrderView } from './admin-types';
import type { HoldCauseCode } from './api-types';

/**
 * 할 일 큐의 처리 유형 — 우선순위 순서이기도 하다.
 * 회원 요청 → 자동 대조 완료(확인 대기) → 확인 보류 → 티켓 지급 대기
 */
export type WorklistKind = 'REPORTED' | 'AWAITING_CONFIRM' | 'ON_HOLD' | 'ISSUE_PENDING';

/** 할 일 큐 1건 — 예매 하나와 그 예매를 처리하는 데 필요한 맥락 전부 */
export interface AdminWorklistItemView {
  order: AdminOrderView;
  kind: WorklistKind;
  /** 이 상태로 기다리기 시작한 시각 — 경과 시간 표시·정렬 기준 */
  waitingSince: string;
  concertTitle: string;
  sessionStartAt: string;
  /** 이 예매에 연결된 입금 전부 (등록 취소분 제외) */
  deposits: AdminLinkedDepositView[];
  /** 이 예매와 관련된 최근 활동 이력 */
  logs: AdminLogView[];
}

/** 공연 당일 지급 대상 회차 1건 */
export interface AdminIssueSessionView {
  sessionId: string;
  sessionName: string;
  concertTitle: string;
  startAt: string;
  /** 티켓 지급 대기 예매 건수 */
  pendingOrders: number;
  /** 티켓 지급 대기 매수 합계 */
  pendingQty: number;
}

/** 은행 내역 대조 입력 — 지금 처리 중인 예매를 지목한 상태로 보낸다 */
export interface ReconcileInput {
  orderId: string;
  depositorName: string;
  amountKrw: number;
}

/**
 * 은행 내역 대조 처리 결과 구분.
 * CONFIRMED = 입금 확인까지 완료 · MATCHED_OTHER·LINKED_OTHER = 다른 예매에 연결됨 ·
 * HELD = 확인 보류 전환 · REFUND_TARGET·UNMATCHED = 예매 대금으로 잇지 못함 ·
 * CONFIRM_FAILED = 대조는 됐으나 입금 확인 단계에서 막힘
 */
export type ReconcileOutcome =
  | 'CONFIRMED'
  | 'CONFIRM_FAILED'
  | 'MATCHED_OTHER'
  | 'LINKED_OTHER'
  | 'HELD'
  | 'REFUND_TARGET'
  | 'UNMATCHED'
  | 'AUTO_MATCHED';

/** 은행 내역 대조 응답 */
export interface ReconcileResultView {
  outcome: ReconcileOutcome;
  depositId: string;
  depositStatus: string;
  holdCause: HoldCauseCode | null;
  memo: string | null;
  /** 원클릭으로 입금 확인까지 끝난 예매번호 */
  orderNo?: string;
  /** 지목한 예매가 아닌 다른 예매에 연결됐을 때 그 예매번호 */
  matchedOrderNo?: string;
  reason?: string;
}

/** 회차 일괄 지급 건별 결과 (서버 함수 표기 그대로 받는다) */
export interface SessionIssueResultItem {
  order_id: string;
  order_no: string;
  qty: number;
  ok: boolean;
  reason: string | null;
}
