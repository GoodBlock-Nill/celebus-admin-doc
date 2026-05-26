// 운영 게임존 mock

export const gameZoneStats = {
  // 전체 현황
  activeGames: 0,
  resultPending: 0,
  todayCharge: 0, // GP
  todayWithdraw: 0, // GP
  // 게임 관리
  pm: { active: 0, resultPending: 0, todayParticipants: 0 },
  st: { active: 0, ready: 0, todayParticipants: 0 },
  // 운영 요약
  ranking: { top10Public: false, top1Nickname: '-', top1GP: 0 },
  exchange: { todayCharge: 0, todayWithdraw: 0 },
  gpHistory: { todayCount: 17 },
};

// 게임 상태 — 운영 BO 표기 (한국어, [CEB-BO-GZ-201] v1.6 정합)
export type GameStatus = '임시저장' | '게시대기' | '진행중' | '결과대기' | '결과확정' | '종료';
export type GameType = 'PM' | 'ST';

export interface PMGame {
  id: number;
  type: 'PM';
  title: string; // KO
  titleEN: string;
  titleJP: string;
  description: string; // KO
  status: GameStatus;
  participants: number;
  totalPrize: number; // 총 상금 GP
  participationCost: number;
  boostingCost: number;
  boostingMultiplier: number;
  votingStart?: string; // 'YYYY.MM.DD' (게시 후만)
  votingEnd: string; // 'YYYY.MM.DD'
  resultAnnounceDate: string;
  createdAt: string; // 'YYYY.MM.DD HH:mm'
  admin: string;
  hasParticipants?: boolean;
}

export interface STGame {
  id: number;
  type: 'ST';
  title: string;
  titleEN: string;
  titleJP: string;
  description: string;
  status: GameStatus;
  participants: number;
  maxParticipants: number; // ∞ 표시는 -1
  maxPrize: number; // 최대 상금 GP
  participationCost: number; // 자동 계산
  startDateTime: string; // 'YYYY.MM.DD HH:mm'
  createdAt: string;
  admin: string;
}

export type Game = PMGame | STGame;

// PM 게임 mock — 상태 다양 + 운영 BO 패턴 정합
const PM_GAMES: PMGame[] = [
  { id: 1, type: 'PM', title: 'V01D가 이번 주 인기가요 1위를 할까요?', titleEN: 'Will V01D take #1 on Inkigayo this week?', titleJP: 'V01Dが今週の人気歌謡で1位を取るか?', description: 'V01D의 신곡 컴백 1주차 인기가요 1위 예측', status: '진행중', participants: 234, totalPrize: 10000, participationCost: 1, boostingCost: 1, boostingMultiplier: 2, votingStart: '2026.05.20', votingEnd: '2026.05.24', resultAnnounceDate: '2026.05.25', createdAt: '2026.05.20 14:30', admin: 'nill', hasParticipants: true },
  { id: 2, type: 'PM', title: '오늘 한국 vs 일본 야구 경기 결과는?', titleEN: 'Korea vs Japan baseball result today?', titleJP: '今日の韓国対日本野球の結果は?', description: '한일전 야구 경기 승리 팀 예측', status: '결과대기', participants: 421, totalPrize: 30000, participationCost: 5, boostingCost: 3, boostingMultiplier: 3, votingStart: '2026.05.21', votingEnd: '2026.05.22', resultAnnounceDate: '2026.05.23', createdAt: '2026.05.21 18:00', admin: 'superjay', hasParticipants: true },
  { id: 3, type: 'PM', title: '신곡 음원 차트 진입 순위는?', titleEN: 'New song chart entry ranking?', titleJP: '新曲の音源チャート進入順位は?', description: '발매 첫날 멜론 톱100 진입 순위 예측', status: '결과확정', participants: 156, totalPrize: 5000, participationCost: 1, boostingCost: 1, boostingMultiplier: 2, votingStart: '2026.05.18', votingEnd: '2026.05.19', resultAnnounceDate: '2026.05.20', createdAt: '2026.05.18 10:00', admin: 'nill', hasParticipants: true },
  { id: 4, type: 'PM', title: '콘서트 굿즈 매진 시간?', titleEN: 'Concert merch sold-out time?', titleJP: 'コンサートグッズ売り切れ時間?', description: '월드투어 굿즈 1차분 매진까지 걸린 시간', status: '종료', participants: 89, totalPrize: 3000, participationCost: 1, boostingCost: 1, boostingMultiplier: 2, votingStart: '2026.05.15', votingEnd: '2026.05.16', resultAnnounceDate: '2026.05.17', createdAt: '2026.05.15 09:00', admin: 'superjay' },
  { id: 5, type: 'PM', title: '신규 게임 임시저장 테스트', titleEN: 'Draft test', titleJP: '一時保存テスト', description: '임시저장 상태 테스트용', status: '임시저장', participants: 0, totalPrize: 1000, participationCost: 1, boostingCost: 1, boostingMultiplier: 2, votingEnd: '2026.05.30', resultAnnounceDate: '2026.05.31', createdAt: '2026.05.22 11:00', admin: 'nill' },
  { id: 6, type: 'PM', title: '게시대기 PM 테스트', titleEN: 'Ready test', titleJP: '掲示待機テスト', description: '게시대기 상태 테스트용', status: '게시대기', participants: 0, totalPrize: 2000, participationCost: 1, boostingCost: 1, boostingMultiplier: 2, votingEnd: '2026.05.28', resultAnnounceDate: '2026.05.29', createdAt: '2026.05.22 12:00', admin: 'nill' },
];

