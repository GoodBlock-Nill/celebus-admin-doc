import type { Game, GameStatus, GameType, Quiz } from '@/lib/types';

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
  let resultTitle = { ko: '', en: '', jp: '' };
  let resultLinkText = { ko: '', en: '', jp: '' };
  let resultLinkUrl = { ko: '', en: '', jp: '' };
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
      resultTitle = { ko: '결과 발표', en: 'Result Announcement', jp: '結果発表' };
      resultLinkText = { ko: '공식 결과 페이지', en: 'Official Result Page', jp: '公式結果ページ' };
      resultLinkUrl = { ko: 'https://example.com/kr/result', en: 'https://example.com/en/result', jp: 'https://example.com/jp/result' };
      break;
    case 'Ended':
      publishedAt = randomDate(new Date(pastMonth.getTime() - 90 * 24 * 60 * 60 * 1000), new Date(pastMonth.getTime() - 60 * 24 * 60 * 60 * 1000));
      endDate = randomDate(new Date(pastMonth.getTime() - 60 * 24 * 60 * 60 * 1000), new Date(pastMonth.getTime() - 30 * 24 * 60 * 60 * 1000));
      resultDate = randomDate(new Date(new Date(endDate).getTime() + 1 * 24 * 60 * 60 * 1000), new Date(new Date(endDate).getTime() + 3 * 24 * 60 * 60 * 1000));
      result = Math.random() > 0.5 ? 'YES' : 'NO';
      resultTitle = { ko: '결과 발표', en: 'Result Announcement', jp: '結果発表' };
      resultLinkText = { ko: '공식 결과 페이지', en: 'Official Result Page', jp: '公式結果ページ' };
      resultLinkUrl = { ko: 'https://example.com/kr/result', en: 'https://example.com/en/result', jp: 'https://example.com/jp/result' };
      rewardDistributed = true;
      rewardDistributedAt = randomDate(new Date(new Date(resultDate).getTime() + 1 * 24 * 60 * 60 * 1000), new Date(new Date(resultDate).getTime() + 3 * 24 * 60 * 60 * 1000));
      break;
  }

  const createdAt = randomDate(new Date(new Date(endDate).getTime() - 30 * 24 * 60 * 60 * 1000), new Date(new Date(endDate).getTime() - 14 * 24 * 60 * 60 * 1000));
  const hintLinkEnabled = Math.random() > 0.5;

  // Draft: 필수값 일부 미입력 (모두 입력 시 자동으로 Ready 전환)
  const isDraft = status === 'Draft';
  const draftVariant = index % 2; // 0: 초기 작성, 1: 거의 완성

  return {
    id: `game-${String(index + 1).padStart(3, '0')}`,
    type: 'PREDICTION_MARKET' as GameType,
    title: {
      ko: title,
      en: isDraft && draftVariant === 0 ? '' : `[EN] ${title}`,
      jp: isDraft && draftVariant === 0 ? '' : `[JP] ${title}`,
    },
    description: {
      ko: `${title}에 대한 예측 게임입니다. YES 또는 NO를 선택하여 참여하세요.`,
      en: isDraft ? '' : `This is a prediction game about ${title}. Choose YES or NO to participate.`,
      jp: isDraft ? '' : `${title}に関する予測ゲームです。YESまたはNOを選択して参加してください。`,
    },
    hintLinkEnabled: isDraft ? false : hintLinkEnabled,
    hintLink: isDraft ? '' : (hintLinkEnabled ? `https://example.com/hint/${index + 1}` : ''),
    status,
    totalPrizeGP: isDraft && draftVariant === 0 ? 0 : [10000, 50000, 100000, 200000, 500000][Math.floor(Math.random() * 5)],
    maxParticipants: Math.random() > 0.3 ? [100, 500, 1000, 0][Math.floor(Math.random() * 4)] : 0,
    participationCost: [1, 5, 10, 20, 50][Math.floor(Math.random() * 5)],
    boostingCost: [1, 5, 10, 20][Math.floor(Math.random() * 4)],
    boostingMultiplier: [2, 3, 5, 10][Math.floor(Math.random() * 4)],
    endDate: isDraft && draftVariant === 0 ? '' : endDate,
    resultDate: isDraft ? '' : resultDate,
    resultBasis: isDraft ? { ko: '', en: '', jp: '' } : {
      ko: '공식 발표 기준으로 결과를 확인합니다.',
      en: 'Results are confirmed based on official announcements.',
      jp: '公式発表を基準に結果を確認します。',
    },
    result,
    resultTitle,
    resultDescription: result ? { ko: '결과가 확정되었습니다.', en: 'Result has been confirmed.', jp: '結果が確定しました。' } : { ko: '', en: '', jp: '' },
    resultLinkText,
    resultLinkUrl,
    rewardDistributed,
    rewardDistributedAt,
    participantCount,
    createdAt,
    createdBy: ADMINS[Math.floor(Math.random() * ADMINS.length)],
    updatedAt: createdAt,
    publishedAt,
  };
}

