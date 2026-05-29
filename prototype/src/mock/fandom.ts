// 아티스트 팬덤 레벨 — 앱 [CEB-EVT-201] 팬덤 레벨 운영 mock
// 명세: [CEB-BO-EVT-000 v1.3] / [EVT-101 v1.2] / [EVT-201 v1.2] / [EVT-401 v1.0]

// 시즌 라이프사이클 4단계 — [CEB-BO-EVT-000] §4.1.1
export type FandomStatus = '준비' | '진행중' | '정산중' | '종료';
// 레벨 운영 상태 — [CEB-BO-EVT-000] §4.1.2
export type LevelStatus = '운영중' | '최고레벨';
export type RewardType = '독점 콘텐츠' | '디지털 굿즈' | '다운로드 콘텐츠' | '실물 보상' | '이벤트 참여권';
// 지급 방식 — [CEB-BO-EVT-000] §4.4
export type RewardPayout = '전체 지급' | '추첨';
// 보상 참조 연결 — [CEB-BO-EVT-201] §2.4
export type RewardRefType = '바이브' | '래플' | '이벤트' | '뱃지';
// 래플 추첨 작업 상태 — [CEB-BO-EVT-201] §2.4 (3단계)
export type LotteryStatus = '미실행' | '추첨 대기' | '추첨 완료';
// 레벨업 처리 상태 — [CEB-BO-EVT-201] §2.5
export type LevelUpProcessStatus = '대기' | '처리중' | '완료' | '실패';
// 보상 지급 현황 상태 6종 — [CEB-BO-EVT-000] §4.5
export type RewardGrantStatus =
  | '지급 대기'
  | '자동 지급 완료'
  | '추첨 대기'
  | '당첨'
  | '지급 완료'
  | '지급 실패';

export const FANDOM_STATUSES: FandomStatus[] = ['준비', '진행중', '정산중', '종료'];
export const REWARD_TYPES: RewardType[] = ['독점 콘텐츠', '디지털 굿즈', '다운로드 콘텐츠', '실물 보상', '이벤트 참여권'];
export const REWARD_PAYOUTS: RewardPayout[] = ['전체 지급', '추첨'];
export const REWARD_GRANT_STATUSES: RewardGrantStatus[] = [
  '지급 대기',
  '자동 지급 완료',
  '추첨 대기',
  '당첨',
  '지급 완료',
  '지급 실패',
];

// 생성 모달용 시즌 연도 목록 — [CEB-BO-EVT-101] §2.4
export const FANDOM_SEASON_YEARS = [2024, 2025, 2026];

// 권장 레벨링 곡선 (단위 DUK) — [CEB-BO-EVT-000] §4.2
export const RECOMMENDED_CURVE = [10000, 30000, 70000, 150000, 300000, 550000, 1000000, 1800000, 3200000, 6000000];

// 보상 타입별 입력 규칙 — [CEB-BO-EVT-201] §2.4
// payout: 자동 고정 지급 방식 / refTypes: 허용 참조 연결 / needsWinners / needsShipping / needsFile
export const REWARD_TYPE_RULES: Record<
  RewardType,
  {
    payout: RewardPayout;
    refTypes: RewardRefType[]; // 빈 배열 = 참조 연결 없음
    needsWinners: boolean;
    needsShipping: boolean;
    needsFile: boolean;
  }
> = {
  '독점 콘텐츠': { payout: '전체 지급', refTypes: [], needsWinners: false, needsShipping: false, needsFile: false },
  '디지털 굿즈': { payout: '전체 지급', refTypes: ['바이브', '뱃지'], needsWinners: false, needsShipping: false, needsFile: false },
  '다운로드 콘텐츠': { payout: '전체 지급', refTypes: [], needsWinners: false, needsShipping: false, needsFile: true },
  '실물 보상': { payout: '추첨', refTypes: ['래플'], needsWinners: true, needsShipping: true, needsFile: false },
  '이벤트 참여권': { payout: '추첨', refTypes: ['이벤트'], needsWinners: true, needsShipping: false, needsFile: false },
};

export interface FandomLevelStep {
  level: number;
  targetDuk: number;
}