// ST 게임 mock
const ST_GAMES: STGame[] = [
  { id: 101, type: 'ST', title: '제 1회 V01D 모의고사', titleEN: 'V01D Mock Test #1', titleJP: 'V01D模擬試験 #1', description: 'V01D 팬덤 지식 10문제 트리비아', status: '진행중', participants: 312, maxParticipants: 500, maxPrize: 10000, participationCost: 50, startDateTime: '2026.05.22 13:00', createdAt: '2026.05.21 09:00', admin: 'nill' },
  { id: 102, type: 'ST', title: 'K-pop 데뷔연도 퀴즈', titleEN: 'K-pop Debut Year Quiz', titleJP: 'K-popデビュー年クイズ', description: '주요 그룹 데뷔연도 트리비아', status: '게시대기', participants: 0, maxParticipants: 1000, maxPrize: 20000, participationCost: 40, startDateTime: '2026.05.24 20:00', createdAt: '2026.05.20 16:00', admin: 'superjay' },
  { id: 103, type: 'ST', title: '신곡 가사 빈칸 채우기', titleEN: 'Fill the Lyrics', titleJP: '新曲歌詞穴埋め', description: '최신 컴백곡 가사 트리비아', status: '종료', participants: 478, maxParticipants: 500, maxPrize: 5000, participationCost: 25, startDateTime: '2026.05.18 21:00', createdAt: '2026.05.17 14:00', admin: 'nill' },
];

export const games: Game[] = [...PM_GAMES, ...ST_GAMES];

export function getGamesByType(type: GameType): Game[] {
  return games.filter((g) => g.type === type);
}

export function getGameById(id: number): Game | undefined {
  return games.find((g) => g.id === id);
}

// PM 참여자 mock (게임 ID별)
export interface PMEntry {
  no: number;
  nickname: string;
  enteredAt: string;
  selection: 'YES' | 'NO';
  usedGP: number;
  boostingGP: number;
  status: '참여완료';
}

