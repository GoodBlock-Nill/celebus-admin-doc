// 팬덤 레벨(EVT) MVP — [CEB-BO-EVT-101] v1.3 SSOT
// ERD: fandom_level_season / fandom_level / fandom_level_reward / fandom_level_*_job (SQL 2, 8 테이블)
// 시즌 주기: 연 1회 (매년 1.1 ~ 12.31), 팬클럽 N기 흐름
// 멀티아티스트: 🔴 Critical — 곡선·시즌·보상 모두 아티스트별

export type SeasonStatus = 'DRAFT' | 'ACTIVE' | 'SETTLING' | 'CLOSED';
export type JobStatus = 'READY' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type CurveFunction = 'LINEAR' | 'POWER' | 'CUSTOM';
export type RewardType = 'EXCLUSIVE_CONTENT' | 'DIGITAL' | 'DOWNLOAD' | 'GOODS' | 'EVENT';
export type DistributionType = 'ALL' | 'LOTTERY';
export type ArtistGroup = 'V01D' | 'iKON' | 'CELEBUS';

export interface FandomCurve {
  id: number;
  artistGroup: ArtistGroup;
  func: CurveFunction;
  formula: string;
  maxLevel: number;
  updatedBy: string;
  updatedAt: string;
}

export interface FandomSeason {
  id: number;
  artistGroup: ArtistGroup;
  seasonYear: number;
  seasonName: string;
  status: SeasonStatus;
  startDt: string;
  endDt: string;
  memberCount: number;
  avgLevel: number;
  maxLevel: number;
  levelUpJobStatus: JobStatus;
  rewardJobStatus: JobStatus;
}

export interface FandomReward {
  id: number;
  artistGroup: ArtistGroup;
  level: number;
  rewardType: RewardType;
  distributionType: DistributionType;
  titleKO: string;
  description: string;
  active: boolean;
  recipientCount: number;
}

const CURVE_FORMULAS: Record<CurveFunction, string> = {
  LINEAR: 'level = floor(point / 100)',
  POWER: 'level = floor(sqrt(point / 50))',
  CUSTOM: '레벨별 직접 입력 (15단계)',
};

export const curves: FandomCurve[] = [
  { id: 1, artistGroup: 'V01D', func: 'POWER', formula: CURVE_FORMULAS.POWER, maxLevel: 30, updatedBy: 'nill', updatedAt: '2026.04.20 14:30' },
  { id: 2, artistGroup: 'iKON', func: 'LINEAR', formula: CURVE_FORMULAS.LINEAR, maxLevel: 25, updatedBy: 'carl', updatedAt: '2026.04.18 09:45' },
  { id: 3, artistGroup: 'CELEBUS', func: 'CUSTOM', formula: CURVE_FORMULAS.CUSTOM, maxLevel: 15, updatedBy: 'admin', updatedAt: '2026.01.05 11:00' },
];

