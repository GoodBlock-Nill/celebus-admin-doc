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

// 아티스트 그룹 — [CEB-BO-013] v7.x 정합. 게임·배너 공통 enum
export type ArtistGroup = 'V01D' | 'iKON' | 'CELEBUS' | 'MADEIN' | 'UNDER:LIGHT';
export const ARTIST_GROUPS: ArtistGroup[] = ['V01D', 'iKON', 'CELEBUS', 'MADEIN', 'UNDER:LIGHT'];

// 공통 보상 필드 — 모든 게임 유형 (PM·ST). 신규 기능 [GZ-000 v2.4] §5 정합
// 응모권·덕력은 1인당 고정 개수 균등 분배. 0 = 미지급
export interface GameRewardExtra {
  ticketReward: number;       // 정답자(PM)·생존자(ST) 1인당 지급 응모권 (장)
  dukReward: number;          // 정답자·생존자 1인당 지급 덕력 (점, DUK 단위)
  // ST 전용: 탈락자 응모권 — 기존 STGame.eliminatedTicket 통합 가능 (현재는 별도 필드 유지)
}

export interface PMGame extends GameRewardExtra {
  id: number;
  type: 'PM';
  artistGroup: ArtistGroup;   // 신규 — 게임이 귀속되는 아티스트 그룹 (필수 단일)
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

export interface STGame extends GameRewardExtra {
  id: number;
  type: 'ST';
  artistGroup: ArtistGroup;   // 신규 — 동일
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

// PM 게임 mock — 상태 다양 + 운영 BO 패턴 정합 + 아티스트·응모권·덕력 보강
const PM_GAMES: PMGame[] = [
  { id: 1, type: 'PM', artistGroup: 'V01D', title: 'V01D가 이번 주 인기가요 1위를 할까요?', titleEN: 'Will V01D take #1 on Inkigayo this week?', titleJP: 'V01Dが今週の人気歌謡で1位を取るか?', description: 'V01D의 신곡 컴백 1주차 인기가요 1위 예측', status: '진행중', participants: 234, totalPrize: 10000, participationCost: 1, boostingCost: 1, boostingMultiplier: 2, votingStart: '2026.05.20', votingEnd: '2026.05.24', resultAnnounceDate: '2026.05.25', createdAt: '2026.05.20 14:30', admin: 'nill', hasParticipants: true, ticketReward: 1, dukReward: 50 },
  { id: 2, type: 'PM', artistGroup: 'iKON', title: '오늘 한국 vs 일본 야구 경기 결과는?', titleEN: 'Korea vs Japan baseball result today?', titleJP: '今日の韓国対日本野球の結果は?', description: '한일전 야구 경기 승리 팀 예측', status: '결과대기', participants: 421, totalPrize: 30000, participationCost: 5, boostingCost: 3, boostingMultiplier: 3, votingStart: '2026.05.21', votingEnd: '2026.05.22', resultAnnounceDate: '2026.05.23', createdAt: '2026.05.21 18:00', admin: 'superjay', hasParticipants: true, ticketReward: 2, dukReward: 100 },
  { id: 3, type: 'PM', artistGroup: 'CELEBUS', title: '신곡 음원 차트 진입 순위는?', titleEN: 'New song chart entry ranking?', titleJP: '新曲の音源チャート進入順位は?', description: '발매 첫날 멜론 톱100 진입 순위 예측', status: '결과확정', participants: 156, totalPrize: 5000, participationCost: 1, boostingCost: 1, boostingMultiplier: 2, votingStart: '2026.05.18', votingEnd: '2026.05.19', resultAnnounceDate: '2026.05.20', createdAt: '2026.05.18 10:00', admin: 'nill', hasParticipants: true, ticketReward: 1, dukReward: 30 },
  { id: 4, type: 'PM', artistGroup: 'MADEIN', title: '콘서트 굿즈 매진 시간?', titleEN: 'Concert merch sold-out time?', titleJP: 'コンサートグッズ売り切れ時間?', description: '월드투어 굿즈 1차분 매진까지 걸린 시간', status: '종료', participants: 89, totalPrize: 3000, participationCost: 1, boostingCost: 1, boostingMultiplier: 2, votingStart: '2026.05.15', votingEnd: '2026.05.16', resultAnnounceDate: '2026.05.17', createdAt: '2026.05.15 09:00', admin: 'superjay', ticketReward: 1, dukReward: 20 },
  { id: 5, type: 'PM', artistGroup: 'V01D', title: '신규 게임 임시저장 테스트', titleEN: 'Draft test', titleJP: '一時保存テスト', description: '임시저장 상태 테스트용', status: '임시저장', participants: 0, totalPrize: 1000, participationCost: 1, boostingCost: 1, boostingMultiplier: 2, votingEnd: '2026.05.30', resultAnnounceDate: '2026.05.31', createdAt: '2026.05.22 11:00', admin: 'nill', ticketReward: 0, dukReward: 0 },
  { id: 6, type: 'PM', artistGroup: 'UNDER:LIGHT', title: '게시대기 PM 테스트', titleEN: 'Ready test', titleJP: '掲示待機テスト', description: '게시대기 상태 테스트용', status: '게시대기', participants: 0, totalPrize: 2000, participationCost: 1, boostingCost: 1, boostingMultiplier: 2, votingEnd: '2026.05.28', resultAnnounceDate: '2026.05.29', createdAt: '2026.05.22 12:00', admin: 'nill', ticketReward: 1, dukReward: 10 },
];

// ST 게임 mock — 아티스트·응모권·덕력 보강
const ST_GAMES: STGame[] = [
  { id: 101, type: 'ST', artistGroup: 'V01D', title: '제 1회 V01D 모의고사', titleEN: 'V01D Mock Test #1', titleJP: 'V01D模擬試験 #1', description: 'V01D 팬덤 지식 10문제 트리비아', status: '진행중', participants: 312, maxParticipants: 500, maxPrize: 10000, participationCost: 50, startDateTime: '2026.05.22 13:00', createdAt: '2026.05.21 09:00', admin: 'nill', ticketReward: 3, dukReward: 200 },
  { id: 102, type: 'ST', artistGroup: 'CELEBUS', title: 'K-pop 데뷔연도 퀴즈', titleEN: 'K-pop Debut Year Quiz', titleJP: 'K-popデビュー年クイズ', description: '주요 그룹 데뷔연도 트리비아', status: '게시대기', participants: 0, maxParticipants: 1000, maxPrize: 20000, participationCost: 40, startDateTime: '2026.05.24 20:00', createdAt: '2026.05.20 16:00', admin: 'superjay', ticketReward: 5, dukReward: 300 },
  { id: 103, type: 'ST', artistGroup: 'iKON', title: '신곡 가사 빈칸 채우기', titleEN: 'Fill the Lyrics', titleJP: '新曲歌詞穴埋め', description: '최신 컴백곡 가사 트리비아', status: '종료', participants: 478, maxParticipants: 500, maxPrize: 5000, participationCost: 25, startDateTime: '2026.05.18 21:00', createdAt: '2026.05.17 14:00', admin: 'nill', ticketReward: 2, dukReward: 100 },
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
// [GZ-000 v2.4] §5 — 응모권·덕력은 정답자 1인당 고정 개수 균등 분배
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
  // 신규: 응모권·덕력 분배 결과 (게임 생성 시 입력한 1인당 값 × 정답자 수)
  perShareTicket: number;       // 1인당 응모권 (입력값 그대로)
  perShareDuk: number;          // 1인당 덕력 (입력값 그대로)
  totalTicketDistributed: number; // 총 지급 응모권 (perShareTicket × correctCount)
  totalDukDistributed: number;    // 총 지급 덕력
  rewardStatus: '미지급' | '지급 완료';
  rewardPaidAt: string | null;
}

export function getPMResultReward(gameId: number): PMResultReward {
  const game = getGameById(gameId);
  if (!game || game.type !== 'PM') {
    return { resultTitle: null, result: null, resultDescription: null, resultLink: null, totalPrize: 0, correctCount: 0, undistributed: 0, withdrawnUserUnpaid: 0, perShareGP: 0, perShareTicket: 0, perShareDuk: 0, totalTicketDistributed: 0, totalDukDistributed: 0, rewardStatus: '미지급', rewardPaidAt: null };
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
      perShareTicket: game.ticketReward,
      perShareDuk: game.dukReward,
      totalTicketDistributed: game.ticketReward * correct,
      totalDukDistributed: game.dukReward * correct,
      rewardStatus: game.status === '종료' ? '지급 완료' : '미지급',
      rewardPaidAt: game.status === '종료' ? '2026.05.17 14:00' : null,
    };
  }
  return { resultTitle: null, result: null, resultDescription: null, resultLink: null, totalPrize: game.totalPrize, correctCount: 0, undistributed: game.totalPrize, withdrawnUserUnpaid: 0, perShareGP: 0, perShareTicket: game.ticketReward, perShareDuk: game.dukReward, totalTicketDistributed: 0, totalDukDistributed: 0, rewardStatus: '미지급', rewardPaidAt: null };
}

// GP 변동 내역 — [CEB-BO-GZ-601] v1.6 정합
// 변동 유형 7종 (전체 + 6): 참여 / 부스팅 / 환불 / 보상 / GP 충전 / GP 출금
// 게임유형: '' (게임 외) / PM / ST
// 운영 BO 실측 시점 환급은 PM 자동 환불에 통합. 본 mock은 운영 분류대로 환불만 노출.
export type GPHistoryType = '' | '참여' | '부스팅' | '환불' | '보상' | 'GP 충전' | 'GP 출금';
export type GPHistoryGameType = '' | 'PM' | 'ST';

export interface GPHistoryEntry {
  id: number;
  historyId: string;          // 변동 ID (예: GPC000605)
  occurredAt: string;         // YYYY.MM.DD HH:mm:ss
  nickname: string | null;
  uid: number | null;
  walletAddress: string;      // 풀 주소 (모달 표시용)
  type: GPHistoryType;
  gameType: GPHistoryGameType;
  amount: number;             // +/- GP
  balanceAfter: number;
  notes: string;
}

const SEED_NICKNAMES = [
  'nanananna1', 'sunday1', 'zziong', 'from_june', 'stay.yourself.skz',
  'ygfam', 'yewon1640', 'yoon', 'skdud', 'hyeonny',
  'mozzi1118', 'haeul22', '1311', 'su_suy', 'hhhh',
  'sssssouffleeeee', 'sxlvxr', 'manju', 'sally410504', 'yebin',
];

// 변동 유형별 가상 데이터 생성. 운영 실측 패턴 + 게임 변동 다양화 (PM/ST 보상·참여·부스팅·환불)
export const gpHistory: GPHistoryEntry[] = (() => {
  const list: GPHistoryEntry[] = [];
  const startTs = new Date('2026-05-26T06:41:00+09:00').getTime();
  // 분포: GP 출석체크 30 + PM/ST 변동 50 + 충전/출금 20 = 100
  const patterns: { type: GPHistoryType; gameType: GPHistoryGameType; amount: number; notes: string }[] = [];
  for (let i = 0; i < 30; i++) patterns.push({ type: '', gameType: '', amount: 5, notes: 'GP 출석체크' });
  for (let i = 0; i < 12; i++) patterns.push({ type: '참여', gameType: 'PM', amount: -((i % 5 + 1) * 2), notes: 'PM 게임 참여' });
  for (let i = 0; i < 8; i++) patterns.push({ type: '부스팅', gameType: 'PM', amount: -((i % 3 + 1) * 2), notes: 'PM 부스팅' });
  for (let i = 0; i < 10; i++) patterns.push({ type: '보상', gameType: 'PM', amount: ((i % 4 + 1) * 20), notes: 'PM 정답 보상' });
  for (let i = 0; i < 6; i++) patterns.push({ type: '환불', gameType: 'PM', amount: ((i % 3 + 1) * 5), notes: 'PM 환불' });
  for (let i = 0; i < 8; i++) patterns.push({ type: '참여', gameType: 'ST', amount: -((i % 5 + 1) * 3), notes: 'ST 게임 참여' });
  for (let i = 0; i < 6; i++) patterns.push({ type: '보상', gameType: 'ST', amount: ((i % 3 + 1) * 50), notes: 'ST 최종 생존 보상' });
  for (let i = 0; i < 12; i++) patterns.push({ type: 'GP 충전', gameType: '', amount: ((i % 4 + 1) * 5), notes: 'CELB → GP 교환' });
  for (let i = 0; i < 8; i++) patterns.push({ type: 'GP 출금', gameType: '', amount: -((i % 4 + 1) * 5), notes: 'GP → CELB 교환' });

  // 닉네임 풀: SEED 20 + 추가 20 (RANKING_NICKNAMES는 아래에 정의되어 순환 참조 회피)
  const extraNicks = [
    'lily', 'cromatica', 'holly', 'lajkdream', 'dding',
    'oliver', '4nellie2', 'chia', 'sara', '3xwoh_s',
    'yumyelim', 'nieumi', 'rex17', 'sohyun', 'starlight99',
    'pink_blink42', 'carat_love77', 'wishful28', 'kepler_fan15', 'love_guys60',
  ];
  const nickPool = [...SEED_NICKNAMES, ...extraNicks];
  let runningBalance = 100;
  for (let i = 0; i < patterns.length; i++) {
    const p = patterns[i];
    const ts = new Date(startTs - i * 60 * 60 * 1000 - i * 13 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${ts.getFullYear()}.${pad(ts.getMonth() + 1)}.${pad(ts.getDate())} ${pad(ts.getHours())}:${pad(ts.getMinutes())}:${pad(ts.getSeconds())}`;
    runningBalance = Math.max(0, runningBalance + p.amount + (i % 7));
    const uid = 100 + (i % nickPool.length);
    list.push({
      id: i + 1,
      historyId: `GPC${(600 + i).toString().padStart(6, '0')}`,
      occurredAt: dateStr,
      nickname: nickPool[i % nickPool.length],
      uid,
      walletAddress: `0x${((i + 0x4a47c) * 0x100).toString(16).padStart(40, '0').slice(0, 40)}`,
      type: p.type,
      gameType: p.gameType,
      amount: p.amount,
      balanceAfter: runningBalance,
      notes: p.notes,
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

// ─────────────── 지갑 관리 — [CEB-BO-GZ-503] ───────────────
// 운영 BO 실측: 활성 지갑 [삭제] disabled, [대표] 지갑 [비활성화] 무반응 가능성.
// 풍부한 가상 mock 5개 (충전·출금 [대표] + 비활성 1 + 일반 1 + 가스 부족 1)

export type WalletType = '충전용' | '출금용';
export type WalletStatus = '활성' | '비활성';

export interface ManagedWallet {
  id: number;
  type: WalletType;
  isPrimary: boolean;
  address: string;
  privateKeyMasked?: string; // 출금용은 표시 (e.g., "PK: 94d2....97ef")
  celbBalance: number;
  bnbBalance: number;
  status: WalletStatus;
  registeredAt: string; // YYYY.MM.DD HH:mm
}

export const managedWallets: ManagedWallet[] = [
  {
    id: 1,
    type: '충전용',
    isPrimary: true,
    address: '0xF99f3d197f8f20b8f391CacC5b7b844884aC2DEE',
    celbBalance: 4999999878,
    bnbBalance: 0.99507429,
    status: '활성',
    registeredAt: '2026.03.25 11:20',
  },
  {
    id: 2,
    type: '출금용',
    isPrimary: true,
    address: '0xF99f3d197f8f20b8f391CacC5b7b844884aC2DEE',
    privateKeyMasked: 'PK: 0xe3....adba',
    celbBalance: 4999999878,
    bnbBalance: 0.99507429,
    status: '활성',
    registeredAt: '2026.03.25 11:20',
  },
  {
    id: 3,
    type: '충전용',
    isPrimary: false,
    address: '0x4a47C57d5db6e3140FE964766117Ce740ab6fdDF',
    celbBalance: 152000,
    bnbBalance: 0.04500000,
    status: '활성',
    registeredAt: '2026.04.18 09:42',
  },
  {
    id: 4,
    type: '출금용',
    isPrimary: false,
    address: '0xCE24805AcB6f19be3E5145903EaB80D61F7ef3a9',
    privateKeyMasked: 'PK: 0xa1....88ef',
    celbBalance: 89000,
    bnbBalance: 0.00350000,
    status: '활성',
    registeredAt: '2026.04.22 16:08',
  },
  {
    id: 5,
    type: '충전용',
    isPrimary: false,
    address: '0xBADf00DBADf00DBADf00DBADf00DBADf00DBADf00',
    celbBalance: 0,
    bnbBalance: 0,
    status: '비활성',
    registeredAt: '2026.05.10 14:55',
  },
];
