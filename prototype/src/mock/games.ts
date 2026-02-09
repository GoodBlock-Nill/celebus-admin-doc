import type { Game, GameStatus, GameType } from '@/lib/types';

const KOREAN_GAME_TITLES = [
  'BTS 컴백 날짜 예측', 'BLACKPINK 신곡 1위 예측', 'aespa 콘서트 티켓 예측',
  'NewJeans 다음 앨범명 예측', 'TWICE 일본 투어 날짜', 'Stray Kids 빌보드 순위',
  'IVE 신곡 뮤직비디오 조회수', 'LE SSERAFIM 다음 컴백 멤버', 'SEVENTEEN 콘서트 도시',
  '(G)I-DLE 신곡 장르 예측', 'NCT 다음 유닛 결성', 'EXO 완전체 컴백',
  'Red Velvet 리패키지 예측', 'ENHYPEN 월드투어 도시', 'TXT 다음 컨셉',
  'ITZY 신곡 안무 특징', 'ATEEZ 빌보드 진입 예측', 'Stray Kids 앨범 판매량',
  'BTS 멤버 솔로 컴백 순서', 'BLACKPINK 월드투어 날짜', 'aespa 미니앨범 타이틀곡',
  'NewJeans 광고 브랜드 예측', 'TWICE 15주년 기념곡', 'IVE 일본 데뷔 날짜',
  'SEVENTEEN 세계관 확장', 'LE SSERAFIM 영어 앨범', '(G)I-DLE 자체 제작 수록곡',
  'NCT WISH 데뷔 예측', 'EXO 시즌 인사 앨범', 'Red Velvet 유닛 활동',
  'ENHYPEN 일본 앨범 예측', 'TXT 드라마 OST 참여', 'ITZY 유닛 데뷔',
  'ATEEZ 컴백 콘셉트', 'BTS 지민 솔로 앨범', 'BLACKPINK 제니 솔로 컴백',
  'aespa 세계관 확장', 'NewJeans 일본 활동', 'TWICE 나연 솔로',
  'IVE 장원영 연기 데뷔', 'Stray Kids 방찬 프로듀싱', 'SEVENTEEN 호시 솔로',
  'LE SSERAFIM 김채원 예능', '(G)I-DLE 소연 프로듀싱', 'NCT 마크 솔로',
  'ENHYPEN 성훈 드라마', 'TXT 수빈 MC 활동', 'ITZY 류진 화보',
  'ATEEZ 홍중 연기 데뷔', 'Red Velvet 아이린 복귀'
];

// 영문 관리자명
const ADMINS = ['minsu.kim', 'jihyun.lee', 'sungho.park', 'yujin.choi', 'daeun.jung', 'seungwoo.han'];

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString();
}

