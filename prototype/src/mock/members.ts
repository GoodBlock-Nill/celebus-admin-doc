import { mockRankings } from './rankings';
import { mockGames } from './games';
import type { Participant, GPChange, GPChangeType, RankingUser } from '@/lib/types';

export interface Member {
  id: string;
  nickname: string;
  email: string;
  currentGP: number;
}

// Seeded PRNG for deterministic data
function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function randomHex(rand: () => number, length: number): string {
  return Array.from({ length }, () => Math.floor(rand() * 16).toString(16)).join('');
}

// Fixed reference date for deterministic datetime generation
const REF_DATE = new Date('2026-02-06T12:00:00+09:00').getTime();

// Generate 15 members from rankings with deterministic currentGP
const memberRand = createSeededRandom(100);
export const mockMembers: Member[] = mockRankings.slice(0, 15).map((ranking) => ({
  id: ranking.uid,
  nickname: ranking.nickname,
  email: `${ranking.nickname.replace(/\d+$/, '')}@celebus.com`,
  currentGP: Math.floor(memberRand() * 45000) + 5000,
}));

export function getMemberById(id: string): Member | undefined {
  return mockMembers.find(m => m.id === id);
}

export function getRankingByUid(uid: string): RankingUser | undefined {
  return mockRankings.find(r => r.uid === uid);
}

// Games that can have participation (not Draft)
const participableGames = mockGames.filter(g => g.status !== 'Draft' && g.status !== 'Ready');

const GP_TYPES: GPChangeType[] = ['PARTICIPATION', 'BOOSTING', 'REFUND', 'REWARD', 'EXCHANGE_IN', 'EXCHANGE_OUT', 'REFUND_CANCEL'];
const NOTES_MAP: Record<GPChangeType, string> = {
  PARTICIPATION: '게임 참여',
  BOOSTING: '부스팅 사용',
  REFUND: '참여 GP 환급',
  REWARD: '예측 성공 보상',
  EXCHANGE_IN: 'CELB → GP 교환',
  EXCHANGE_OUT: 'GP → CELB 교환',
  REFUND_CANCEL: '게임 취소 환불',
};

// Generate dedicated participant entries per member
function generateMemberParticipants(member: Member, memberIndex: number): Participant[] {
  const rand = createSeededRandom(memberIndex * 1000 + 7);
  const gameCount = Math.floor(rand() * 16) + 25; // 25~40 games per member
  const selectedGames = participableGames
    .slice()
    .sort(() => rand() - 0.5)
    .slice(0, gameCount);

  return selectedGames.map((game, i) => {
    const choice: 'YES' | 'NO' = rand() > 0.5 ? 'YES' : 'NO';
    const isCorrect = game.result ? choice === game.result : false;
    const isCompleted = game.status === 'Closed' || game.status === 'Ended';
    const participationGP = game.participationCost;
    const boostingGP = rand() > 0.4 ? game.boostingCost : 0;
    const rewardGP = isCompleted && isCorrect ? Math.floor(rand() * 200) + 50 : 0;
    const refundGP = isCompleted ? participationGP : 0;

    return {
      id: `mpart-${member.id}-${String(i + 1).padStart(3, '0')}`,
      gameId: game.id,
      nickname: member.nickname,
      uid: member.id,
      choice,
      participationGP,
      boostingGP,
      status: '참여 완료',
      participatedAt: new Date(REF_DATE - rand() * 50 * 24 * 60 * 60 * 1000).toISOString(),
      rewardGP,
      refundGP,
    };
  }).sort((a, b) => new Date(b.participatedAt).getTime() - new Date(a.participatedAt).getTime());
}

