import type { GameStatus, GPChangeType, ExchangeDirection, ExchangeStatus } from './types';

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

export const GAME_TYPE_LABELS: Record<string, string> = {
  PREDICTION_MARKET: 'Prediction Market',
  SURVIVAL_TRIVIA: 'Survival Trivia',
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
};