export interface FandomReward {
  level: number;
  type: RewardType;
  nameKo: string;
  nameEn: string;
  nameJp: string;
  payout: RewardPayout;
  winners?: number; // 추첨 시 당첨 인원
  refType?: RewardRefType; // 참조 연결 (디지털 굿즈/실물/이벤트)
  shippingDeadline?: string; // 실물 — 배송지 입력 마감일
  fileUrl?: string; // 다운로드 콘텐츠 — 파일
  sortOrder: number; // 같은 레벨 내 노출 순서
  lotteryStatus?: LotteryStatus; // 추첨 보상의 추첨 작업 상태
}

// 레벨업 이력 — [CEB-BO-EVT-201] §2.5 레벨업 이력
export interface LevelUpHistory {
  level: number;
  achievedAt: string;
  processStatus: LevelUpProcessStatus;
  targetMemberCount: number; // 대상 회원 수 (1DUK 이상 기여)
}

// 회원별 보상 지급 현황 — [CEB-BO-EVT-201] §2.5 / [CEB-BO-EVT-401] §2.2
export interface RewardGrant {
  id: number;
  member: string;
  level: number;
  rewardName: string;
  rewardType: RewardType;
  payout: RewardPayout;
  winnerYn?: boolean; // 추첨 보상의 당첨 여부 (전체 지급은 undefined → "-")
  grantStatus: RewardGrantStatus;
  date: string;
}

export interface FandomLevel {
  id: number;
  status: FandomStatus;
  levelStatus: LevelStatus; // 현재 레벨 == 최대 레벨 → 최고레벨
  groupName: string;
  season: string;
  seasonPeriod: string;
  levels: FandomLevelStep[];
  currentLevel: number;
  accumulatedDuk: number;
  participants: number;
  updatedAt: string;
  rewards: FandomReward[];
  levelUpHistory: LevelUpHistory[];
  rewardGrants: RewardGrant[];
}

const curve = (n: number): FandomLevelStep[] =>
  RECOMMENDED_CURVE.slice(0, n).map((targetDuk, i) => ({ level: i + 1, targetDuk }));

// 레벨 운영 상태 계산 — 현재 레벨이 최대 레벨 이상이면 최고레벨
export function computeLevelStatus(currentLevel: number, levelCount: number): LevelStatus {
  return levelCount > 0 && currentLevel >= levelCount ? '최고레벨' : '운영중';
}

