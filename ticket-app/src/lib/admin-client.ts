'use client';

import type { ApiResult } from './api-client';
import type {
  AdminConcertDetailView,
  AdminConcertRowView,
  AdminDepositView,
  AdminImageKind,
  AdminIssuedOrderView,
  AdminLogView,
  AdminMemberOptionView,
  AdminOrderView,
  AdminRefundView,
  AdminReportView,
  AdminSummaryView,
  CompPoolType,
  ConcertCreateInput,
  ConcertStatusTransition,
  ReportActionType,
  VenueSearchItemView,
} from './admin-types';
import type { HoldCauseCode, PoolType, ReportTargetType } from './api-types';

const NETWORK_FAILURE = '네트워크 상태를 확인한 뒤 다시 시도해 주세요.';
const NETWORK_STATUS = 0;
const REQUEST_TIMEOUT_MS = 10000;
/** 이미지 업로드는 파일 전송 시간이 필요해 조회보다 넉넉하게 기다린다. */
const UPLOAD_TIMEOUT_MS = 60000;

/**
 * 본문 형식에 맞는 헤더를 고른다.
 * 파일 업로드(FormData)는 브라우저가 경계 문자열이 포함된 형식 헤더를 직접 붙여야 하므로 건드리지 않는다.
 */
function requestHeaders(init?: RequestInit): HeadersInit | undefined {
  if (!init?.body || init.body instanceof FormData) return init?.headers;
  return { 'Content-Type': 'application/json', ...init.headers };
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ...init,
      headers: requestHeaders(init),
    });

    const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (!response.ok || !body || body.ok !== true) {
      const reason = typeof body?.reason === 'string' ? body.reason : NETWORK_FAILURE;
      return { ok: false, reason, status: response.status };
    }
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, reason: NETWORK_FAILURE, status: NETWORK_STATUS };
  }
}

function post<T>(path: string, payload?: unknown): Promise<ApiResult<T>> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(payload ?? {}) });
}

export interface CompIssueInput {
  concertId: string;
  sessionId: string;
  poolType: CompPoolType;
  memberId: string;
  qty: number;
  reason: string;
}

export interface ReallocateInput {
  concertId: string;
  sessionId: string;
  from: PoolType;
  to: PoolType;
  qty: number;
}

export interface ManualReportInput {
  targetType: ReportTargetType;
  reason: string;
  detail: string;
  evidenceUrl?: string;
}

