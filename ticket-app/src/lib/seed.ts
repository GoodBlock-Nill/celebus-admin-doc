import {
  DEFAULT_ENTRY_OPEN_MINUTES,
  DEMO_REPORT_ELAPSED_HOURS,
  MS_PER_HOUR,
  REPORT_SLA_HOURS,
} from './constants';
import type { TicketDataState } from './store-types';
import type { AppSettings, Concert, ConcertSession, PoolStock, PoolType, TicketReport } from './types';

export const DEMO_USER_ME = 'user-me';
export const DEMO_USER_OTHER = 'user-other';
export const DEMO_CONCERT_ID = 'concert-v01d-showcase';
export const DEMO_SESSION_1 = 'session-1';
export const DEMO_SESSION_2 = 'session-2';

const CONCERT_PRICE_KRW = 55_000;
const MAX_PER_USER = 4;

const POOL_ALLOCATION: Record<PoolType, number> = {
  PAID_SALE: 300,
  CELEBUS_WINNER: 30,
  IX_INVITATION: 50,
  OPERATION_HOLD: 20,
};

const REFUND_POLICY = [
  '취소 요청은 마이티켓에서 접수하며, 접수 후 24시간 이내에 운영자가 환불을 처리합니다.',
  '환불 수수료는 관람일 기준으로 단계별 적용됩니다.',
  '· 관람일 10일 전까지: 수수료 없음',
  '· 관람일 9일 전 ~ 7일 전: 티켓 금액의 10%',
  '· 관람일 6일 전 ~ 3일 전: 티켓 금액의 20%',
  '· 관람일 2일 전 ~ 1일 전: 티켓 금액의 30%',
  '· 관람일 당일 및 공연 시작 이후: 환불 불가',
  '입금 확인 전(입금대기) 주문은 수수료 없이 취소할 수 있습니다.',
].join('\n');

const NOTICE = [
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

function createPools(): Record<PoolType, PoolStock> {
  const toStock = (allocated: number): PoolStock => ({ allocated, reserved: 0, issued: 0 });
  return {
    PAID_SALE: toStock(POOL_ALLOCATION.PAID_SALE),
    CELEBUS_WINNER: toStock(POOL_ALLOCATION.CELEBUS_WINNER),
    IX_INVITATION: toStock(POOL_ALLOCATION.IX_INVITATION),
    OPERATION_HOLD: toStock(POOL_ALLOCATION.OPERATION_HOLD),
  };
}

const SEED_CONCERT: Concert = {
  id: DEMO_CONCERT_ID,
  title: 'V01D 1st SHOWCASE : Dream In Our V01D',
  artist: 'V01D',
  venue: '예스24 라이브홀',
  priceKrw: CONCERT_PRICE_KRW,
  maxPerUser: MAX_PER_USER,
  seatType: '자유석',
  status: 'ON_SALE',
  refundPolicy: REFUND_POLICY,
  notice: NOTICE,
  salesStartAt: '2026-08-20T10:00:00+09:00',
  salesEndAt: '2026-10-14T23:59:59+09:00',
};

const SEED_SESSIONS: ConcertSession[] = [
  {
    id: DEMO_SESSION_1,
    concertId: DEMO_CONCERT_ID,
    name: '1회차 10/15(목) 19:00',
    startAt: '2026-10-15T19:00:00+09:00',
    entryOpenMinutesBefore: DEFAULT_ENTRY_OPEN_MINUTES,
    pools: createPools(),
  },
  {
    id: DEMO_SESSION_2,
    concertId: DEMO_CONCERT_ID,
    name: '2회차 10/16(금) 19:00',
    startAt: '2026-10-16T19:00:00+09:00',
    entryOpenMinutesBefore: DEFAULT_ENTRY_OPEN_MINUTES,
    pools: createPools(),
  },
];

const SEED_SETTINGS: AppSettings = {
  depositDeadlineMode: 'SAME_DAY',
  bankName: '국민은행',
  bankAccount: '123456-04-567890',
  bankHolder: '(주)굿블록',
};

/** 처리 기한 타이머 시연용 신고 1건 (접수 3시간 경과 상태) */
function createDemoReport(nowMs: number): TicketReport {
  const createdMs = nowMs - DEMO_REPORT_ELAPSED_HOURS * MS_PER_HOUR;
  return {
    id: 'report-demo-1',
    targetType: '외부 링크',
    reason: '정가 초과 재판매',
    detail: '중고 거래 게시판에 1회차 티켓을 정가의 3배(165,000원)로 판매한다는 글이 등록되어 있습니다.',
    evidenceUrl: 'https://example.com/board/1234',
    source: '외부 통보',
    createdAt: new Date(createdMs).toISOString(),
    deadlineAt: new Date(createdMs + REPORT_SLA_HOURS * MS_PER_HOUR).toISOString(),
    status: 'RECEIVED',
    actions: [],
  };
}

/** 시드 상태 생성 — 데모 리셋 시에도 동일하게 사용한다. */
export function createSeedState(nowMs: number = Date.now()): TicketDataState {
  return {
    users: [
      { id: DEMO_USER_ME, nickname: '팬A' },
      { id: DEMO_USER_OTHER, nickname: '팬B' },
    ],
    currentUserId: DEMO_USER_ME,
    verifications: [],
    concerts: [SEED_CONCERT],
    sessions: SEED_SESSIONS.map((session) => ({ ...session, pools: createPools() })),
    orders: [],
    tickets: [],
    deposits: [],
    reports: [createDemoReport(nowMs)],
    logs: [],
    settings: { ...SEED_SETTINGS },
    demoOffsetMs: 0,
    orderSeq: 0,
  };
}
