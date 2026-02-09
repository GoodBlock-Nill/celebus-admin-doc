import type { Participant } from '@/lib/types';
import { mockGames } from './games';

const NICKNAMES = [
  'starlightarmy', 'pinkblink', 'caratluv', 'divein', 'engene',
  'wishfulthinking', 'myonce', 'keplerfan', 'loveguys', 'islander',
  'foreverone', 'unitfan', 'goldenchild', 'neverland', 'atinyz',
  'stayfan', 'oncefan', 'milli', 'nctzen', 'viviz',
  'starshipfan', 'hibelover', 'jypbest', 'smforever', 'cubelover',
  'musicbank', 'inkigayo', 'mcountdown', 'theshowfan', 'showchamp',
];

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

export const mockParticipants: Participant[] = mockGames
  .filter(g => g.status !== 'Draft')
  .flatMap((game, i) => {
    // 결과확정/종료 상태 게임은 50-80명, 나머지는 10-30명으로 생성하여 페이지네이션 테스트 가능
    const count = (game.status === 'Closed' || game.status === 'Ended')
      ? Math.floor(Math.random() * 30) + 50
      : Math.floor(Math.random() * 20) + 10;
    return createParticipants(game.id, count, i);
  });

export function getParticipantsByGameId(gameId: string): Participant[] {
  return mockParticipants.filter(p => p.gameId === gameId);
}
