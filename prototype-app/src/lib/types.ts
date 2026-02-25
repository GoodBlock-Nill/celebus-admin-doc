export interface MultiLangText {
  ko: string;
  en: string;
  jp: string;
}

// Game
export type GameStatus = 'Draft' | 'Ready' | 'Active' | 'Pending' | 'Closed' | 'Ended';
export type GameType = 'PREDICTION_MARKET' | 'SURVIVAL_TRIVIA';
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
  maxParticipants: number;
  participationCost: number;
  boostingCost: number;
  boostingMultiplier: number;
  endDate: string;
  resultDate: string;
  resultBasis: MultiLangText;
  result: GameResult;
  resultTitle: MultiLangText;
  resultDescription: MultiLangText;
  resultLinkText: MultiLangText;
  resultLinkUrl: MultiLangText;
  rewardDistributed: boolean;
  rewardDistributedAt: string | null;
  participantCount: number;
  yesCount: number;
  noCount: number;
  createdAt: string;
  publishedAt: string | null;
}

// User participation
export type UserParticipationStatus = 'NONE' | 'PARTICIPATED' | 'BOOSTED';

export interface UserParticipation {
  gameId: string;
  choice: 'YES' | 'NO';
  participationGP: number;
  boostingGP: number;
  status: UserParticipationStatus;
  rewardGP: number;
  refundGP: number;
  participatedAt: string;
}

// GP
export type GPChangeType = 'PARTICIPATION' | 'BOOSTING' | 'REFUND' | 'REWARD' | 'EXCHANGE_IN' | 'EXCHANGE_OUT' | 'REFUND_CANCEL';

export interface GPChange {
  id: string;
  datetime: string;
  type: GPChangeType;
  amount: number;
  balanceAfter: number;
  relatedGameId: string | null;
  relatedGameTitle: string | null;
  relatedExchangeId: string | null;
  notes: string;
  gameType?: GameType;
}

// Exchange
export type ExchangeDirection = 'CHARGE' | 'WITHDRAW';
export type ExchangeStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface Exchange {
  txid: string;
  datetime: string;
  direction: ExchangeDirection;
  gpAmount: number;
  celbAmount: number;
  rate: number;
  gpBefore: number;
  gpAfter: number;
  status: ExchangeStatus;
  walletAddress: string;
  failureReason: string | null;
}

// Ranking
export interface RankingUser {
  rank: number;
  nickname: string;
  uid: string;
  profileImage: string;
  accumulatedGP: number;
  participationCount: number;
  winRate: number;
  lastParticipation: string;
  pmAccumulatedGP: number;
  pmParticipationCount: number;
  pmWinRate: number;
  stAccumulatedGP: number;
  stParticipationCount: number;
  stWinRate: number;
}

// Trivia
export type TriviaStatus = 'SCHEDULED' | 'ONBOARDING' | 'LIVE' | 'ENDED' | 'NO_SCHEDULE';

export interface TriviaGame {
  id: string;
  title: MultiLangText;
  description: MultiLangText;
  status: TriviaStatus;
  scheduledAt: string;
  totalPrizeGP: number;
  participationCost: number;
  maxParticipants: number;
  participantCount: number;
  questionCount: number;
  timePerQuestion: number;
  currentQuestion: number;
  survivorCount: number;
}

export interface TriviaQuestion {
  id: string;
  questionNumber: number;
  text: MultiLangText;
  choices: MultiLangText[];
  correctIndex: number;
  timeLimit: number;
}

export type TriviaResultType = 'A' | 'B' | 'C' | 'D';

export interface TriviaResult {
  type: TriviaResultType;
  rewardGP: number;
  correctCount: number;
  totalQuestions: number;
  finalRank: number;
  totalParticipants: number;
  survivorCount: number;
}

// User
export interface User {
  uid: string;
  nickname: string;
  profileImage: string;
  gpBalance: number;
  celbBalance: number;
  hearts: number;
}

// Exchange Settings (from backoffice)
export interface ExchangeConfig {
  gpToCelbRate: number;
  celbToGpRate: number;
  chargeMinCelb: number;
  chargeMaxCelb: number;
  chargeDailyLimitCelb: number;
  chargeDailyLimitCount: number;
  withdrawMinGP: number;
  withdrawMaxGP: number;
  withdrawDailyLimitGP: number;
  withdrawDailyLimitCount: number;
  chargeEnabled: boolean;
  withdrawEnabled: boolean;
  depositAddress: string;
}
