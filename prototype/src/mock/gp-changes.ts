import type { GPChange, GPChangeType } from '@/lib/types';

const NICKNAMES = [
  'starlight', 'pink_blink', 'carat_love', 'dive_in', 'engine_on',
  'wishful', 'my_once', 'kepler_fan', 'love_guys', 'islander',
  'forever_one', 'unit_fan', 'golden_child', 'neverland', 'atinys',
  'stayful', 'once_more', 'mili_fan', 'nctzen', 'bbgirl',
];

// Seeded PRNG to produce deterministic values across SSR and client
function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = createSeededRandom(42);

function randomHex(length: number): string {
  return Array.from({ length }, () => Math.floor(rand() * 16).toString(16)).join('');
}

const WALLETS = Array.from({ length: 20 }, () => `0x${randomHex(40)}`);

const GP_CHANGE_TYPES: GPChangeType[] = ['PARTICIPATION', 'BOOSTING', 'REFUND', 'REWARD', 'EXCHANGE_IN', 'EXCHANGE_OUT', 'REFUND_CANCEL'];

const NOTES_MAP: Record<GPChangeType, string> = {
  PARTICIPATION: '게임 참여',
  BOOSTING: '부스팅 사용',
  REFUND: '참여 GP 환급',
  REWARD: '예측 성공 보상',
  EXCHANGE_IN: 'CELB → GP 교환',
  EXCHANGE_OUT: 'GP → CELB 교환',
  REFUND_CANCEL: '게임 취소 환불',
};

// Fixed reference date to avoid Date.now() hydration mismatch
const REFERENCE_DATE = new Date('2026-02-06T12:00:00+09:00').getTime();

export const mockGPChanges: GPChange[] = Array.from({ length: 160 }, (_, i) => {
  const type = GP_CHANGE_TYPES[Math.floor(rand() * GP_CHANGE_TYPES.length)];
  const isPositive = ['REFUND', 'REWARD', 'EXCHANGE_IN', 'REFUND_CANCEL'].includes(type);
  const baseAmount = [1, 5, 10, 50, 100, 500, 1000][Math.floor(rand() * 7)];
  const amount = isPositive ? baseAmount : -baseAmount;
  const balanceAfter = Math.floor(rand() * 50000) + 100;
  const hasGame = ['PARTICIPATION', 'BOOSTING', 'REFUND', 'REWARD', 'REFUND_CANCEL'].includes(type);
  const hasExchange = ['EXCHANGE_IN', 'EXCHANGE_OUT'].includes(type);

  return {
    id: `GPC${String(i + 1).padStart(6, '0')}`,
    datetime: new Date(REFERENCE_DATE - rand() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    nickname: NICKNAMES[i % NICKNAMES.length] + String(Math.floor(rand() * 100)),
    walletAddress: WALLETS[i % WALLETS.length],
    type,
    amount,
    balanceAfter,
    relatedGameId: hasGame ? `game-${String(Math.floor(rand() * 50) + 1).padStart(3, '0')}` : null,
    relatedGameTitle: hasGame ? 'BTS 컴백 날짜 예측' : null,
    relatedExchangeId: hasExchange ? `EX${String(Math.floor(rand() * 60) + 1).padStart(6, '0')}` : null,
    txid: hasExchange ? `0x${randomHex(64)}` : null,
    notes: type === 'REFUND_CANCEL'
      ? (rand() > 0.5 ? '부스팅 환불' : '참여GP 환불')
      : NOTES_MAP[type],
  };
}).sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
