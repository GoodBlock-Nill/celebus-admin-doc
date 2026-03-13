import type { GPChange, GPChangeType, GameType } from '@/lib/types';

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

const ST_GAME_TITLES = ['아이돌 생존 퀴즈', 'K-pop 트리비아 챌린지', '팬덤 지식 대결'];

export const mockGPChanges: GPChange[] = Array.from({ length: 160 }, (_, i) => {
  // Determine initial type
  let type: GPChangeType = GP_CHANGE_TYPES[Math.floor(rand() * GP_CHANGE_TYPES.length)];
  const hasGame = ['PARTICIPATION', 'BOOSTING', 'REFUND', 'REWARD', 'REFUND_CANCEL'].includes(type);
  const hasExchange = ['EXCHANGE_IN', 'EXCHANGE_OUT'].includes(type);

  // Assign relatedGameType for game-related entries (~70% PM, ~30% ST)
  let relatedGameType: GameType | undefined = undefined;
  if (hasGame) {
    relatedGameType = rand() < 0.7 ? 'PREDICTION_MARKET' : 'SURVIVAL_TRIVIA';
  }

  // ST-specific: BOOSTING and REFUND are not applicable for ST — re-roll to PARTICIPATION or REWARD
  if (relatedGameType === 'SURVIVAL_TRIVIA' && (type === 'BOOSTING' || type === 'REFUND')) {
    type = rand() > 0.5 ? 'PARTICIPATION' : 'REWARD';
  }

  const isPositive = ['REFUND', 'REWARD', 'EXCHANGE_IN', 'REFUND_CANCEL'].includes(type);
  const baseAmount = [1, 5, 10, 50, 100, 500, 1000][Math.floor(rand() * 7)];
  const amount = isPositive ? baseAmount : -baseAmount;
  const balanceAfter = Math.floor(rand() * 50000) + 100;

  // Determine notes
  let notes: string;
  if (type === 'REFUND_CANCEL') {
    // ST has no boosting so only '참여GP 환불'
    notes = relatedGameType === 'SURVIVAL_TRIVIA'
      ? '참여GP 환불'
      : (rand() > 0.5 ? '부스팅 환불' : '참여GP 환불');
  } else if (relatedGameType === 'SURVIVAL_TRIVIA') {
    if (type === 'PARTICIPATION') notes = '트리비아 참여';
    else if (type === 'REWARD') notes = '생존 보상';
    else notes = NOTES_MAP[type];
  } else {
    notes = NOTES_MAP[type];
  }

  // Determine game title based on game type
  const relatedGameTitle = hasGame
    ? (relatedGameType === 'SURVIVAL_TRIVIA'
        ? ST_GAME_TITLES[Math.floor(rand() * ST_GAME_TITLES.length)]
        : 'BTS 컴백 날짜 예측')
    : null;

  // 게임 관련 상세 데이터 생성
  const isST = relatedGameType === 'SURVIVAL_TRIVIA';
  const isPM = relatedGameType === 'PREDICTION_MARKET';

  // PM: 사용자 선택 (Yes/No)
  const userChoice = isPM ? (rand() > 0.5 ? 'YES' as const : 'NO' as const) : null;

  // 게임 결과 (환급/보상 유형에서만)
  const gameResult = (type === 'REFUND' || type === 'REWARD')
    ? (rand() > 0.5 ? 'YES' as const : 'NO' as const)
    : null;

  // PM: 부스팅 배수
  const boostingMultiplier = (isPM && (type === 'BOOSTING' || type === 'REWARD'))
    ? [2, 3, 5, 10][Math.floor(rand() * 4)]
    : undefined;

  // ST: 하트 변동 (종료된 게임만)
  const stHeartsLost = isST && hasGame ? Math.floor(rand() * 3) : undefined;
  const stSurvivedStage = isST ? Math.floor(rand() * 10) + 1 : undefined;
  const stEliminatedAt = isST
    ? (stSurvivedStage && stSurvivedStage < 10 ? stSurvivedStage : null)
    : undefined;
  const stHeartsGained = isST && hasGame
    ? (stEliminatedAt === null ? 1 : (rand() > 0.5 ? 1 : 0)) // 생존=+1, 탈락+관전완료=+1
    : undefined;

  // ST 환불: 하트 복구
  const heartsRecovered = (isST && type === 'REFUND_CANCEL' && stHeartsLost && stHeartsLost > 0)
    ? stHeartsLost
    : undefined;

  // 환불 GP 내역
  const refundParticipationGP = type === 'REFUND_CANCEL'
    ? Math.abs(Math.floor(baseAmount * (isPM ? 0.9 : 1)))
    : undefined;
  const refundBoostingGP = (type === 'REFUND_CANCEL' && isPM)
    ? Math.abs(baseAmount) - (refundParticipationGP ?? 0)
    : undefined;

  // 게임 상태
  const gameStatuses = ['Active', 'Pending', 'Closed', 'Ended'];
  const relatedGameStatus = hasGame
    ? (type === 'REFUND_CANCEL' ? 'Cancelled'
      : (type === 'REWARD' || type === 'REFUND') ? 'Ended'
      : gameStatuses[Math.floor(rand() * gameStatuses.length)])
    : undefined;

  return {
    id: `GPC${String(i + 1).padStart(6, '0')}`,
    datetime: new Date(REFERENCE_DATE - rand() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    nickname: NICKNAMES[i % NICKNAMES.length] + String(Math.floor(rand() * 100)),
    walletAddress: WALLETS[i % WALLETS.length],
    type,
    amount,
    balanceAfter,
    relatedGameId: hasGame ? `game-${String(Math.floor(rand() * 50) + 1).padStart(3, '0')}` : null,
    relatedGameTitle,
    relatedGameType,
    relatedGameStatus,
    relatedExchangeId: hasExchange ? `EX${String(Math.floor(rand() * 60) + 1).padStart(6, '0')}` : null,
    txid: hasExchange ? `0x${randomHex(64)}` : null,
    notes,
    userChoice: hasGame ? userChoice : undefined,
    gameResult,
    boostingMultiplier,
    heartsLost: stHeartsLost,
    heartsGained: stHeartsGained,
    heartsRecovered,
    survivedStage: isST ? stSurvivedStage : undefined,
    eliminatedAtStage: stEliminatedAt,
    refundParticipationGP,
    refundBoostingGP,
  };
}).sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
