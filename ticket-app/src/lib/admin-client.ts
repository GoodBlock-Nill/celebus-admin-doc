'use client';

import type { ApiResult } from './api-client';
import type {
  AdminConcertDetailView,
  AdminConcertRowView,
  AdminDepositView,
  AdminLogView,
  AdminMemberOptionView,
  AdminOrderView,
  AdminRefundView,
  AdminReportView,
  AdminSummaryView,
  CheckInResultView,
  CompPoolType,
  ConcertCreateInput,
  ConcertStatusTransition,
  IssuanceSessionView,
  ReportActionType,
} from './admin-types';
import type { PoolType, ReportTargetType } from './api-types';

const NETWORK_FAILURE = '네트워크 상태를 확인한 뒤 다시 시도해 주세요.';
const NETWORK_STATUS = 0;
const REQUEST_TIMEOUT_MS = 10000;

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
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
  reallocate: ({ concertId, ...rest }: ReallocateInput) =>
    post<Record<string, never>>(`/api/admin/concerts/${concertId}/actions`, { action: 'reallocate', ...rest }),
  issueCompTickets: ({ concertId, ...rest }: CompIssueInput) =>
    post<{ codes: string[] }>(`/api/admin/concerts/${concertId}/actions`, { action: 'comp-issue', ...rest }),

  members: (keyword: string) =>
    request<{ items: AdminMemberOptionView[] }>(`/api/admin/members?q=${encodeURIComponent(keyword)}`),

  deposits: () =>
    request<{ deposits: AdminDepositView[]; issuePending: AdminOrderView[]; matchable: AdminOrderView[] }>(
      '/api/admin/deposits',
    ),
  registerDeposit: (depositorName: string, amountKrw: number) =>
    post<{ status: string; memo: string | null }>('/api/admin/deposits', { depositorName, amountKrw }),
  confirmDeposit: (depositId: string) =>
    post<{ order_no?: string }>('/api/admin/deposits/actions', { action: 'confirm', depositId }),
  holdDeposit: (depositId: string, memo: string) =>
    post<Record<string, never>>('/api/admin/deposits/actions', { action: 'hold', depositId, memo }),
  markRefundTarget: (depositId: string, memo: string) =>
    post<Record<string, never>>('/api/admin/deposits/actions', { action: 'refund-target', depositId, memo }),
  refundDeposit: (depositId: string) =>
    post<Record<string, never>>('/api/admin/deposits/actions', { action: 'refund', depositId }),
  manualMatch: (depositId: string, orderId: string) =>
    post<Record<string, never>>('/api/admin/deposits/actions', { action: 'manual-match', depositId, orderId }),
  issueOrderTickets: (orderId: string) =>
    post<{ issued_qty?: number }>('/api/admin/deposits/actions', { action: 'issue-tickets', orderId }),

  refunds: () => request<{ pending: AdminRefundView[]; done: AdminRefundView[] }>('/api/admin/refunds'),
  approveRefund: (orderId: string) => post<{ revoked_tickets?: number }>('/api/admin/refunds', { orderId }),

  issuance: () => request<{ items: IssuanceSessionView[] }>('/api/admin/checkin'),
  checkIn: (input: string) => post<{ result: CheckInResultView }>('/api/admin/checkin', { input }),

  reports: () => request<{ items: AdminReportView[] }>('/api/admin/reports'),
  submitReport: (input: ManualReportInput) =>
    post<{ report_id?: string }>('/api/admin/reports', { action: 'submit', ...input }),
  actOnReport: (reportId: string, actionType: ReportActionType) =>
    post<{ status?: string }>('/api/admin/reports', { action: 'act', reportId, actionType }),

  logs: () => request<{ items: AdminLogView[] }>('/api/admin/logs'),
};
