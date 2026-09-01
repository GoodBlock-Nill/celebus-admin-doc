/**
 * 공연·회차·배정 관련 관리자 화면 타입.
 * 회원·입금·환불 타입과 쓰임이 나뉘어 파일을 분리하고, `admin-types`에서 함께 내보낸다.
 */

import type { ConcertStatus, PoolType, SeatType } from './api-types';

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
  /** 공연 취소 시 일괄 처리 대상이 되는 진행중 예매 건수 (확인 다이얼로그 예고 문구용) */
  activeOrderCount: number;
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

/**
 * 운영자가 판매 상태 액션으로 지정할 수 있는 값.
 * 판매 예정으로 되돌리는 전이는 없고, 공연 취소는 일괄 환불이 따르는 별도 액션이라 제외한다.
 */
export type ConcertStatusTransition = Exclude<ConcertStatus, 'UPCOMING' | 'CANCELED'>;

/** 공연장 검색 결과 1건 — 이름·주소는 검색 서비스 표기를 그대로 쓴다. */
export interface VenueSearchItemView {
  name: string;
  roadAddress: string;
  address: string;
  mapUrl: string;
}
