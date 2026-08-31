'use client';

import type {
  CashReceiptSource,
  ConcertView,
  ConcertWithSessions,
  MeView,
  OrderDetailView,
  OrderSummaryView,
  ReportTargetType,
  SessionView,
  TicketDetailView,
  TicketSummaryView,
} from './api-types';

/** 서버 API 호출 결과 — 실패 사유는 화면에 그대로 노출할 한국어 문구다. */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; reason: string; status: number };

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

export interface VerifyInput {
  realName: string;
  birth: string;
  phone: string;
  provider: string;
}

export interface CreateOrderInput {
  sessionId: string;
  qty: number;
  wantsCashReceipt: boolean;
  cashReceiptSource?: CashReceiptSource;
  /** 직접 입력한 번호로 발급할 때만 보낸다. */
  cashReceiptPhone?: string;
}

export interface ReportInput {
  targetType: ReportTargetType;
  reason: string;
  detail: string;
  evidenceUrl?: string;
}

export const api = {
  me: () => request<{ me: MeView }>('/api/me'),
  concerts: () => request<{ items: ConcertWithSessions[] }>('/api/concerts'),
  concert: (concertId: string) =>
    request<{ concert: ConcertView; sessions: SessionView[] }>(`/api/concerts/${concertId}`),
  orders: () => request<{ orders: OrderSummaryView[] }>('/api/orders'),
  order: (orderId: string) => request<{ order: OrderDetailView }>(`/api/orders/${orderId}`),
  tickets: () => request<{ tickets: TicketSummaryView[] }>('/api/tickets'),
  ticket: (ticketId: string) => request<{ ticket: TicketDetailView }>(`/api/tickets/${ticketId}`),
  verify: (input: VerifyInput) => post<Record<string, never>>('/api/verify', input),
  createOrder: (input: CreateOrderInput) => post<{ orderId: string; orderNo: string }>('/api/orders', input),
  cancelOrder: (orderId: string) => post<{ cancelled: boolean; status: string }>(`/api/orders/${orderId}/cancel`),
  submitReport: (input: ReportInput) => post<{ reportId: string }>('/api/reports', input),
};
