export interface MultiLangText {
  ko: string;
  en: string;
  jp: string;
}

export type GameStatus = 'Draft' | 'Ready' | 'Active' | 'Pending' | 'Closed' | 'Ended';
export type GameType = 'PREDICTION_MARKET' | 'SURVIVAL_TRIVIA';
export type GPChangeType = 'PARTICIPATION' | 'BOOSTING' | 'REFUND' | 'REWARD' | 'EXCHANGE_IN' | 'EXCHANGE_OUT' | 'REFUND_CANCEL';
export type ExchangeDirection = 'CHARGE' | 'WITHDRAW';
export type ExchangeStatus = 'SUCCESS' | 'FAILED';
export type GameResult = 'YES' | 'NO' | null;

export interface Game {
  id: string;
  type: GameType;
  title: MultiLangText;
  description: MultiLangText;
  hintLinkEnabled: boolean;
  hintLink: string;
  status: GameStatus;
  totalPrizeGP: number;
  maxParticipants: number; // 0 = unlimited
  participationCost: number;
  boostingCost: number;
  boostingMultiplier: number; // 부스팅 배수 (1~10, 기본 2)
  endDate: string; // 투표 종료일시
  resultDate: string;
  resultBasis: MultiLangText;
  result: GameResult;
  resultTitle: MultiLangText; // 결과제목 (다국어, 50자)
  resultDescription: MultiLangText; // 결과설명 (다국어, 500자)
  resultLinkText: MultiLangText; // 결과링크 텍스트 (다국어)
  resultLinkUrl: MultiLangText; // 결과링크 URL (다국어)
  rewardDistributed: boolean;
  rewardDistributedAt: string | null;
  participantCount: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  publishedAt: string | null; // 게시일시 (투표 시작일시로 사용)
}

export interface Participant {
  id: string;
  gameId: string;
  nickname: string;
  uid: string;
  choice: 'YES' | 'NO';
  participationGP: number;
  boostingGP: number;
  status: string;
  participatedAt: string;
  rewardGP: number;
  refundGP: number;
}

export interface Exchange {
  txid: string;
  datetime: string;
  nickname: string;
  walletAddress: string;
  direction: ExchangeDirection;
  gpAmount: number;
  celbAmount: number;
  rate: number;
  gpBefore: number;
  gpAfter: number;
  status: ExchangeStatus;
  failureReason: string | null;
}

export interface GPChange {
  id: string;
  datetime: string;
  nickname: string;
  walletAddress: string;
  txid: string | null;
  type: GPChangeType;
  amount: number;
  balanceAfter: number;
  relatedGameId: string | null;
  relatedGameTitle: string | null;
  relatedExchangeId: string | null;
  notes: string;
}

export interface RankingUser {
  rank: number;
  nickname: string;
  uid: string;
  accumulatedGP: number;
  participationCount: number;
  winRate: number;
  lastParticipation: string;
}


export interface RankingSettings {
  top10Public: boolean;
  rankingBasis: 'ACCUMULATED_GP' | 'WIN_RATE' | 'PARTICIPATION_COUNT';
  updateFrequency: 'REALTIME' | '1_HOUR' | '1_DAY';
  minParticipationCount: number;
}

export interface ExchangeSettings {
  gpToCelbRate: number;
  celbToGpRate: number;
  chargeMinCelb: number;
  chargeMaxCelb: number;
  chargeDailyLimitCelb: number;
  chargeDailyLimitCount: number; // 일일 충전 제한 횟수
  withdrawMinGP: number;
  withdrawMaxGP: number;
  withdrawDailyLimitGP: number;
  withdrawDailyLimitCount: number; // 일일 출금 제한 횟수
  chargeEnabled: boolean;
  withdrawEnabled: boolean;
}

export interface OperationWallet {
  id: string;
  type: 'CHARGE' | 'WITHDRAW';
  address: string;
  privateKey?: string; // PK (마스킹된 값, 예: "5a8f...3b2c")
  balance: number; // CELB 잔액
  bnbBalance?: number; // BNB 잔액 (전체 지갑)
  isActive: boolean;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Column<T> {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

export interface FilterOption {
  value: string;
  label: string;
}
