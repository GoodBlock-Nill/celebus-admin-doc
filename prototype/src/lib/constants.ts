import type { GameStatus, GameType, GPChangeType, ExchangeDirection, ExchangeStatus } from './types';
import type { QuestStatus, RaffleStatus, SubmissionStatus, RewardType, DeliveryType } from './fq-types';

export const GAME_STATUS_CONFIG: Record<GameStatus, { label: string; bg: string; text: string }> = {
  Draft: { label: '임시저장', bg: 'bg-gray-100', text: 'text-gray-600' },
  Ready: { label: '게시대기', bg: 'bg-blue-100', text: 'text-blue-600' },
  Active: { label: '진행중', bg: 'bg-green-100', text: 'text-green-600' },
  Pending: { label: '결과대기', bg: 'bg-orange-100', text: 'text-orange-600' },
  Closed: { label: '결과확정', bg: 'bg-purple-100', text: 'text-purple-600' },
  Ended: { label: '종료', bg: 'bg-gray-800', text: 'text-white' },
};

export const GP_TYPE_CONFIG: Record<GPChangeType, { label: string; bg: string; text: string }> = {
  PARTICIPATION: { label: '참여', bg: 'bg-blue-100', text: 'text-blue-600' },
  BOOSTING: { label: '부스팅', bg: 'bg-purple-100', text: 'text-purple-600' },
  REFUND: { label: '환급', bg: 'bg-green-100', text: 'text-green-600' },
  REWARD: { label: '보상', bg: 'bg-amber-100', text: 'text-amber-700' },
  EXCHANGE_IN: { label: 'GP 가져오기', bg: 'bg-cyan-100', text: 'text-cyan-600' },
  EXCHANGE_OUT: { label: 'CELB으로 보내기', bg: 'bg-orange-100', text: 'text-orange-600' },
  REFUND_CANCEL: { label: '환불', bg: 'bg-red-100', text: 'text-red-600' },
};

export const EXCHANGE_DIRECTION_CONFIG: Record<ExchangeDirection, { label: string; bg: string; text: string }> = {
  CHARGE: { label: 'GP 가져오기', bg: 'bg-blue-100', text: 'text-blue-600' },
  WITHDRAW: { label: 'CELB으로 보내기', bg: 'bg-orange-100', text: 'text-orange-600' },
};

export const EXCHANGE_STATUS_CONFIG: Record<ExchangeStatus, { label: string; bg: string; text: string }> = {
  SUCCESS: { label: '성공', bg: 'bg-green-100', text: 'text-green-600' },
  FAILED: { label: '실패', bg: 'bg-red-100', text: 'text-red-600' },
};

export const GAME_STATUS_ACTIONS: Record<GameStatus, string[]> = {
  Draft: ['delete', 'edit'],
  Ready: ['delete', 'edit', 'publish'],
  Active: ['edit', 'forceClose'],
  Pending: ['edit', 'inputResult', 'forceClose'],
  Closed: ['editResult', 'distributeReward'],
  Ended: [],
};

export const GAME_STATUS_ACTIONS_ST: Record<string, string[]> = {
  Draft: ['delete', 'edit'],
  Ready: ['delete', 'edit', 'publish'],
  Active: ['edit', 'forceClose'],
  Closed: [],
  Ended: [],
};

export const GAME_TYPE_LABELS: Record<string, string> = {
  PREDICTION_MARKET: 'Prediction Market',
  SURVIVAL_TRIVIA: 'Survival Trivia',
};

export const GAME_TYPE_BADGE_CONFIG: Record<GameType, { label: string; bg: string; text: string }> = {
  PREDICTION_MARKET: { label: 'PM', bg: 'bg-indigo-100', text: 'text-indigo-600' },
  SURVIVAL_TRIVIA: { label: 'ST', bg: 'bg-purple-100', text: 'text-purple-600' },
};

export const ST_STATUSES: GameStatus[] = ['Draft', 'Ready', 'Active', 'Ended'];

export const ST_REVEAL_DURATION_SEC = 5;

// --- Fan Quest constants ---

export const QUEST_STATUS_CONFIG: Record<QuestStatus, { label: string; bg: string; text: string }> = {
  Draft: { label: '임시저장', bg: 'bg-gray-100', text: 'text-gray-600' },
  Active: { label: '진행중', bg: 'bg-green-100', text: 'text-green-600' },
  Ended: { label: '종료', bg: 'bg-gray-800', text: 'text-white' },
};

export const RAFFLE_STATUS_CONFIG: Record<RaffleStatus, { label: string; bg: string; text: string }> = {
  Draft: { label: '임시저장', bg: 'bg-gray-100', text: 'text-gray-600' },
  Active: { label: '진행중', bg: 'bg-green-100', text: 'text-green-600' },
  Closed: { label: '마감', bg: 'bg-purple-100', text: 'text-purple-600' },
  Ended: { label: '종료', bg: 'bg-gray-800', text: 'text-white' },
};

export const SUBMISSION_STATUS_CONFIG: Record<SubmissionStatus, { label: string; bg: string; text: string }> = {
  Pending: { label: '대기', bg: 'bg-orange-100', text: 'text-orange-600' },
  Approved: { label: '승인', bg: 'bg-green-100', text: 'text-green-600' },
  Rejected: { label: '반려', bg: 'bg-red-100', text: 'text-red-600' },
};

export const REWARD_TYPE_CONFIG: Record<RewardType, { label: string; bg: string; text: string }> = {
  TICKET: { label: '응모권', bg: 'bg-blue-100', text: 'text-blue-600' },
  TICKET_NFT: { label: '응모권+NFT', bg: 'bg-indigo-100', text: 'text-indigo-600' },
  NFT: { label: 'NFT', bg: 'bg-purple-100', text: 'text-purple-600' },
};

export const DELIVERY_TYPE_CONFIG: Record<DeliveryType, { label: string; bg: string; text: string }> = {
  DELIVERY: { label: '배송', bg: 'bg-blue-100', text: 'text-blue-600' },
  ONSITE: { label: '현장 수령', bg: 'bg-amber-100', text: 'text-amber-700' },
  ONLINE: { label: '온라인', bg: 'bg-cyan-100', text: 'text-cyan-600' },
};

export const QUEST_STATUS_ACTIONS: Record<QuestStatus, string[]> = {
  Draft: ['delete', 'edit', 'publish'],
  Active: ['edit', 'close'],
  Ended: [],
};

export const ITEMS_PER_PAGE = 20;
export const RANKING_ITEMS_PER_PAGE = 50;

export const BREADCRUMB_MAP: Record<string, string> = {
  '/game-zone': '게임존',
  '/game-zone/games': '게임 관리',
  '/game-zone/games/create': '게임 생성',
  '/game-zone/ranking': '랭킹',
  '/game-zone/ranking/settings': '랭킹 설정',
  '/game-zone/exchange': 'GP 교환소',
  '/game-zone/exchange/settings': '교환 설정',
  '/game-zone/exchange/wallets': '지갑 관리',
  '/game-zone/gp-history': 'GP 변동 내역',
  '/fan-quest': '팬퀘스트',
  '/fan-quest/quests': '퀘스트 관리',
  '/fan-quest/quests/create': '퀘스트 생성',
  '/fan-quest/raffles': '래플 관리',
  '/fan-quest/raffles/create': '래플 생성',
  '/fan-quest/rejection-reasons': '반려 사유 관리',
};