const ST_GAME_TITLES = [
  'K-pop 아이돌 데뷔 연도 퀴즈', 'K-pop 히트곡 맞추기 챌린지', '아이돌 멤버 이름 퀴즈',
  'K-pop 시상식 수상 퀴즈', '뮤직비디오 장면 퀴즈', 'K-pop 그룹 소속사 맞추기',
  '아이돌 포메이션 퀴즈', 'K-pop 가사 완성 퀴즈', 'K-pop 앨범 커버 맞추기',
  'K-pop 콜라보 아티스트 퀴즈', 'SM 소속 아이돌 퀴즈', 'JYP 걸그룹 총정리 퀴즈',
];

const ST_QUIZ_TEMPLATES: Quiz[] = [
  {
    id: 'q-001', questionNumber: 1,
    text: { ko: 'BTS의 데뷔곡은?', en: 'What is BTS debut song?', jp: 'BTSのデビュー曲は？' },
    choices: [
      { ko: 'No More Dream', en: 'No More Dream', jp: 'No More Dream' },
      { ko: 'Dynamite', en: 'Dynamite', jp: 'Dynamite' },
      { ko: 'Boy In Luv', en: 'Boy In Luv', jp: 'Boy In Luv' },
      { ko: 'DNA', en: 'DNA', jp: 'DNA' },
    ],
    correctIndex: 0, timeLimit: 10,
  },
  {
    id: 'q-002', questionNumber: 2,
    text: { ko: 'BLACKPINK 멤버가 아닌 사람은?', en: 'Who is NOT a BLACKPINK member?', jp: 'BLACKPINKのメンバーでないのは？' },
    choices: [
      { ko: '제니', en: 'Jennie', jp: 'ジェニー' },
      { ko: '리사', en: 'Lisa', jp: 'リサ' },
      { ko: '카리나', en: 'Karina', jp: 'カリナ' },
      { ko: '로제', en: 'Rosé', jp: 'ロゼ' },
    ],
    correctIndex: 2, timeLimit: 10,
  },
  {
    id: 'q-003', questionNumber: 3,
    text: { ko: 'aespa의 가상 멤버 이름은?', en: 'What is the name of aespa virtual members?', jp: 'aespaのバーチャルメンバーの名前は？' },
    choices: [
      { ko: 'æ-members', en: 'æ-members', jp: 'æ-members' },
      { ko: 'ae-aespa', en: 'ae-aespa', jp: 'ae-aespa' },
      { ko: 'meta-aespa', en: 'meta-aespa', jp: 'meta-aespa' },
      { ko: 'SM-aespa', en: 'SM-aespa', jp: 'SM-aespa' },
    ],
    correctIndex: 1, timeLimit: 10,
  },
  {
    id: 'q-004', questionNumber: 4,
    text: { ko: 'NewJeans가 데뷔한 연도는?', en: 'In what year did NewJeans debut?', jp: 'NewJeansがデビューした年は？' },
    choices: [
      { ko: '2021년', en: '2021', jp: '2021年' },
      { ko: '2022년', en: '2022', jp: '2022年' },
      { ko: '2023년', en: '2023', jp: '2023年' },
      { ko: '2020년', en: '2020', jp: '2020年' },
    ],
    correctIndex: 1, timeLimit: 10,
  },
  {
    id: 'q-005', questionNumber: 5,
    text: { ko: 'TWICE의 소속사는?', en: 'What company does TWICE belong to?', jp: 'TWICEの所属事務所は？' },
    choices: [
      { ko: 'SM엔터테인먼트', en: 'SM Entertainment', jp: 'SMエンターテインメント' },
      { ko: 'YG엔터테인먼트', en: 'YG Entertainment', jp: 'YGエンターテインメント' },
      { ko: 'JYP엔터테인먼트', en: 'JYP Entertainment', jp: 'JYPエンターテインメント' },
      { ko: 'HYBE', en: 'HYBE', jp: 'HYBE' },
    ],
    correctIndex: 2, timeLimit: 10,
  },
  {
    id: 'q-006', questionNumber: 6,
    text: { ko: 'IVE 멤버 중 "원영"의 성은?', en: 'What is the last name of IVE member "Wonyoung"?', jp: 'IVEのメンバー"ウォニョン"の苗字は？' },
    choices: [
      { ko: '김', en: 'Kim', jp: 'キム' },
      { ko: '이', en: 'Lee', jp: 'イ' },
      { ko: '장', en: 'Jang', jp: 'チャン' },
      { ko: '박', en: 'Park', jp: 'パク' },
    ],
    correctIndex: 2, timeLimit: 10,
  },
  {
    id: 'q-007', questionNumber: 7,
    text: { ko: 'Stray Kids의 리더는?', en: 'Who is the leader of Stray Kids?', jp: 'Stray Kidsのリーダーは？' },
    choices: [
      { ko: '필릭스', en: 'Felix', jp: 'フィリックス' },
      { ko: '방찬', en: 'Bang Chan', jp: 'バンチャン' },
      { ko: '리노', en: 'Lee Know', jp: 'リノ' },
      { ko: '창빈', en: 'Changbin', jp: 'チャンビン' },
    ],
    correctIndex: 1, timeLimit: 10,
  },
  {
    id: 'q-008', questionNumber: 8,
    text: { ko: 'SEVENTEEN의 멤버 수는?', en: 'How many members does SEVENTEEN have?', jp: 'SEVENTEENのメンバーは何人？' },
    choices: [
      { ko: '12명', en: '12', jp: '12人' },
      { ko: '13명', en: '13', jp: '13人' },
      { ko: '14명', en: '14', jp: '14人' },
      { ko: '15명', en: '15', jp: '15人' },
    ],
    correctIndex: 1, timeLimit: 10,
  },
  {
    id: 'q-009', questionNumber: 9,
    text: { ko: 'LE SSERAFIM의 팬덤 이름은?', en: 'What is the fandom name for LE SSERAFIM?', jp: 'LE SSERAFIMのファンダム名は？' },
    choices: [
      { ko: 'FEARNOT', en: 'FEARNOT', jp: 'FEARNOT' },
      { ko: 'FEARLESS', en: 'FEARLESS', jp: 'FEARLESS' },
      { ko: 'FLAMING', en: 'FLAMING', jp: 'FLAMING' },
      { ko: 'FEATHER', en: 'FEATHER', jp: 'FEATHER' },
    ],
    correctIndex: 0, timeLimit: 10,
  },
  {
    id: 'q-010', questionNumber: 10,
    text: { ko: 'EXO가 데뷔한 연도는?', en: 'In what year did EXO debut?', jp: 'EXOがデビューした年は？' },
    choices: [
      { ko: '2011년', en: '2011', jp: '2011年' },
      { ko: '2012년', en: '2012', jp: '2012年' },
      { ko: '2013년', en: '2013', jp: '2013年' },
      { ko: '2010년', en: '2010', jp: '2010年' },
    ],
    correctIndex: 1, timeLimit: 10,
  },
];