function createGame(index: number, status: GameStatus): Game {
  const now = new Date();
  const pastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const futureMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const title = KOREAN_GAME_TITLES[index % KOREAN_GAME_TITLES.length];

  let endDate: string, resultDate: string, publishedAt: string | null = null;
  let result: 'YES' | 'NO' | null = null;
  let resultLink = '';
  let rewardDistributed = false;
  let rewardDistributedAt: string | null = null;
  const participantCount = status === 'Draft' || status === 'Ready' ? 0 : Math.floor(Math.random() * 500) + 10;

  switch (status) {
    case 'Draft':
      endDate = randomDate(futureMonth, new Date(futureMonth.getTime() + 30 * 24 * 60 * 60 * 1000));
      resultDate = randomDate(new Date(new Date(endDate).getTime() + 1 * 24 * 60 * 60 * 1000), new Date(new Date(endDate).getTime() + 7 * 24 * 60 * 60 * 1000));
      break;
    case 'Ready':
      endDate = randomDate(futureMonth, new Date(futureMonth.getTime() + 30 * 24 * 60 * 60 * 1000));
      resultDate = randomDate(new Date(new Date(endDate).getTime() + 1 * 24 * 60 * 60 * 1000), new Date(new Date(endDate).getTime() + 7 * 24 * 60 * 60 * 1000));
      break;
    case 'Active':
      publishedAt = randomDate(pastMonth, new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000));
      endDate = randomDate(new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), futureMonth);
      resultDate = randomDate(new Date(new Date(endDate).getTime() + 1 * 24 * 60 * 60 * 1000), new Date(new Date(endDate).getTime() + 7 * 24 * 60 * 60 * 1000));
      break;
    case 'Pending':
      publishedAt = randomDate(new Date(pastMonth.getTime() - 30 * 24 * 60 * 60 * 1000), pastMonth);
      endDate = randomDate(pastMonth, new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000));
      resultDate = randomDate(now, futureMonth);
      break;
    case 'Closed':
      publishedAt = randomDate(new Date(pastMonth.getTime() - 60 * 24 * 60 * 60 * 1000), new Date(pastMonth.getTime() - 30 * 24 * 60 * 60 * 1000));
      endDate = randomDate(new Date(pastMonth.getTime() - 30 * 24 * 60 * 60 * 1000), pastMonth);
      resultDate = randomDate(new Date(new Date(endDate).getTime() + 1 * 24 * 60 * 60 * 1000), new Date(new Date(endDate).getTime() + 3 * 24 * 60 * 60 * 1000));
      result = Math.random() > 0.5 ? 'YES' : 'NO';
      resultLink = `https://example.com/result/${index + 1}`;
      break;
    case 'Ended':
      publishedAt = randomDate(new Date(pastMonth.getTime() - 90 * 24 * 60 * 60 * 1000), new Date(pastMonth.getTime() - 60 * 24 * 60 * 60 * 1000));
      endDate = randomDate(new Date(pastMonth.getTime() - 60 * 24 * 60 * 60 * 1000), new Date(pastMonth.getTime() - 30 * 24 * 60 * 60 * 1000));
      resultDate = randomDate(new Date(new Date(endDate).getTime() + 1 * 24 * 60 * 60 * 1000), new Date(new Date(endDate).getTime() + 3 * 24 * 60 * 60 * 1000));
      result = Math.random() > 0.5 ? 'YES' : 'NO';
      resultLink = `https://example.com/result/${index + 1}`;
      rewardDistributed = true;
      rewardDistributedAt = randomDate(new Date(new Date(resultDate).getTime() + 1 * 24 * 60 * 60 * 1000), new Date(new Date(resultDate).getTime() + 3 * 24 * 60 * 60 * 1000));
      break;
  }

  const createdAt = randomDate(new Date(new Date(endDate).getTime() - 30 * 24 * 60 * 60 * 1000), new Date(new Date(endDate).getTime() - 14 * 24 * 60 * 60 * 1000));
  const boostingEnabled = Math.random() > 0.2;
  const hintLinkEnabled = Math.random() > 0.5;

  return {
    id: `game-${String(index + 1).padStart(3, '0')}`,
    type: 'PREDICTION_MARKET' as GameType,
    title: {
      ko: title,
      en: `[EN] ${title}`,
      jp: `[JP] ${title}`,
    },
    description: {
      ko: `${title}에 대한 예측 게임입니다. YES 또는 NO를 선택하여 참여하세요.`,
      en: `This is a prediction game about ${title}. Choose YES or NO to participate.`,
      jp: `${title}に関する予測ゲームです。YESまたはNOを選択して参加してください。`,
    },
    hintLinkEnabled,
    hintLink: hintLinkEnabled ? `https://example.com/hint/${index + 1}` : '',
    status,
    totalPrizeGP: [10000, 50000, 100000, 200000, 500000][Math.floor(Math.random() * 5)],
    maxParticipants: Math.random() > 0.3 ? [100, 500, 1000, 0][Math.floor(Math.random() * 4)] : 0,
    participationCost: [1, 5, 10, 20, 50][Math.floor(Math.random() * 5)],
    boostingEnabled,
    boostingCost: boostingEnabled ? [1, 5, 10, 20][Math.floor(Math.random() * 4)] : 0,
    boostingMultiplier: boostingEnabled ? [2, 3, 5, 10][Math.floor(Math.random() * 4)] : 2,
    endDate,
    resultDate,
    resultBasis: {
      ko: '공식 발표 기준으로 결과를 확인합니다.',
      en: 'Results are confirmed based on official announcements.',
      jp: '公式発表を基準に結果を確認します。',
    },
    result,
    resultLink,
    rewardDistributed,
    rewardDistributedAt,
    participantCount,
    createdAt,
    createdBy: ADMINS[Math.floor(Math.random() * ADMINS.length)],
    updatedAt: createdAt,
    publishedAt,
  };
}

// 상태별 4개씩 생성 (총 24개, 2페이지 이상)
// 1페이지(20개)에 모든 상태가 표시되도록 배열 순서 조정
const statusDistribution: GameStatus[] = [
  // 1페이지: 모든 상태가 골고루 표시되도록 번갈아 배치
  'Draft', 'Ready', 'Active', 'Pending', 'Closed', 'Ended',
  'Draft', 'Ready', 'Active', 'Pending', 'Closed', 'Ended',
  'Draft', 'Ready', 'Active', 'Pending', 'Closed', 'Ended',
  // 2페이지: 나머지
  'Draft', 'Ready', 'Active', 'Pending', 'Closed', 'Ended',
] as GameStatus[];

export const mockGames: Game[] = statusDistribution.map((status, i) => createGame(i, status));
