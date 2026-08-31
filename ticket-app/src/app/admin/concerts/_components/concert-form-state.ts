/**
 * 공연 등록 폼의 입력 상태 · 기본값 · 검증 규칙.
 * 화면은 문자열만 다루고, 서버로 보내기 직전에 숫자·일시로 변환한다.
 */

import { MAX_DESCRIPTION_LENGTH, MAX_DETAIL_IMAGE_COUNT } from './concert-image-rules';
import type { ConcertCreateInput } from '@/lib/admin-types';
import type { PoolType, SeatType } from '@/lib/api-types';
import { DEFAULT_ENTRY_OPEN_MINUTES } from '@/lib/constants';

/** 회차 기본 배정 — 유상 판매 300 / 당첨자 30 / 초대 50 / 운영 보류 20 */
export const DEFAULT_POOLS: Record<PoolType, string> = {
  PAID_SALE: '300',
  CELEBUS_WINNER: '30',
  IX_INVITATION: '50',
  OPERATION_HOLD: '20',
};

export const DEFAULT_MAX_PER_USER = '4';
export const MIN_MAX_PER_USER = 1;
export const MAX_MAX_PER_USER = 10;
export const MAX_SESSION_COUNT = 20;
export const MAX_VENUE_ADDRESS_LENGTH = 200;
export const MAX_VENUE_MAP_URL_LENGTH = 500;

/** 지도 링크는 새 창으로 여는 웹 주소만 허용한다. */
const WEB_URL_PATTERN = /^https?:\/\/\S+$/;

/** 입력 일시는 한국 시각 벽시계로 받고, 전송 시 오프셋을 붙인다. */
const KST_OFFSET_SUFFIX = '+09:00';
const LOCAL_DATETIME_LENGTH = 16;

export interface SessionDraft {
  /** 목록 렌더링·삭제용 내부 식별자 */
  key: string;
  name: string;
  /** 브라우저 일시 입력 값 (2026-10-15T19:00) */
  startAt: string;
  entryOpenMinutesBefore: string;
  pools: Record<PoolType, string>;
}

export interface ConcertDraft {
  title: string;
  artist: string;
  venue: string;
  /** 공연장 도로명 주소 (선택 입력) */
  venueAddress: string;
  /** 지도 링크 (선택 입력) */
  venueMapUrl: string;
  /** 포스터 이미지 주소 — 업로드에 성공하면 채워지는 필수 항목 */
  posterUrl: string;
  /** 공연 소개 (선택 입력) */
  description: string;
  /** 상세 이미지 주소 목록 — 화면에 보이는 순서가 곧 앱 노출 순서다 (선택 입력) */
  detailImageUrls: string[];
  priceKrw: string;
  maxPerUser: string;
  seatType: SeatType;
  salesStartAt: string;
  salesEndAt: string;
  refundPolicy: string;
  notice: string;
  sessions: SessionDraft[];
}

/** 문자열로 다루는 단일 입력 항목 이름 (좌석 방식·회차·상세 이미지 목록은 별도 처리) */
export type ConcertField = Exclude<keyof ConcertDraft, 'sessions' | 'seatType' | 'detailImageUrls'>;

/** 필드 이름 → 검증 실패 사유 (회차 항목은 `${회차키}:${항목}` 형태) */
export type FieldErrors = Record<string, string>;

export const DEFAULT_REFUND_POLICY = [
  '취소 요청은 마이티켓에서 접수하며, 접수 후 24시간 이내에 운영자가 환불을 처리합니다.',
  '환불 수수료는 관람일 기준으로 단계별 적용됩니다.',
  '· 관람일 10일 전까지: 수수료 없음',
  '· 관람일 9일 전 ~ 7일 전: 티켓 금액의 10%',
  '· 관람일 6일 전 ~ 3일 전: 티켓 금액의 20%',
  '· 관람일 2일 전 ~ 1일 전: 티켓 금액의 30%',
  '· 관람일 당일 및 공연 시작 이후: 환불 불가',
  '입금 확인 전(입금대기) 주문은 수수료 없이 취소할 수 있습니다.',
].join('\n');

