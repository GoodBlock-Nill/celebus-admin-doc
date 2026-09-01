import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { decryptText } from './crypto';
import {
  CONCERT_BRIEF_COLUMNS,
  SESSION_BRIEF_COLUMNS,
  type ConcertBrief,
  type ConcertRow,
  type OrderRow,
  type PublicSessionRow,
  type SessionBrief,
  type TicketRow,
} from './rows';
import type {
  ConcertView,
  OrderSummaryView,
  SessionView,
  TicketDetailView,
  TicketSummaryView,
} from '@/lib/api-types';
import { maskAccountNumber, maskPhone } from '@/lib/format';

const UNKNOWN_CONCERT = '공연 정보 없음';
const UNKNOWN_SESSION = '-';

/** 상세 이미지 목록 정리 — 저장 형식이 어긋난 값은 화면에 넘기지 않는다. */
export function toImageUrlList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
}

export function toConcertView(row: ConcertRow): ConcertView {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    venue: row.venue,
    venueAddress: row.venue_address,
    venueMapUrl: row.venue_map_url,
    posterUrl: row.poster_url,
    description: row.description,
    detailImageUrls: toImageUrlList(row.detail_image_urls),
    priceKrw: row.price_krw,
    maxPerUser: row.max_per_user,
    seatType: row.seat_type,
    status: row.status,
    refundPolicy: row.refund_policy,
    notice: row.notice,
    salesStartAt: row.sales_start_at,
    salesEndAt: row.sales_end_at,
  };
}

export function toSessionView(row: PublicSessionRow): SessionView {
  return {
    id: row.id,
    concertId: row.concert_id,
    name: row.name,
    startAt: row.start_at,
    entryOpenMinutesBefore: row.entry_open_minutes_before,
    remaining: row.remaining,
  };
}

/** 주문·티켓에 곁들일 공연 요약을 한 번에 조회한다. */
export async function loadConcertBriefs(
  client: SupabaseClient,
  ids: string[],
): Promise<Map<string, ConcertBrief>> {
  if (ids.length === 0) return new Map();

  const { data } = await client
    .from('ticket_concerts')
    .select(CONCERT_BRIEF_COLUMNS)
    .in('id', ids)
    .returns<ConcertBrief[]>();

  return new Map((data ?? []).map((row) => [row.id, row]));
}

/** 주문·티켓에 곁들일 회차 요약을 한 번에 조회한다. */
export async function loadSessionBriefs(
  client: SupabaseClient,
  ids: string[],
): Promise<Map<string, SessionBrief>> {
  if (ids.length === 0) return new Map();

  const { data } = await client
    .from('ticket_concert_sessions')
    .select(SESSION_BRIEF_COLUMNS)
    .in('id', ids)
    .returns<SessionBrief[]>();

  return new Map((data ?? []).map((row) => [row.id, row]));
}

export function toOrderSummary(
  row: OrderRow,
  concert: ConcertBrief | undefined,
  session: SessionBrief | undefined,
): OrderSummaryView {
  return {
    id: row.id,
    orderNo: row.order_no,
    status: row.status,
    qty: row.qty,
    amountKrw: row.amount_krw,
    createdAt: row.created_at,
    depositDeadline: row.deposit_deadline,
    depositReportedAt: row.deposit_reported_at,
    reportRejectedAt: row.report_rejected_at,
    holdRejectedAt: row.hold_rejected_at,
    concertId: row.concert_id,
    concertTitle: concert?.title ?? UNKNOWN_CONCERT,
    sessionId: row.session_id,
    sessionName: session?.name ?? UNKNOWN_SESSION,
    sessionStartAt: session?.start_at ?? '',
  };
}

/** 현금영수증 번호는 복호 후 마스킹만 반환한다(원문 비노출). */
export function maskedCashReceiptPhone(row: OrderRow): string | null {
  if (!row.wants_cash_receipt) return null;
  const phone = decryptText(row.cash_receipt_phone_enc);
  return phone ? maskPhone(phone) : null;
}

/** 환불 계좌번호도 복호 후 마스킹만 반환한다(원문 비노출). */
export function maskedRefundAccount(encrypted: string | null): string | null {
  const account = decryptText(encrypted);
  return account ? maskAccountNumber(account) : null;
}

export function toTicketSummary(
  row: TicketRow,
  concert: ConcertBrief | undefined,
  session: SessionBrief | undefined,
): TicketSummaryView {
  return {
    id: row.id,
    code: row.code,
    orderId: row.order_id,
    poolType: row.pool_type,
    status: row.status,
    issuedAt: row.issued_at,
    usedAt: row.used_at,
    concertId: row.concert_id,
    concertTitle: concert?.title ?? UNKNOWN_CONCERT,
    artist: concert?.artist ?? '',
    sessionId: row.session_id,
    sessionName: session?.name ?? UNKNOWN_SESSION,
    sessionStartAt: session?.start_at ?? '',
  };
}

export function toTicketDetail(
  row: TicketRow,
  concert: ConcertBrief | undefined,
  session: SessionBrief | undefined,
): TicketDetailView {
  return {
    ...toTicketSummary(row, concert, session),
    venue: concert?.venue ?? '',
    seatType: concert?.seat_type ?? '',
    entryOpenMinutesBefore: session?.entry_open_minutes_before ?? 0,
  };
}
