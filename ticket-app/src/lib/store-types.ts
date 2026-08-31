import type {
  ActivityLog,
  AppSettings,
  CheckInResult,
  Concert,
  ConcertSession,
  DemoUser,
  DepositRecord,
  IdentityVerification,
  Order,
  PoolType,
  TicketReport,
  Ticket,
} from './types';

/** 액션 공통 결과 — 실패 시 사용자에게 보여줄 한국어 사유를 담는다. */
export type ActionResult = { ok: true } | { ok: false; reason: string };

/** 무료 배정 풀(유상 판매 외) */
export type CompPoolType = Exclude<PoolType, 'PAID_SALE'>;

/** 신고 처리 액션 종류 */
export type ReportActionType = '노출 차단' | '수사기관 제출' | '계정 제재' | '티켓 무효화' | '종결';

export interface VerifyIdentityInput {
  realName: string;
  birth: string;
  phone: string;
}

export interface CreateOrderInput {
  concertId: string;
  sessionId: string;
  qty: number;
  wantsCashReceipt: boolean;
  cashReceiptPhone?: string;
}

export interface AddDepositInput {
  depositorName: string;
  amountKrw: number;
}

export interface IssueCompTicketsInput {
  sessionId: string;
  poolType: CompPoolType;
  userId: string;
  qty: number;
  reason: string;
}

export interface SubmitReportInput {
  targetType: TicketReport['targetType'];
  reason: string;
  detail: string;
  evidenceUrl?: string;
  source: TicketReport['source'];
}

/** localStorage에 보존되는 데이터 영역 */
export interface TicketDataState {
  users: DemoUser[];
  currentUserId: string;
  verifications: IdentityVerification[];
  concerts: Concert[];
  sessions: ConcertSession[];
  orders: Order[];
  tickets: Ticket[];
  deposits: DepositRecord[];
  reports: TicketReport[];
  logs: ActivityLog[];
  settings: AppSettings;
  demoOffsetMs: number;
  orderSeq: number;
}

/** 스토어가 노출하는 액션 목록 */
export interface TicketActions {
  now: () => Date;
  advanceTime: (ms: number) => void;
  resetTime: () => void;
  switchUser: (userId: string) => void;
  resetDemo: () => void;

  verifyIdentity: (input: VerifyIdentityInput) => { ok: true } | { ok: false; reason: '중복' };

  createOrder: (input: CreateOrderInput) => { ok: true; order: Order } | { ok: false; reason: string };
  expireOverdueOrders: () => void;
  requestCancel: (orderId: string) => ActionResult;
  cancelAwaitingOrder: (orderId: string) => ActionResult;
  approveRefund: (orderId: string) => ActionResult;

  addDeposit: (input: AddDepositInput) => { ok: true; deposit: DepositRecord } | { ok: false; reason: string };
  confirmDeposit: (depositId: string) => ActionResult;
  holdDeposit: (depositId: string, memo: string) => ActionResult;
  markRefundTarget: (depositId: string, memo: string) => ActionResult;
  refundDeposit: (depositId: string) => ActionResult;
  manualMatch: (depositId: string, orderId: string) => ActionResult;

  issueCompTickets: (input: IssueCompTicketsInput) => ActionResult;
  reallocatePool: (sessionId: string, from: PoolType, to: PoolType, qty: number) => ActionResult;
  checkInTicket: (code: string) => CheckInResult;

  submitReport: (input: SubmitReportInput) => { ok: true; report: TicketReport };
  actOnReport: (reportId: string, actionType: ReportActionType) => ActionResult;
}

export type TicketStore = TicketDataState & TicketActions;

/** 슬라이스에 전달되는 zustand set/get 시그니처 */
export type StoreSet = (updater: (state: TicketStore) => Partial<TicketStore>) => void;
export type StoreGet = () => TicketStore;