export const DEFAULT_NOTICE = [
  '[입금 안내]',
  '· 주문 후 안내되는 계좌로 입금 마감 시각까지 입금해 주세요.',
  '· 입금자명은 본인확인 실명과 반드시 일치해야 하며, 동명이인 등으로 확인이 어려운 경우 실명 뒤에 주문번호 끝 4자리를 붙여 입금해 주세요.',
  '· 마감 시각까지 입금이 확인되지 않으면 주문은 자동 취소되고 좌석이 반환됩니다.',
  '',
  '[양도·재판매 금지]',
  '· 본 티켓은 본인 확인 후 발급되는 실명 티켓으로, 타인에게 양도하거나 웃돈을 받고 재판매할 수 없습니다.',
  '· 재판매·양도 정황이 확인되면 티켓은 사전 통보 없이 무효 처리되며, 향후 예매가 제한될 수 있습니다.',
  '· 부정 거래 게시물을 발견하면 앱 내 신고 기능으로 알려 주세요.',
].join('\n');

export function createSessionDraft(index: number): SessionDraft {
  return {
    key: `session-${index}-${Date.now()}`,
    name: `${index}회차`,
    startAt: '',
    entryOpenMinutesBefore: String(DEFAULT_ENTRY_OPEN_MINUTES),
    pools: { ...DEFAULT_POOLS },
  };
}

export function createConcertDraft(): ConcertDraft {
  return {
    title: '',
    artist: '',
    venue: '',
    venueAddress: '',
    venueMapUrl: '',
    posterUrl: '',
    description: '',
    detailImageUrls: [],
    priceKrw: '',
    maxPerUser: DEFAULT_MAX_PER_USER,
    seatType: '자유석',
    salesStartAt: '',
    salesEndAt: '',
    refundPolicy: DEFAULT_REFUND_POLICY,
    notice: DEFAULT_NOTICE,
    sessions: [createSessionDraft(1)],
  };
}

/** 한국 시각 벽시계 입력을 오프셋 포함 일시 문자열로 변환 */
export function toKstIso(localValue: string): string {
  const filled = localValue.length === LOCAL_DATETIME_LENGTH ? `${localValue}:00` : localValue;
  return `${filled}${KST_OFFSET_SUFFIX}`;
}

function toTime(localValue: string): number {
  return new Date(toKstIso(localValue)).getTime();
}