function createSTGame(index: number, status: GameStatus): Game {
  const now = new Date();
  const pastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const futureMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const title = ST_GAME_TITLES[index % ST_GAME_TITLES.length];

  let startDateTime: string;
  let publishedAt: string | null = null;
  let rewardDistributed = false;
  let rewardDistributedAt: string | null = null;
  let survivorCount: number | undefined;
  const participantCount = status === 'Draft' || status === 'Ready' ? 0 : Math.floor(Math.random() * 300) + 50;

  switch (status) {
    case 'Draft':
      startDateTime = randomDate(futureMonth, new Date(futureMonth.getTime() + 30 * 24 * 60 * 60 * 1000));
      break;
    case 'Ready':
      startDateTime = randomDate(futureMonth, new Date(futureMonth.getTime() + 30 * 24 * 60 * 60 * 1000));
      break;
    case 'Active':
      publishedAt = randomDate(pastMonth, new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000));
      startDateTime = randomDate(new Date(now.getTime() - 2 * 60 * 60 * 1000), new Date(now.getTime() - 10 * 60 * 1000));
      break;
    case 'Ended':
      publishedAt = randomDate(new Date(pastMonth.getTime() - 90 * 24 * 60 * 60 * 1000), new Date(pastMonth.getTime() - 60 * 24 * 60 * 60 * 1000));
      startDateTime = randomDate(new Date(pastMonth.getTime() - 60 * 24 * 60 * 60 * 1000), new Date(pastMonth.getTime() - 30 * 24 * 60 * 60 * 1000));
      survivorCount = Math.floor(Math.random() * 26) + 5; // 5-30
      rewardDistributed = true;
      rewardDistributedAt = randomDate(new Date(new Date(startDateTime).getTime() + 2 * 60 * 60 * 1000), new Date(new Date(startDateTime).getTime() + 24 * 60 * 60 * 1000));
      break;
    default:
      startDateTime = randomDate(futureMonth, new Date(futureMonth.getTime() + 30 * 24 * 60 * 60 * 1000));
  }

  const actualStartDateTime = status === 'Draft' && index % 2 === 0 ? '' : startDateTime;
  const createdAt = actualStartDateTime
    ? randomDate(new Date(new Date(actualStartDateTime).getTime() - 30 * 24 * 60 * 60 * 1000), new Date(new Date(actualStartDateTime).getTime() - 7 * 24 * 60 * 60 * 1000))
    : randomDate(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000));

  // Draft: 필수값 일부 미입력 (모두 입력 시 자동으로 Ready 전환)
  const isDraft = status === 'Draft';
  const draftVariant = index % 2; // 0: 초기 작성, 1: 거의 완성

  // ST 동적 상금풀 계산
  const maxPrizePool = isDraft && draftVariant === 0 ? 0 : [5_000_000, 10_000_000, 20_000_000, 50_000_000][index % 4];
  const maxRecruitment = isDraft && draftVariant === 0 ? 0 : [5_000, 10_000, 20_000, 50_000][index % 4];
  const stMul = 1.25;
  const calculatedEntryFee = maxRecruitment > 0 ? Math.floor(maxPrizePool / maxRecruitment * stMul) : 0;
  const recruitmentRate = participantCount > 0 && maxRecruitment > 0 ? participantCount / maxRecruitment : 0;
  const stPrizeTiers = [
    { recruitmentRate: 100, prizeRate: 100 },
    { recruitmentRate: 80, prizeRate: 80 },
    { recruitmentRate: 50, prizeRate: 50 },
    { recruitmentRate: 20, prizeRate: 20 },
  ];
  const appliedPrizeRate = (() => {
    const sorted = [...stPrizeTiers].sort((a, b) => b.recruitmentRate - a.recruitmentRate);
    let rate = sorted[sorted.length - 1]?.prizeRate ?? 0;
    for (const tier of sorted) {
      if (recruitmentRate >= tier.recruitmentRate / 100) { rate = tier.prizeRate; break; }
    }
    return rate;
  })();
  const appliedPrizePool = (status === 'Active' || status === 'Ended') ? Math.floor(maxPrizePool * appliedPrizeRate / 100) : undefined;
  const stActualParticipants = (status === 'Active' || status === 'Ended') ? participantCount : undefined;

  return {
    id: `st-game-${String(index + 1).padStart(3, '0')}`,
    type: 'SURVIVAL_TRIVIA' as GameType,
    title: {
      ko: title,
      en: isDraft && draftVariant === 0 ? '' : `[EN] ${title}`,
      jp: isDraft && draftVariant === 0 ? '' : `[JP] ${title}`,
    },
    description: {
      ko: `${title} — 10문제를 풀고 최후의 생존자가 되세요!`,
      en: isDraft ? '' : `${title} — Answer 10 questions and be the last survivor!`,
      jp: isDraft ? '' : `${title} — 10問に答えて最後の生存者になってください！`,
    },
    hintLinkEnabled: false,
    hintLink: '',
    status,
    totalPrizeGP: 0, // ST는 사용 안 함 (PM 전용)
    maxParticipants: 0, // ST는 maxRecruitment 사용
    participationCost: 0, // ST는 calculatedEntryFee 사용
    boostingCost: 0,
    boostingMultiplier: 0,
    maxPrizePool,
    maxRecruitment,
    stMultiplier: stMul,
    prizeTiers: stPrizeTiers,
    eliminationTickets: 1,
    calculatedEntryFee,
    appliedPrizePool,
    actualParticipants: stActualParticipants,
    endDate: '',
    resultDate: '',
    resultBasis: { ko: '', en: '', jp: '' },
    result: null,
    resultTitle: { ko: '', en: '', jp: '' },
    resultDescription: { ko: '', en: '', jp: '' },
    resultLinkText: { ko: '', en: '', jp: '' },
    resultLinkUrl: { ko: '', en: '', jp: '' },
    rewardDistributed,
    rewardDistributedAt,
    participantCount,
    createdAt,
    createdBy: ADMINS[Math.floor(Math.random() * ADMINS.length)],
    updatedAt: createdAt,
    publishedAt,
    quizzes: isDraft && draftVariant === 0 ? [] : (isDraft ? ST_QUIZ_TEMPLATES.slice(0, 5) : ST_QUIZ_TEMPLATES),
    timePerQuestion: 10,
    startDateTime: isDraft && draftVariant === 0 ? '' : startDateTime,
    survivorCount,
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

// ST: Draft×2, Ready×2, Active×2, Ended×6 (총 12개)
const stStatusDistribution: GameStatus[] = [
  'Draft', 'Draft',
  'Ready', 'Ready',
  'Active', 'Active',
  'Ended', 'Ended', 'Ended', 'Ended', 'Ended', 'Ended',
] as GameStatus[];

const stGames: Game[] = stStatusDistribution.map((status, i) => createSTGame(i, status));

// 전원 탈락 ST 게임 (survivorCount: 0)
if (stGames.length > 6) {
  stGames[6] = {
    ...stGames[6],
    title: { ko: '전원 탈락 퀴즈쇼', en: '[EN] All Eliminated Quiz', jp: '[JP] 全員脱落クイズ' },
    survivorCount: 0,
  };
}

export const mockGames: Game[] = [
  ...statusDistribution.map((status, i) => createGame(i, status)),
  ...stGames,
];
