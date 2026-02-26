import type { Participant, GameType } from '@/lib/types';
import { mockGames } from './games';

const NICKNAMES = [
  'starlightarmy', 'pinkblink', 'caratluv', 'divein', 'engene',
  'wishfulthinking', 'myonce', 'keplerfan', 'loveguys', 'islander',
  'foreverone', 'unitfan', 'goldenchild', 'neverland', 'atinyz',
  'stayfan', 'oncefan', 'milli', 'nctzen', 'viviz',
  'starshipfan', 'hibelover', 'jypbest', 'smforever', 'cubelover',
  'musicbank', 'inkigayo', 'mcountdown', 'theshowfan', 'showchamp',
];

const NO_PARTICIPANTS_STATUSES = ['Draft', 'Ready'];

function createParticipants(gameId: string, count: number, gameIndex: number): Participant[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `part-${gameId}-${String(i + 1).padStart(3, '0')}`,
    gameId,
    nickname: NICKNAMES[(gameIndex * 7 + i) % NICKNAMES.length] + String(Math.floor(Math.random() * 100)),
    uid: `UID${String(gameIndex * 100 + i + 1).padStart(6, '0')}`,
    choice: Math.random() > 0.5 ? 'YES' : 'NO',
    participationGP: mockGames[gameIndex]?.participationCost ?? 10,
    boostingGP: Math.random() > 0.4 ? (mockGames[gameIndex]?.boostingCost ?? 5) : 0,
    status: '참여 완료',
    participatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    rewardGP: 0,
    refundGP: 0,
  }));
}

function createSTParticipants(gameId: string, count: number, gameIndex: number): Participant[] {
  const game = mockGames.find(g => g.id === gameId);
  const status = game?.status;
  const targetSurvivorCount = game?.survivorCount;
  const totalStages = 10;

  return Array.from({ length: count }, (_, i) => {
    let survivedStage: number;
    let eliminatedAtStage: number | null;

    if (status === 'Active') {
      // 게임 진행 중: 현재 스테이지까지만 진행 (4-7)
      const currentStage = 4 + (gameIndex % 4);
      const eliminated = Math.random() > 0.5;
      if (eliminated) {
        survivedStage = Math.floor(Math.random() * currentStage) + 1;
        eliminatedAtStage = survivedStage;
      } else {
        survivedStage = currentStage;
        eliminatedAtStage = null;
      }
    } else if (status === 'Ended' && targetSurvivorCount === 0) {
      // 전원 탈락: 모든 참여자 1-9에서 탈락
      survivedStage = Math.floor(Math.random() * 9) + 1;
      eliminatedAtStage = survivedStage;
    } else if (status === 'Ended' && targetSurvivorCount !== undefined && targetSurvivorCount > 0) {
      // 지정된 생존자 수만큼 생존
      if (i < targetSurvivorCount) {
        survivedStage = totalStages;
        eliminatedAtStage = null;
      } else {
        survivedStage = Math.floor(Math.random() * 9) + 1;
        eliminatedAtStage = survivedStage;
      }
    } else {
      // fallback (Ended without survivorCount 등)
      const survived = Math.random() > 0.7;
      survivedStage = survived ? totalStages : Math.floor(Math.random() * 9) + 1;
      eliminatedAtStage = survived ? null : survivedStage;
    }

    const heartsUsed = Math.floor(Math.random() * 3);

    return {
      id: `part-${gameId}-${String(i + 1).padStart(3, '0')}`,
      gameId,
      nickname: NICKNAMES[(gameIndex * 7 + i) % NICKNAMES.length] + String(Math.floor(Math.random() * 100)),
      uid: `UID${String(gameIndex * 100 + i + 1).padStart(6, '0')}`,
      choice: null,
      participationGP: game?.participationCost ?? 10,
      boostingGP: 0,
      status: '참여 완료',
      participatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      rewardGP: 0,
      refundGP: 0,
      survivedStage,
      heartsUsed,
      eliminatedAtStage,
      gameType: 'SURVIVAL_TRIVIA' as GameType,
    };
  });
}

export const mockParticipants: Participant[] = [
  ...mockGames
    .filter(g => !NO_PARTICIPANTS_STATUSES.includes(g.status) && g.type === 'PREDICTION_MARKET')
    .flatMap((game, i) => {
      const count = (game.status === 'Closed' || game.status === 'Ended')
        ? Math.floor(Math.random() * 30) + 50
        : Math.floor(Math.random() * 20) + 10;
      return createParticipants(game.id, count, i);
    }),
  ...mockGames
    .filter(g => !NO_PARTICIPANTS_STATUSES.includes(g.status) && g.type === 'SURVIVAL_TRIVIA')
    .flatMap((game, i) => {
      const count = game.status === 'Ended'
        ? Math.floor(Math.random() * 30) + 50
        : Math.floor(Math.random() * 20) + 10;
      return createSTParticipants(game.id, count, i + 100);
    }),
];

export function getParticipantsByGameId(gameId: string): Participant[] {
  return mockParticipants.filter(p => p.gameId === gameId);
}