export const seasons: FandomSeason[] = [
  {
    id: 1,
    artistGroup: 'V01D',
    seasonYear: 2026,
    seasonName: 'V01D 팬덤 2기 (2026)',
    status: 'ACTIVE',
    startDt: '2026.01.01 00:00',
    endDt: '2026.12.31 23:59',
    memberCount: 1240,
    avgLevel: 12.4,
    maxLevel: 28,
    levelUpJobStatus: 'PROCESSING',
    rewardJobStatus: 'READY',
  },
  {
    id: 2,
    artistGroup: 'iKON',
    seasonYear: 2026,
    seasonName: 'iKON 팬덤 12기 (2026)',
    status: 'ACTIVE',
    startDt: '2026.01.01 00:00',
    endDt: '2026.12.31 23:59',
    memberCount: 980,
    avgLevel: 14.2,
    maxLevel: 25,
    levelUpJobStatus: 'PROCESSING',
    rewardJobStatus: 'READY',
  },
  {
    id: 3,
    artistGroup: 'CELEBUS',
    seasonYear: 2026,
    seasonName: 'CELEBUS 팬덤 2기 (2026)',
    status: 'ACTIVE',
    startDt: '2026.01.01 00:00',
    endDt: '2026.12.31 23:59',
    memberCount: 620,
    avgLevel: 8.7,
    maxLevel: 15,
    levelUpJobStatus: 'PROCESSING',
    rewardJobStatus: 'READY',
  },
  {
    id: 4,
    artistGroup: 'V01D',
    seasonYear: 2025,
    seasonName: 'V01D 팬덤 1기 (2025)',
    status: 'CLOSED',
    startDt: '2025.01.01 00:00',
    endDt: '2025.12.31 23:59',
    memberCount: 1102,
    avgLevel: 18.5,
    maxLevel: 30,
    levelUpJobStatus: 'COMPLETED',
    rewardJobStatus: 'COMPLETED',
  },
  {
    id: 5,
    artistGroup: 'iKON',
    seasonYear: 2025,
    seasonName: 'iKON 팬덤 11기 (2025)',
    status: 'CLOSED',
    startDt: '2025.01.01 00:00',
    endDt: '2025.12.31 23:59',
    memberCount: 850,
    avgLevel: 16.3,
    maxLevel: 25,
    levelUpJobStatus: 'COMPLETED',
    rewardJobStatus: 'FAILED',
  },
  {
    id: 6,
    artistGroup: 'V01D',
    seasonYear: 2027,
    seasonName: 'V01D 팬덤 3기 (2027)',
    status: 'DRAFT',
    startDt: '2027.01.01 00:00',
    endDt: '2027.12.31 23:59',
    memberCount: 0,
    avgLevel: 0,
    maxLevel: 0,
    levelUpJobStatus: 'READY',
    rewardJobStatus: 'READY',
  },
];

export const rewards: FandomReward[] = [
  { id: 1, artistGroup: 'V01D', level: 5, rewardType: 'EXCLUSIVE_CONTENT', distributionType: 'ALL', titleKO: 'V01D 데뷔 비하인드 영상', description: '데뷔 비하인드 5분 풀버전', active: true, recipientCount: 234 },
  { id: 2, artistGroup: 'V01D', level: 10, rewardType: 'DIGITAL', distributionType: 'ALL', titleKO: 'V01D 디지털 포토북', description: '15장 고화질 디지털 포토북', active: true, recipientCount: 156 },
  { id: 3, artistGroup: 'V01D', level: 15, rewardType: 'GOODS', distributionType: 'LOTTERY', titleKO: 'V01D 사인 폴라로이드 (추첨)', description: '레벨 15 도달자 중 추첨 50명', active: true, recipientCount: 50 },
  { id: 4, artistGroup: 'V01D', level: 20, rewardType: 'EVENT', distributionType: 'LOTTERY', titleKO: '팬미팅 초대권 (추첨)', description: '레벨 20 도달자 중 추첨 10명', active: true, recipientCount: 10 },
  { id: 5, artistGroup: 'V01D', level: 30, rewardType: 'GOODS', distributionType: 'ALL', titleKO: 'V01D 한정판 굿즈 세트', description: '레벨 30 달성자 전원 한정 굿즈', active: true, recipientCount: 12 },
  { id: 6, artistGroup: 'iKON', level: 10, rewardType: 'DOWNLOAD', distributionType: 'ALL', titleKO: 'iKON 미공개 음원', description: '컴백 사전 미공개 트랙 1곡', active: true, recipientCount: 89 },
  { id: 7, artistGroup: 'iKON', level: 25, rewardType: 'EVENT', distributionType: 'LOTTERY', titleKO: '쇼케이스 초대권 (추첨)', description: '레벨 25 도달자 중 추첨 20명', active: true, recipientCount: 20 },
  { id: 8, artistGroup: 'CELEBUS', level: 10, rewardType: 'EXCLUSIVE_CONTENT', distributionType: 'ALL', titleKO: 'CELEBUS 운영자 메시지', description: '1주년 기념 운영진 영상 메시지', active: false, recipientCount: 0 },
];

export const seasonStats = {
  active: seasons.filter((s) => s.status === 'ACTIVE').length,
  settling: seasons.filter((s) => s.status === 'SETTLING').length,
  closed: seasons.filter((s) => s.status === 'CLOSED').length,
  draft: seasons.filter((s) => s.status === 'DRAFT').length,
  totalMembers: seasons.filter((s) => s.status === 'ACTIVE').reduce((sum, s) => sum + s.memberCount, 0),
};

export function getSeasonById(id: number): FandomSeason | undefined {
  return seasons.find((s) => s.id === id);
}