/** 문자열 입력을 0 이상 정수로 읽는다 (빈 값·형식 오류는 null) */
function toCount(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

export function sessionTotal(session: SessionDraft): number {
  return Object.values(session.pools).reduce((sum, value) => sum + (toCount(value) ?? 0), 0);
}

export function draftTotal(draft: ConcertDraft): number {
  return draft.sessions.reduce((sum, session) => sum + sessionTotal(session), 0);
}

function validateSessions(draft: ConcertDraft, errors: FieldErrors): void {
  draft.sessions.forEach((session) => {
    if (session.name.trim() === '') errors[`${session.key}:name`] = '회차 이름을 입력해 주세요.';
    if (session.startAt === '') errors[`${session.key}:startAt`] = '공연 일시를 입력해 주세요.';

    const entryMinutes = toCount(session.entryOpenMinutesBefore);
    if (entryMinutes === null) {
      errors[`${session.key}:entry`] = '입장 오픈 기준을 0분 이상으로 입력해 주세요.';
    }

    const invalidPool = Object.entries(session.pools).find(([, value]) => toCount(value) === null);
    if (invalidPool) errors[`${session.key}:pools`] = '배정 수량은 0 이상 숫자로 입력해 주세요.';
  });
}

/** 공연장 주소·지도 링크는 선택 입력이므로 값이 있을 때만 형식을 본다. */
function validateVenueDetail(draft: ConcertDraft, errors: FieldErrors): void {
  const address = draft.venueAddress.trim();
  if (address.length > MAX_VENUE_ADDRESS_LENGTH) {
    errors.venueAddress = `공연장 주소는 ${MAX_VENUE_ADDRESS_LENGTH}자 이내로 입력해 주세요.`;
  }

  const mapUrl = draft.venueMapUrl.trim();
  if (mapUrl === '') return;
  if (mapUrl.length > MAX_VENUE_MAP_URL_LENGTH) {
    errors.venueMapUrl = `지도 링크는 ${MAX_VENUE_MAP_URL_LENGTH}자 이내로 입력해 주세요.`;
    return;
  }
  if (!WEB_URL_PATTERN.test(mapUrl)) {
    errors.venueMapUrl = '지도 링크는 http로 시작하는 주소로 입력해 주세요.';
  }
}

/** 포스터는 필수, 공연 소개·상세 이미지는 선택이라 값이 있을 때만 상한을 본다. */
function validateMedia(draft: ConcertDraft, errors: FieldErrors): void {
  if (draft.posterUrl === '') {
    errors.posterUrl = '포스터 이미지를 등록해 주세요.';
  }
  if (draft.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `공연 소개는 ${MAX_DESCRIPTION_LENGTH.toLocaleString('ko-KR')}자 이내로 입력해 주세요.`;
  }
  if (draft.detailImageUrls.length > MAX_DETAIL_IMAGE_COUNT) {
    errors.detailImageUrls = `상세 이미지는 최대 ${MAX_DETAIL_IMAGE_COUNT}장까지 등록할 수 있습니다.`;
  }
}

/** 전송 전 검증 — 비어 있는 결과는 통과를 뜻한다. */
export function validateDraft(draft: ConcertDraft): FieldErrors {
  const errors: FieldErrors = {};

  if (draft.title.trim() === '') errors.title = '공연 타이틀을 입력해 주세요.';
  if (draft.artist.trim() === '') errors.artist = '아티스트명을 입력해 주세요.';
  if (draft.venue.trim() === '') errors.venue = '공연장을 입력해 주세요.';
  validateVenueDetail(draft, errors);
  validateMedia(draft, errors);

  const price = toCount(draft.priceKrw);
  if (price === null || price <= 0) errors.priceKrw = '티켓 가격을 1원 이상으로 입력해 주세요.';

  const maxPerUser = toCount(draft.maxPerUser);
  if (maxPerUser === null || maxPerUser < MIN_MAX_PER_USER || maxPerUser > MAX_MAX_PER_USER) {
    errors.maxPerUser = `1인 예매 한도는 ${MIN_MAX_PER_USER}~${MAX_MAX_PER_USER}매 사이로 입력해 주세요.`;
  }

  if (draft.salesStartAt === '') errors.salesStartAt = '판매 시작 일시를 입력해 주세요.';
  if (draft.salesEndAt === '') errors.salesEndAt = '판매 종료 일시를 입력해 주세요.';
  if (draft.salesStartAt !== '' && draft.salesEndAt !== '') {
    if (toTime(draft.salesStartAt) >= toTime(draft.salesEndAt)) {
      errors.salesEndAt = '판매 종료 일시는 시작 일시보다 뒤여야 합니다.';
    }
  }

  validateSessions(draft, errors);
  return errors;
}

/** 검증을 통과한 입력을 서버 전송 형태로 변환 */
export function toCreateInput(draft: ConcertDraft): ConcertCreateInput {
  const venueAddress = draft.venueAddress.trim();
  const venueMapUrl = draft.venueMapUrl.trim();
  const description = draft.description.trim();

  return {
    title: draft.title.trim(),
    artist: draft.artist.trim(),
    venue: draft.venue.trim(),
    venueAddress: venueAddress === '' ? undefined : venueAddress,
    venueMapUrl: venueMapUrl === '' ? undefined : venueMapUrl,
    posterUrl: draft.posterUrl,
    description: description === '' ? undefined : description,
    detailImageUrls: draft.detailImageUrls.length === 0 ? undefined : [...draft.detailImageUrls],
    priceKrw: Number(draft.priceKrw),
    maxPerUser: Number(draft.maxPerUser),
    seatType: draft.seatType,
    refundPolicy: draft.refundPolicy,
    notice: draft.notice,
    salesStartAt: toKstIso(draft.salesStartAt),
    salesEndAt: toKstIso(draft.salesEndAt),
    sessions: draft.sessions.map((session) => ({
      name: session.name.trim(),
      startAt: toKstIso(session.startAt),
      entryOpenMinutesBefore: Number(session.entryOpenMinutesBefore),
      pools: {
        PAID_SALE: Number(session.pools.PAID_SALE),
        CELEBUS_WINNER: Number(session.pools.CELEBUS_WINNER),
        IX_INVITATION: Number(session.pools.IX_INVITATION),
        OPERATION_HOLD: Number(session.pools.OPERATION_HOLD),
      },
    })),
  };
}