export function getPMEntries(gameId: number): PMEntry[] {
  const game = getGameById(gameId);
  if (!game || game.type !== 'PM') return [];
  // mock — 참여자 수만큼 자동 생성 (최대 20명만)
  const count = Math.min(game.participants, 20);
  const seed = ['nanananna1', 'sunday1', 'zziong', 'from_june', 'stay.yourself.skz', 'ygfam', 'yewon1640', 'yoon', 'skdud', 'hyeonny', 'mozzi1118', 'haeul22', '1311', 'su_suy', 'hhhh', 'sssssouffleeeee', 'sxlvxr', 'manju', 'sally410504', 'yebin'];
  return Array.from({ length: count }, (_, i) => ({
    no: i + 1,
    nickname: seed[i % seed.length],
    enteredAt: `2026.05.${20 + (i % 4)} ${10 + (i % 12)}:${String((i * 7) % 60).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
    selection: (i % 2 === 0 ? 'YES' : 'NO') as 'YES' | 'NO',
    usedGP: game.participationCost,
    boostingGP: i % 3 === 0 ? game.boostingCost * game.boostingMultiplier : 0,
    status: '참여완료' as const,
  }));
}

// PM 결과·보상 정보 (Closed/Ended 상태만)
export interface PMResultReward {
  resultTitle: { KO: string; EN: string; JP: string } | null;
  result: 'YES' | 'NO' | null;
  resultDescription: { KO: string; EN: string; JP: string } | null;
  resultLink: { text: string; url: string } | null;
  totalPrize: number;
  correctCount: number;
  undistributed: number;
  withdrawnUserUnpaid: number;
  perShareGP: number;
  rewardStatus: '미지급' | '지급 완료';
  rewardPaidAt: string | null;
}

export function getPMResultReward(gameId: number): PMResultReward {
  const game = getGameById(gameId);
  if (!game || game.type !== 'PM') {
    return { resultTitle: null, result: null, resultDescription: null, resultLink: null, totalPrize: 0, correctCount: 0, undistributed: 0, withdrawnUserUnpaid: 0, perShareGP: 0, rewardStatus: '미지급', rewardPaidAt: null };
  }
  if (game.status === '결과확정' || game.status === '종료') {
    const correct = Math.floor(game.participants * 0.45);
    return {
      resultTitle: { KO: '결과 발표', EN: 'Result', JP: '結果発表' },
      result: 'YES',
      resultDescription: { KO: '공식 발표에 따라 YES로 확정되었습니다.', EN: 'Confirmed YES per official announcement.', JP: '公式発表に基づきYESに確定。' },
      resultLink: { text: '공식 차트 확인', url: 'https://example.com/chart' },
      totalPrize: game.totalPrize,
      correctCount: correct,
      undistributed: 0,
      withdrawnUserUnpaid: 0,
      perShareGP: correct > 0 ? Math.floor(game.totalPrize / correct) : 0,
      rewardStatus: game.status === '종료' ? '지급 완료' : '미지급',
      rewardPaidAt: game.status === '종료' ? '2026.05.17 14:00' : null,
    };
  }
  return { resultTitle: null, result: null, resultDescription: null, resultLink: null, totalPrize: game.totalPrize, correctCount: 0, undistributed: game.totalPrize, withdrawnUserUnpaid: 0, perShareGP: 0, rewardStatus: '미지급', rewardPaidAt: null };
}

// GP 변동 내역 — 운영 화면 실제 데이터 (2026.05.06)
export interface GPHistoryEntry {
  id: number;
  occurredAt: string; // YYYY.MM.DD HH:mm:ss
  nickname: string;
  type: '' | 'GP 충전' | 'GP 출금';
  gameType: '' | 'PM' | 'ST';
  amount: number; // +/- GP
  balanceAfter: number;
  notes: string;
}

const SEED_NICKNAMES = [
  'nanananna1', 'sunday1', 'zziong', 'from_june', 'stay.yourself.skz',
  'ygfam', 'yewon1640', 'yoon', 'skdud', 'hyeonny',
  'mozzi1118', 'haeul22', '1311', 'su_suy', 'hhhh',
  'sssssouffleeeee', 'sxlvxr', 'manju', 'sally410504', 'yebin',
];

export const gpHistory: GPHistoryEntry[] = (() => {
  const list: GPHistoryEntry[] = [];
  const startTs = new Date('2026-05-06T15:25:32+09:00').getTime();
  for (let i = 0; i < SEED_NICKNAMES.length; i++) {
    const ts = new Date(startTs - i * 60 * 60 * 1000 - i * 7 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${ts.getFullYear()}.${pad(ts.getMonth() + 1)}.${pad(ts.getDate())} ${pad(ts.getHours())}:${pad(ts.getMinutes())}:${pad(ts.getSeconds())}`;
    list.push({
      id: i + 1,
      occurredAt: dateStr,
      nickname: SEED_NICKNAMES[i],
      type: '',
      gameType: '',
      amount: 5,
      balanceAfter: (i % 8) * 5 + 5,
      notes: 'GP 출석체크',
    });
  }
  return list;
})();

// ─────────────── 랭킹 (Ranking) — [CEB-BO-GZ-401] / [CEB-BO-GZ-402] ───────────────
// 운영 BO는 PM/ST 통합 누적 GP 기준. 통합 운영 BO 실측 시점 데이터 0건이라
// 풍부한 가상 mock 50명으로 필터·페이지네이션·카드 디자인 검증 가능하게 구성.

export interface RankingEntry {
  rank: number;
  uid: number;            // 회원 상세(`/members/{uid}`) 이동용
  nickname: string;       // `^[a-z0-9_.]+$`
  totalGp: number;        // 누적 GP = (보상 + 환급) − (참여 + 부스팅)
  playCount: number;      // 결과 확정된 게임 참여 횟수
  winRate: number;        // 소수 1자리 (예: 23.0)
  lastPlayedAt: string;   // YYYY.MM.DD
}

// 50명 랭킹 풀. 운영 BO 실측 닉네임 12명(holly·lily·…) + 가상 38명.
const RANKING_NICKNAMES = [
  'holly', 'lily', 'cromatica', 'lajkdream', 'dding',
  'oliver', '4nellie2', 'chia', 'sara', '3xwoh_s',
  'yumyelim', 'nieumi', 'rex17', 'sohyun', 'starlight99',
  'pink_blink42', 'carat_love77', 'dive_in55', 'engine_on33', 'wishful28',
  'my_once91', 'kepler_fan15', 'love_guys60', 'islander44', 'twinkle22',
  'galaxy_77', 'dream_catcher', 'moon_river', 'zerobase_one', 'fearless_88',
  'aurora_kim', 'midnight_v', 'sapphire_l', 'midnight_run', 'velvet_voice',
  'lemonade21', 'cherryblossom', 'mintchoco', 'sunset_park', 'firefly99',
  'glasswing', 'paperplane', 'sundial33', 'pixel_kim', 'tinytea',
  'noon_after', 'snowdrop', 'wildflower', 'fluffy_cat', 'lazybirds',
];

export const rankings: RankingEntry[] = (() => {
  const list: RankingEntry[] = [];
  // 1위 50000 → 점점 감소. 자연스러운 분포(약간의 변동)
  for (let i = 0; i < RANKING_NICKNAMES.length; i++) {
    const baseGp = 50000 - i * 800;
    const variance = Math.floor(Math.sin(i * 2.7) * 200);
    const totalGp = Math.max(100, baseGp + variance);
    const playCount = Math.max(5, 120 - i * 2 - (i % 7));
    const wins = Math.max(0, Math.floor(playCount * (0.85 - i * 0.012 + (i % 5) * 0.01)));
    const winRate = playCount > 0 ? Math.round((wins / playCount) * 1000) / 10 : 0;
    // 최근 참여일: 2026.05.26 기준 i일 이내
    const d = new Date(2026, 4, 26 - (i % 25));
    const pad = (n: number) => String(n).padStart(2, '0');
    const lastPlayedAt = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
    list.push({
      rank: i + 1,
      uid: 100 + i,
      nickname: RANKING_NICKNAMES[i],
      totalGp,
      playCount,
      winRate,
      lastPlayedAt,
    });
  }
  return list;
})();

// 랭킹 설정 — [CEB-BO-GZ-402] 운영 BO 실측 기본값 정합
export type RankingCriterion = '누적 GP' | '승률' | '참여 횟수';
export type RankingUpdateInterval = '실시간' | '1시간마다' | '1일마다';

export interface RankingSettings {
  top10Visible: boolean;            // OFF 운영 실측 기본값
  criterion: RankingCriterion;       // 누적 GP 기본
  updateInterval: RankingUpdateInterval; // 1일마다 운영 실측 (명세 권장: 1시간마다)
  minPlayCount: number;              // 1 기본
}

export const RANKING_SETTINGS_DEFAULT: RankingSettings = {
  top10Visible: false,
  criterion: '누적 GP',
  updateInterval: '1일마다',
  minPlayCount: 1,
};

// ─────────────── 교환 내역·운영 지갑·통계 — [CEB-BO-GZ-501] ───────────────
// 운영 BO 실측: GP 충전/GP 출금 방향, 비율 표기 "1 CELB = 1 GP" 또는 "1 GP = 1 CELB",
// 상태 "성공"(초록). BSCScan testnet 사용.

export type ExchangeDirection = 'GP 충전' | 'GP 출금';
export type ExchangeStatus = '성공' | '실패';

export interface OperationWallet {
  type: 'CHARGE' | 'WITHDRAW';
  isPrimary: boolean;
  celbBalance: number;       // 소수 8자리 표시
  bnbBalance: number;        // 소수 8자리, < 0.01 시 경고
  address: string;           // 0x... 풀 주소 (테이블·카드에서는 축약)
  status: '활성' | '비활성';
}

export interface ExchangeEntry {
  id: number;
  occurredAt: string;          // YYYY.MM.DD HH:mm
  nickname: string | null;
  uid: number | null;
  txid: string;                // 0x + 64자 풀
  direction: ExchangeDirection;
  gpAmount: number;
  celbAmount: number;
  ratioText: string;           // "1 CELB = 1 GP" / "1 GP = 1 CELB" 운영 표기
  status: ExchangeStatus;
  failReason?: string;
  walletAddress: string;       // 풀 주소 (모달 표시용)
  gpBalanceBefore: number;
  gpBalanceAfter: number;
}

export interface ExchangeOverview {
  todayCharge: number;          // 오늘 GP 충전 누계
  todayWithdraw: number;        // 오늘 GP 출금 누계
  todayCount: number;           // 오늘 교환 건수
  totalActiveUserGp: number;    // 전체 유저 보유 GP
  withdrawnUserGp: number;      // 탈퇴 유저 GP
}

export const operationWallets: OperationWallet[] = [
  {
    type: 'CHARGE',
    isPrimary: true,
    celbBalance: 4999999878,
    bnbBalance: 0.99507429,
    address: '0xF99f3d197f8f20b8f391CacC5b7b844884aC2DEE',
    status: '활성',
  },
  {
    type: 'WITHDRAW',
    isPrimary: true,
    celbBalance: 4999999878,
    bnbBalance: 0.99507429,
    address: '0xF99f3d197f8f20b8f391CacC5b7b844884aC2DEE',
    status: '활성',
  },
];

export const exchangeOverview: ExchangeOverview = {
  todayCharge: 0,
  todayWithdraw: 0,
  todayCount: 0,
  totalActiveUserGp: 2010,
  withdrawnUserGp: 37,
};

// 30건 가상 거래. 절반은 충전, 절반은 출금. 거의 모두 "성공", 한 건만 "실패" 케이스.
function genTxid(seed: number): string {
  // 0x + 64자 hex. 결정적 생성으로 매 빌드 동일.
  let s = '0x';
  for (let i = 0; i < 64; i++) {
    s += ((seed * 13 + i * 7) % 16).toString(16);
  }
  return s;
}

export const exchanges: ExchangeEntry[] = (() => {
  const list: ExchangeEntry[] = [];
  const startTs = new Date('2026-05-25T17:00:00+09:00').getTime();
  const userPool = RANKING_NICKNAMES.slice(0, 20);
  for (let i = 0; i < 30; i++) {
    const ts = new Date(startTs - i * 3 * 60 * 60 * 1000 - i * 4 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const occurredAt = `${ts.getFullYear()}.${pad(ts.getMonth() + 1)}.${pad(ts.getDate())} ${pad(ts.getHours())}:${pad(ts.getMinutes())}`;
    const isCharge = i % 2 === 0;
    const amount = (i % 5 + 1) * 5; // 5, 10, 15, 20, 25
    const isFail = i === 7; // 1건 실패
    const uid = 100 + (i % 20);
    list.push({
      id: 1000 + i,
      occurredAt,
      nickname: i % 6 === 0 ? null : userPool[i % userPool.length],
      uid: i % 6 === 0 ? null : uid,
      txid: genTxid(i + 1),
      direction: isCharge ? 'GP 충전' : 'GP 출금',
      gpAmount: amount,
      celbAmount: amount,
      ratioText: isCharge ? '1 CELB = 1 GP' : '1 GP = 1 CELB',
      status: isFail ? '실패' : '성공',
      failReason: isFail ? '잔액 부족' : undefined,
      walletAddress: `0x${(i + 200).toString(16).padStart(40, '0')}`,
      gpBalanceBefore: isCharge ? (i + 2) : (i + 10 + amount),
      gpBalanceAfter: isFail ? (i + 10) : (isCharge ? (i + 2 + amount) : (i + 10)),
    });
  }
  return list;
})();

export function truncateAddress(addr: string, head = 10, tail = 8): string {
  if (!addr || addr.length < head + tail + 3) return addr;
  return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
}

// ─────────────── 교환 설정 — [CEB-BO-GZ-502] ───────────────
export interface ExchangeSettings {
  // 교환 비율
  gpToCelbRate: number;     // 1 GP = N CELB
  celbToGpRate: number;     // 1 CELB = N GP
  // GP 충전 (CELB → GP) 한도
  chargeMin: number;        // CELB
  chargeMax: number;
  chargeDailyAmount: number;
  chargeDailyCount: number;
  // GP 출금 (GP → CELB) 한도
  withdrawMin: number;      // GP
  withdrawMax: number;
  withdrawDailyAmount: number;
  withdrawDailyCount: number;
  // 활성화 토글
  chargeEnabled: boolean;
  withdrawEnabled: boolean;
}

export const EXCHANGE_SETTINGS_DEFAULT: ExchangeSettings = {
  gpToCelbRate: 1,
  celbToGpRate: 1,
  chargeMin: 5,
  chargeMax: 10000,
  chargeDailyAmount: 10000,
  chargeDailyCount: 20,
  withdrawMin: 5,
  withdrawMax: 10000,
  withdrawDailyAmount: 10000,
  withdrawDailyCount: 20,
  chargeEnabled: true,
  withdrawEnabled: true,
};