// Generate GP change entries derived from actual participation data
function generateMemberGPChanges(member: Member, memberIndex: number, participants: Participant[]): GPChange[] {
  const rand = createSeededRandom(memberIndex * 2000 + 13);
  const walletAddress = `0x${randomHex(rand, 40)}`;
  const entries: GPChange[] = [];
  let entryIndex = 0;

  const makeEntry = (
    type: GPChangeType, amount: number, datetime: string,
    gameId: string | null, gameTitle: string | null,
    exchangeId: string | null, txid: string | null, notes: string
  ): GPChange => ({
    id: `MGPC-${member.id}-${String(++entryIndex).padStart(4, '0')}`,
    datetime, nickname: member.nickname, walletAddress,
    type, amount, balanceAfter: 0,
    relatedGameId: gameId, relatedGameTitle: gameTitle,
    relatedExchangeId: exchangeId, txid, notes,
  });

  // Step 1: Derive GP changes from each participation
  for (const p of participants) {
    const game = mockGames.find(g => g.id === p.gameId);
    const gameTitle = game?.title.ko ?? null;
    const pAt = new Date(p.participatedAt).getTime();

    entries.push(makeEntry(
      'PARTICIPATION', -p.participationGP, p.participatedAt,
      p.gameId, gameTitle, null, null, '게임 참여'
    ));

    if (p.boostingGP > 0) {
      entries.push(makeEntry(
        'BOOSTING', -p.boostingGP,
        new Date(pAt + 60000).toISOString(),
        p.gameId, gameTitle, null, null, '부스팅 사용'
      ));
    }

    if (p.refundGP > 0) {
      entries.push(makeEntry(
        'REFUND', p.refundGP,
        new Date(pAt + 2 * 86400000 + Math.floor(rand() * 3600000)).toISOString(),
        p.gameId, gameTitle, null, null, '참여 GP 환급'
      ));
    }

    if (p.rewardGP > 0) {
      entries.push(makeEntry(
        'REWARD', p.rewardGP,
        new Date(pAt + 2 * 86400000 + 3600000 + Math.floor(rand() * 3600000)).toISOString(),
        p.gameId, gameTitle, null, null, '예측 성공 보상'
      ));
    }
  }

  // Step 2: Add EXCHANGE_IN/OUT entries (5~10)
  const exchangeCount = Math.floor(rand() * 6) + 5;
  for (let i = 0; i < exchangeCount; i++) {
    const isCharge = rand() > 0.3;
    const amount = [100, 500, 1000, 2000, 5000][Math.floor(rand() * 5)];
    const exId = `EX${String(Math.floor(rand() * 60) + 1).padStart(6, '0')}`;
    const exTxid = `0x${randomHex(rand, 64)}`;
    entries.push(makeEntry(
      isCharge ? 'EXCHANGE_IN' : 'EXCHANGE_OUT',
      isCharge ? amount : -amount,
      new Date(REF_DATE - Math.floor(rand() * 60) * 86400000).toISOString(),
      null, null, exId, exTxid,
      isCharge ? 'CELB → GP 교환' : 'GP → CELB 교환'
    ));
  }

  // Step 3: Sort chronologically ASC
  entries.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  // Step 4: Calculate initial charge to ensure positive balance at every point
  // Simulate running balance to find the deepest deficit
  let simBalance = 0;
  let minSimBalance = 0;
  for (const entry of entries) {
    simBalance += entry.amount;
    minSimBalance = Math.min(minSimBalance, simBalance);
  }
  // Initial charge must cover the deepest deficit plus a buffer
  const initialCharge = Math.abs(minSimBalance) + 3000 + Math.floor(rand() * 5000);

  const earliestDate = entries.length > 0
    ? new Date(new Date(entries[0].datetime).getTime() - 86400000).toISOString()
    : new Date(REF_DATE - 60 * 86400000).toISOString();

  entries.unshift(makeEntry(
    'EXCHANGE_IN', initialCharge, earliestDate,
    null, null, `EX${String(Math.floor(rand() * 60) + 1).padStart(6, '0')}`,
    `0x${randomHex(rand, 64)}`, 'CELB → GP 교환'
  ));

  // Step 5: Forward walk computing balanceAfter (start from 0)
  let balance = 0;
  for (const entry of entries) {
    balance = Math.max(0, balance + entry.amount);
    entry.balanceAfter = balance;
  }

  // Step 6: Update member.currentGP to final balance
  member.currentGP = balance;

  // Return sorted DESC for display
  return entries.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
}

// Pre-generate data for all members (cached at module level)
// IMPORTANT: participants must be generated first, then GP changes derived from them
const memberParticipantsCache = new Map<string, Participant[]>();
const memberGPChangesCache = new Map<string, GPChange[]>();

mockMembers.forEach((member, index) => {
  const participants = generateMemberParticipants(member, index);
  memberParticipantsCache.set(member.id, participants);
  memberGPChangesCache.set(member.id, generateMemberGPChanges(member, index, participants));
});

export function getMemberParticipants(memberId: string): Participant[] {
  return memberParticipantsCache.get(memberId) ?? [];
}

export function getMemberGPChanges(memberId: string): GPChange[] {
  return memberGPChangesCache.get(memberId) ?? [];
}