export const adminApi = {
  login: (key: string, adminName: string) => post<{ adminName: string }>('/api/admin/login', { key, adminName }),
  logout: () => request<Record<string, never>>('/api/admin/login', { method: 'DELETE' }),

  summary: () => request<{ summary: AdminSummaryView; adminName: string }>('/api/admin/summary'),

  concerts: () => request<{ items: AdminConcertRowView[] }>('/api/admin/concerts'),
  concert: (concertId: string) =>
    request<{ concert: AdminConcertDetailView; logs: AdminLogView[] }>(`/api/admin/concerts/${concertId}`),
  createConcert: (input: ConcertCreateInput) => post<{ concert_id: string }>('/api/admin/concerts', input),
  setConcertStatus: (concertId: string, status: ConcertStatusTransition) =>
    post<{ status: ConcertStatusTransition }>(`/api/admin/concerts/${concertId}/actions`, {
      action: 'set-status',
      status,
    }),
  /** 공연 취소 — 소속 예매를 상태에 맞게 일괄 정리한다 (되돌릴 수 없음) */
  cancelConcert: (concertId: string) =>
    post<{ title?: string; refund_requested?: number; expired?: number; revoked_tickets?: number }>(
      `/api/admin/concerts/${concertId}/actions`,
      { action: 'cancel-concert' },
    ),
  reallocate: ({ concertId, ...rest }: ReallocateInput) =>
    post<Record<string, never>>(`/api/admin/concerts/${concertId}/actions`, { action: 'reallocate', ...rest }),
  issueCompTickets: ({ concertId, ...rest }: CompIssueInput) =>
    post<{ codes: string[] }>(`/api/admin/concerts/${concertId}/actions`, { action: 'comp-issue', ...rest }),

  /** 이미지 업로드 — 저장에 성공하면 화면·앱에서 그대로 쓰는 공개 주소를 돌려준다. */
  uploadImage: (file: File, kind: AdminImageKind) => {
    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);
    return request<{ url: string }>('/api/admin/images', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    });
  },

  /** 공연장 검색 — 검색어를 비우면 검색 사용 가능 여부만 확인한다. */
  searchVenues: (keyword: string) =>
    request<{ items: VenueSearchItemView[] }>(`/api/admin/venue-search?q=${encodeURIComponent(keyword)}`),

  members: (keyword: string) =>
    request<{ items: AdminMemberOptionView[] }>(`/api/admin/members?q=${encodeURIComponent(keyword)}`),

  deposits: () =>
    request<{
      deposits: AdminDepositView[];
      /** 회원이 입금확인을 요청한 예매 */
      reported: AdminOrderView[];
      issuePending: AdminOrderView[];
      matchable: AdminOrderView[];
      /** 최근 지급 완료 예매 — 오지급을 되돌릴 때 쓴다 */
      recentIssued: AdminIssuedOrderView[];
    }>('/api/admin/deposits'),
  registerDeposit: (depositorName: string, amountKrw: number) =>
    post<{ status: string; memo: string | null }>('/api/admin/deposits', { depositorName, amountKrw }),
  confirmDeposit: (depositId: string) =>
    post<{ order_no?: string }>('/api/admin/deposits/actions', { action: 'confirm', depositId }),
  /** 입금 보류 — 사유 구분을 함께 보내면 회원 화면의 해결 안내가 그 기준으로 갈린다 */
  holdDeposit: (depositId: string, memo: string, cause?: HoldCauseCode) =>
    post<Record<string, never>>('/api/admin/deposits/actions', {
      action: 'hold',
      depositId,
      memo,
      ...(cause ? { cause } : {}),
    }),
  markRefundTarget: (depositId: string, memo: string) =>
    post<Record<string, never>>('/api/admin/deposits/actions', { action: 'refund-target', depositId, memo }),
  refundDeposit: (depositId: string) =>
    post<Record<string, never>>('/api/admin/deposits/actions', { action: 'refund', depositId }),
  manualMatch: (depositId: string, orderId: string) =>
    post<Record<string, never>>('/api/admin/deposits/actions', { action: 'manual-match', depositId, orderId }),
  issueOrderTickets: (orderId: string) =>
    post<{ issued_qty?: number }>('/api/admin/deposits/actions', { action: 'issue-tickets', orderId }),
  rejectDepositReport: (orderId: string) =>
    post<{ order_no?: string }>('/api/admin/deposits/actions', { action: 'reject-report', orderId }),
  /** 보류 반려 — 예매를 입금 대기로 되돌리고 보류 입금은 반환 대상으로 넘긴다 */
  rejectHold: (orderId: string) =>
    post<{ order_no?: string; refund_targets?: number }>('/api/admin/deposits/actions', {
      action: 'reject-hold',
      orderId,
    }),
  /** 입금 확인 취소 — 잘못 확인한 예매를 입금 대기로 되돌린다 */
  undoConfirmDeposit: (orderId: string) =>
    post<{ order_no?: string; deposit_deadline?: string }>('/api/admin/deposits/actions', {
      action: 'undo-confirm',
      orderId,
    }),
  /** 티켓 지급 취소 — 잘못 지급한 티켓을 회수하고 지급 대기로 되돌린다 */
  undoIssueTickets: (orderId: string) =>
    post<{ order_no?: string; revoked_tickets?: number }>('/api/admin/deposits/actions', {
      action: 'undo-issue',
      orderId,
    }),
  /** 입금 등록 취소 — 잘못 등록한 입금을 사유와 함께 무효로 돌린다 */
  voidDeposit: (depositId: string, reason: string) =>
    post<{ hold_released?: boolean }>('/api/admin/deposits/actions', {
      action: 'void',
      depositId,
      reason,
    }),

  refunds: () => request<{ pending: AdminRefundView[]; done: AdminRefundView[] }>('/api/admin/refunds'),
  approveRefund: (orderId: string) =>
    post<{ revoked_tickets?: number }>('/api/admin/refunds', { orderId, action: 'approve' }),
  /** 취소 요청 반려 — 예매를 취소 요청 직전 상태로 되돌린다 */
  rejectCancelRequest: (orderId: string) =>
    post<{ order_no?: string; status?: string }>('/api/admin/refunds', { orderId, action: 'reject' }),

  reports: () => request<{ items: AdminReportView[] }>('/api/admin/reports'),
  submitReport: (input: ManualReportInput) =>
    post<{ report_id?: string }>('/api/admin/reports', { action: 'submit', ...input }),
  actOnReport: (reportId: string, actionType: ReportActionType) =>
    post<{ status?: string }>('/api/admin/reports', { action: 'act', reportId, actionType }),

  logs: () => request<{ items: AdminLogView[] }>('/api/admin/logs'),
};
