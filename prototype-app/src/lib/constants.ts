import type { GameStatus, GPChangeType, ExchangeDirection, ExchangeStatus, TriviaStatus, TriviaResultType } from './types';

export const GAME_STATUS_CONFIG: Record<GameStatus, { label: string; bg: string; text: string }> = {
  Draft: { label: '임시저장', bg: 'bg-gray-100', text: 'text-gray-600' },
  Ready: { label: '게시대기', bg: 'bg-blue-100', text: 'text-blue-600' },
  Active: { label: '진행중', bg: 'bg-green-100', text: 'text-green-600' },
  Pending: { label: '결과대기', bg: 'bg-orange-100', text: 'text-orange-600' },
  Closed: { label: '결과확정', bg: 'bg-purple-100', text: 'text-purple-600' },
  Ended: { label: '종료', bg: 'bg-gray-800', text: 'text-white' },
};

export const GP_TYPE_CONFIG: Record<GPChangeType, { label: string; bg: string; text: string; sign: '+' | '-' }> = {
  PARTICIPATION: { label: '참여', bg: 'bg-blue-100', text: 'text-blue-600', sign: '-' },
  BOOSTING: { label: '부스팅', bg: 'bg-purple-100', text: 'text-purple-600', sign: '-' },
  REFUND: { label: '환급', bg: 'bg-green-100', text: 'text-green-600', sign: '+' },
  REWARD: { label: '보상', bg: 'bg-amber-100', text: 'text-amber-700', sign: '+' },
  EXCHANGE_IN: { label: 'GP 가져오기', bg: 'bg-cyan-100', text: 'text-cyan-600', sign: '+' },
  EXCHANGE_OUT: { label: 'CELB으로 보내기', bg: 'bg-orange-100', text: 'text-orange-600', sign: '-' },
  REFUND_CANCEL: { label: '환불', bg: 'bg-red-100', text: 'text-red-600', sign: '+' },
};

export const EXCHANGE_DIRECTION_CONFIG: Record<ExchangeDirection, { label: string; bg: string; text: string }> = {
  CHARGE: { label: 'GP 가져오기', bg: 'bg-blue-100', text: 'text-blue-600' },
  WITHDRAW: { label: 'CELB으로 보내기', bg: 'bg-orange-100', text: 'text-orange-600' },
};

export const EXCHANGE_STATUS_CONFIG: Record<ExchangeStatus, { label: string; bg: string; text: string }> = {
  PENDING: { label: '처리중', bg: 'bg-yellow-100', text: 'text-yellow-600' },
  SUCCESS: { label: '성공', bg: 'bg-green-100', text: 'text-green-600' },
  FAILED: { label: '실패', bg: 'bg-red-100', text: 'text-red-600' },
};

export const TRIVIA_STATUS_CONFIG: Record<TriviaStatus, { label: string; bg: string; text: string }> = {
  SCHEDULED: { label: '예정', bg: 'bg-blue-100', text: 'text-blue-600' },
  ONBOARDING: { label: '입장 중', bg: 'bg-amber-100', text: 'text-amber-700' },
  LIVE: { label: 'LIVE', bg: 'bg-red-100', text: 'text-red-600' },
  ENDED: { label: '종료', bg: 'bg-gray-100', text: 'text-gray-600' },
  NO_SCHEDULE: { label: '일정 없음', bg: 'bg-gray-100', text: 'text-gray-500' },
};

export const TRIVIA_RESULT_CONFIG: Record<TriviaResultType, { title: string; subtitle: string; emoji: string }> = {
  A: { title: '완벽한 승리!', subtitle: '모든 문제를 맞추셨습니다', emoji: '🏆' },
  B: { title: '생존 성공!', subtitle: '끝까지 살아남았습니다', emoji: '🎉' },
  C: { title: '관전 완료', subtitle: '끝까지 지켜봐 주셨습니다', emoji: '👏' },
  D: { title: '아쉽네요', subtitle: '다음 게임에서 도전하세요', emoji: '💪' },
};

export const GAME_TYPE_LABELS: Record<string, string> = {
  PREDICTION_MARKET: 'Prediction Market',
  SURVIVAL_TRIVIA: 'Survival Trivia',
};

export const ITEMS_PER_PAGE = 20;

export const TAB_ITEMS = [
  { key: 'home', label: '홈', href: '/home', icon: 'home' },
  { key: 'ranking', label: '랭킹', href: '/ranking', icon: 'trophy' },
  { key: 'exchange', label: '교환소', href: '/exchange', icon: 'arrows-right-left' },
  { key: 'history', label: '내역', href: '/history', icon: 'clock' },
] as const;