export const fandomLevels: FandomLevel[] = [
  {
    id: 2, status: '진행중', levelStatus: '운영중', groupName: 'V01D', season: 'V01D 팬덤 2기 (2026)', seasonPeriod: '2026.01.01 ~ 2026.12.31',
    levels: curve(10), currentLevel: 4, accumulatedDuk: 1240000, participants: 8210, updatedAt: '2026.05.28 17:21',
    rewards: [
      { level: 1, type: '독점 콘텐츠', nameKo: 'V01D 데뷔 비하인드 사진', nameEn: 'V01D Debut Behind Photo', nameJp: 'V01Dデビュー ビハインド写真', payout: '전체 지급', sortOrder: 1 },
      { level: 2, type: '다운로드 콘텐츠', nameKo: '멤버 보이스 메시지', nameEn: 'Member Voice Message', nameJp: 'メンバー ボイスメッセージ', payout: '전체 지급', fileUrl: 'voice_msg_v01d.mp3', sortOrder: 1 },
      { level: 3, type: '디지털 굿즈', nameKo: '시즌2 디지털 포토카드', nameEn: 'Season2 Digital Photocard', nameJp: 'シーズン2 デジタルフォトカード', payout: '전체 지급', refType: '바이브', sortOrder: 1 },
      { level: 4, type: '독점 콘텐츠', nameKo: 'Tug of War 미공개 영상', nameEn: 'Tug of War Unreleased Video', nameJp: 'Tug of War 未公開映像', payout: '전체 지급', sortOrder: 1 },
      { level: 5, type: '실물 보상', nameKo: '사인 포토카드 세트', nameEn: 'Signed Photocard Set', nameJp: 'サイン入りフォトカードセット', payout: '추첨', winners: 50, refType: '래플', shippingDeadline: '2026.07.31', sortOrder: 1, lotteryStatus: '미실행' },
      { level: 7, type: '이벤트 참여권', nameKo: '팬사인회 참가권', nameEn: 'Fansign Ticket', nameJp: 'ファンサイン会 参加券', payout: '추첨', winners: 20, refType: '이벤트', sortOrder: 1, lotteryStatus: '미실행' },
      { level: 10, type: '이벤트 참여권', nameKo: '콘서트 VIP 초대', nameEn: 'Concert VIP Invitation', nameJp: 'コンサートVIP招待', payout: '추첨', winners: 10, refType: '이벤트', sortOrder: 1, lotteryStatus: '미실행' },
    ],
    levelUpHistory: [
      { level: 1, achievedAt: '2026.02.10 09:30', processStatus: '완료', targetMemberCount: 5120 },
      { level: 2, achievedAt: '2026.03.05 14:00', processStatus: '완료', targetMemberCount: 6240 },
      { level: 3, achievedAt: '2026.04.18 11:20', processStatus: '완료', targetMemberCount: 7510 },
      { level: 4, achievedAt: '2026.05.20 10:00', processStatus: '완료', targetMemberCount: 8210 },
    ],
    rewardGrants: [
      { id: 1, member: '조주연팬1', level: 4, rewardName: 'Tug of War 미공개 영상', rewardType: '독점 콘텐츠', payout: '전체 지급', grantStatus: '자동 지급 완료', date: '2026.05.20 10:00' },
      { id: 2, member: 'voidlover', level: 3, rewardName: '시즌2 디지털 포토카드', rewardType: '디지털 굿즈', payout: '전체 지급', grantStatus: '자동 지급 완료', date: '2026.04.18 11:21' },
      { id: 3, member: '신노스케fan', level: 2, rewardName: '멤버 보이스 메시지', rewardType: '다운로드 콘텐츠', payout: '전체 지급', grantStatus: '자동 지급 완료', date: '2026.03.05 14:01' },
      { id: 4, member: 'kebin_p', level: 1, rewardName: 'V01D 데뷔 비하인드 사진', rewardType: '독점 콘텐츠', payout: '전체 지급', grantStatus: '지급 실패', date: '2026.02.10 09:31' },
    ],
  },
  {
    id: 5, status: '진행중', levelStatus: '운영중', groupName: 'iKON', season: 'iKON 팬덤 2기 (2026)', seasonPeriod: '2026.01.01 ~ 2026.12.31',
    levels: curve(10), currentLevel: 6, accumulatedDuk: 3400000, participants: 19200, updatedAt: '2026.05.27 14:02',
    rewards: [
      { level: 1, type: '독점 콘텐츠', nameKo: '연습실 비하인드', nameEn: 'Practice Room Behind', nameJp: '練習室ビハインド', payout: '전체 지급', sortOrder: 1 },
      { level: 5, type: '실물 보상', nameKo: '사인 앨범', nameEn: 'Signed Album', nameJp: 'サイン入りアルバム', payout: '추첨', winners: 30, refType: '래플', shippingDeadline: '2026.06.30', sortOrder: 1, lotteryStatus: '추첨 완료' },
      { level: 6, type: '디지털 굿즈', nameKo: 'iKON 스페셜 뱃지', nameEn: 'iKON Special Badge', nameJp: 'iKON スペシャルバッジ', payout: '전체 지급', refType: '뱃지', sortOrder: 1 },
    ],
    levelUpHistory: [
      { level: 5, achievedAt: '2026.05.01 09:00', processStatus: '완료', targetMemberCount: 16400 },
      { level: 6, achievedAt: '2026.05.21 09:00', processStatus: '완료', targetMemberCount: 19200 },
    ],
    rewardGrants: [
      { id: 1, member: 'ikonic_99', level: 6, rewardName: 'iKON 스페셜 뱃지', rewardType: '디지털 굿즈', payout: '전체 지급', grantStatus: '자동 지급 완료', date: '2026.05.21 09:00' },
      { id: 2, member: 'bobby_fan', level: 5, rewardName: '사인 앨범', rewardType: '실물 보상', payout: '추첨', winnerYn: true, grantStatus: '당첨', date: '2026.05.02 10:00' },
      { id: 3, member: 'jinhwan_l', level: 5, rewardName: '사인 앨범', rewardType: '실물 보상', payout: '추첨', winnerYn: false, grantStatus: '지급 완료', date: '2026.05.02 10:00' },
    ],
  },
  {
    id: 4, status: '진행중', levelStatus: '운영중', groupName: 'MADEIN', season: 'MADEIN 팬덤 2기 (2026)', seasonPeriod: '2026.01.01 ~ 2026.12.31',
    levels: curve(8), currentLevel: 3, accumulatedDuk: 420000, participants: 5300, updatedAt: '2026.05.25 11:10',
    rewards: [
      { level: 1, type: '독점 콘텐츠', nameKo: '데뷔 1주년 화보', nameEn: 'Debut 1st Anniversary Pictorial', nameJp: 'デビュー1周年 グラビア', payout: '전체 지급', sortOrder: 1 },
      { level: 3, type: '다운로드 콘텐츠', nameKo: '배경화면 팩', nameEn: 'Wallpaper Pack', nameJp: '壁紙パック', payout: '전체 지급', fileUrl: 'wallpaper_madein.zip', sortOrder: 1 },
    ],
    levelUpHistory: [
      { level: 1, achievedAt: '2026.03.12 10:00', processStatus: '완료', targetMemberCount: 3100 },
      { level: 2, achievedAt: '2026.04.20 13:00', processStatus: '완료', targetMemberCount: 4200 },
      { level: 3, achievedAt: '2026.05.24 20:05', processStatus: '처리중', targetMemberCount: 5300 },
    ],
    rewardGrants: [
      { id: 1, member: 'madein_lv', level: 3, rewardName: '배경화면 팩', rewardType: '다운로드 콘텐츠', payout: '전체 지급', grantStatus: '지급 대기', date: '2026.05.24 20:05' },
      { id: 2, member: 'gunwook_p', level: 1, rewardName: '데뷔 1주년 화보', rewardType: '독점 콘텐츠', payout: '전체 지급', grantStatus: '자동 지급 완료', date: '2026.03.12 10:00' },
    ],
  },
  {
    id: 3, status: '준비', levelStatus: '운영중', groupName: 'CELEBUS', season: 'CELEBUS 팬덤 1기 (2026)', seasonPeriod: '2026.01.01 ~ 2026.12.31',
    levels: curve(5), currentLevel: 0, accumulatedDuk: 0, participants: 0, updatedAt: '2026.05.20 09:00',
    rewards: [
      { level: 1, type: '디지털 굿즈', nameKo: 'CELEBUS 웰컴 뱃지', nameEn: 'CELEBUS Welcome Badge', nameJp: 'CELEBUS ウェルカムバッジ', payout: '전체 지급', refType: '뱃지', sortOrder: 1 },
    ],
    levelUpHistory: [],
    rewardGrants: [],
  },
  {
    id: 1, status: '진행중', levelStatus: '최고레벨', groupName: '언더라이트 (UNDER:LIGHT)', season: '언더라이트 팬덤 2기 (2026)', seasonPeriod: '2026.01.01 ~ 2026.12.31',
    levels: curve(10), currentLevel: 10, accumulatedDuk: 6400000, participants: 41000, updatedAt: '2026.05.28 08:00',
    rewards: [
      { level: 5, type: '실물 보상', nameKo: '단체 사인 굿즈', nameEn: 'Group Signed Goods', nameJp: '集団サイングッズ', payout: '추첨', winners: 100, refType: '래플', shippingDeadline: '2026.06.15', sortOrder: 1, lotteryStatus: '추첨 완료' },
      { level: 10, type: '이벤트 참여권', nameKo: '단독 팬미팅 초대', nameEn: 'Solo Fanmeeting Invitation', nameJp: '単独ファンミーティング招待', payout: '추첨', winners: 50, refType: '이벤트', sortOrder: 1, lotteryStatus: '추첨 대기' },
    ],
    levelUpHistory: [
      { level: 5, achievedAt: '2026.03.01 12:00', processStatus: '완료', targetMemberCount: 28000 },
      { level: 10, achievedAt: '2026.05.18 15:00', processStatus: '대기', targetMemberCount: 41000 },
    ],
    rewardGrants: [
      { id: 1, member: 'ul_master', level: 5, rewardName: '단체 사인 굿즈', rewardType: '실물 보상', payout: '추첨', winnerYn: true, grantStatus: '지급 완료', date: '2026.03.02 15:00' },
      { id: 2, member: 'light_seeker', level: 10, rewardName: '단독 팬미팅 초대', rewardType: '이벤트 참여권', payout: '추첨', grantStatus: '추첨 대기', date: '2026.05.18 15:00' },
    ],
  },
  {
    id: 7, status: '정산중', levelStatus: '최고레벨', groupName: 'V01D', season: 'V01D 팬덤 1기 (2025)', seasonPeriod: '2025.01.01 ~ 2025.12.31',
    levels: curve(10), currentLevel: 10, accumulatedDuk: 6100000, participants: 7200, updatedAt: '2026.01.02 10:00',
    rewards: [
      { level: 5, type: '실물 보상', nameKo: '1기 기념 사인 굿즈', nameEn: '1st Season Signed Goods', nameJp: '1期記念サイングッズ', payout: '추첨', winners: 30, refType: '래플', shippingDeadline: '2026.01.31', sortOrder: 1, lotteryStatus: '추첨 대기' },
      { level: 10, type: '이벤트 참여권', nameKo: '1기 팬미팅 초대', nameEn: '1st Season Fanmeeting', nameJp: '1期ファンミーティング招待', payout: '추첨', winners: 20, refType: '이벤트', sortOrder: 1, lotteryStatus: '미실행' },
    ],
    levelUpHistory: [
      { level: 5, achievedAt: '2025.06.10 12:00', processStatus: '완료', targetMemberCount: 4800 },
      { level: 10, achievedAt: '2025.12.20 18:00', processStatus: '대기', targetMemberCount: 7200 },
    ],
    rewardGrants: [
      { id: 1, member: 'voidlover', level: 5, rewardName: '1기 기념 사인 굿즈', rewardType: '실물 보상', payout: '추첨', grantStatus: '추첨 대기', date: '2025.12.20 18:00' },
      { id: 2, member: 'first_fan', level: 10, rewardName: '1기 팬미팅 초대', rewardType: '이벤트 참여권', payout: '추첨', grantStatus: '지급 대기', date: '2025.12.20 18:00' },
    ],
  },
  {
    id: 6, status: '종료', levelStatus: '최고레벨', groupName: 'iKON', season: 'iKON 팬덤 1기 (2025)', seasonPeriod: '2025.01.01 ~ 2025.12.31',
    levels: curve(10), currentLevel: 10, accumulatedDuk: 5800000, participants: 16400, updatedAt: '2025.12.31 23:59',
    rewards: [
      { level: 5, type: '실물 보상', nameKo: '1기 사인 앨범', nameEn: '1st Season Signed Album', nameJp: '1期サイン入りアルバム', payout: '추첨', winners: 30, refType: '래플', shippingDeadline: '2025.12.20', sortOrder: 1, lotteryStatus: '추첨 완료' },
      { level: 10, type: '이벤트 참여권', nameKo: '1기 콘서트 초대', nameEn: '1st Season Concert', nameJp: '1期コンサート招待', payout: '추첨', winners: 20, refType: '이벤트', sortOrder: 1, lotteryStatus: '추첨 완료' },
    ],
    levelUpHistory: [
      { level: 5, achievedAt: '2025.07.01 12:00', processStatus: '완료', targetMemberCount: 12000 },
      { level: 10, achievedAt: '2025.12.10 18:00', processStatus: '완료', targetMemberCount: 16400 },
    ],
    rewardGrants: [
      { id: 1, member: 'ikonic_og', level: 10, rewardName: '1기 콘서트 초대', rewardType: '이벤트 참여권', payout: '추첨', winnerYn: true, grantStatus: '지급 완료', date: '2025.12.11 09:00' },
      { id: 2, member: 'bobby_fan', level: 5, rewardName: '1기 사인 앨범', rewardType: '실물 보상', payout: '추첨', winnerYn: true, grantStatus: '지급 완료', date: '2025.07.02 10:00' },
    ],
  },
];

export const FANDOM_SEASONS = Array.from(new Set(fandomLevels.map((f) => f.season)));

export const FANDOM_GROUPS = ['V01D', 'iKON', 'MADEIN', 'CELEBUS', '언더라이트 (UNDER:LIGHT)'];

export function getFandomById(id: number): FandomLevel | undefined {
  return fandomLevels.find((f) => f.id === id);
}
