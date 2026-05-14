// 덕력(DUK) MVP — [CEB-BO-DUK-*] SSOT
// ERD: fan_power_season / fan_power_season_ranking / fan_power_limit / user_fan_power_history (SQL 2, 10 테이블)
// 멀티아티스트: 글로벌 시즌 마스터 + 아티스트별 독립 랭킹 산출 ([CEB-BO-100] §3 결정사항 ⑨)
// 시즌 자체는 NULL artist_group_id (글로벌), 랭킹은 아티스트별 분리

export type DukSeasonStatus = 'DRAFT' | 'ACTIVE' | 'SETTLING' | 'CLOSED';
export type HistorySourceType =
  | 'FAN_QUEST_REWARD'
  | 'DAILY_MISSION'
  | 'BIVE_ACTIVITY'
  | 'PM_PARTICIPATION'
  | 'TRIVIA_PARTICIPATION'
  | 'RANKING_REWARD'
  | 'SUPPORT_PARTICIPATION'
  | 'STORY_QUEST_REWARD';
export type HistoryType = 'EARN' | 'USE';
export type ArtistGroup = 'V01D' | 'iKON' | 'CELEBUS';

export interface DukSeason {
  id: number;
  name: string;
  status: DukSeasonStatus;
  startDt: string;
  endDt: string;
  totalParticipants: number;
  rankingReloadAt: string | null;
}

export interface DukRanking {
  rank: number;
  artistGroup: ArtistGroup;
  memberId: number;
  nickname: string;
  fanPower: number;
  deltaWeekly: number;
}

export interface DukLimit {
  id: number;
  artistGroup: ArtistGroup;
  scope: '글로벌' | '아티스트별';
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  updatedBy: string;
  updatedAt: string;
}

export interface DukHistory {
  id: number;
  memberId: number;
  nickname: string;
  artistGroup: ArtistGroup;
  historyType: HistoryType;
  sourceType: HistorySourceType;
  sourceRefName: string;
  delta: number;
  balanceAfter: number;
  createdAt: string;
}

const SOURCE_TYPE_LABEL: Record<HistorySourceType, string> = {
  FAN_QUEST_REWARD: '팬퀘스트 보상',
  DAILY_MISSION: '일일 미션',
  BIVE_ACTIVITY: 'BIVE 활동',
  PM_PARTICIPATION: 'PM 참여',
  TRIVIA_PARTICIPATION: '트리비아 참여',
  RANKING_REWARD: '랭킹 보상',
  SUPPORT_PARTICIPATION: '응원하기 참여',
  STORY_QUEST_REWARD: '스토리 퀘스트',
};

export function getSourceTypeLabel(t: HistorySourceType): string {
  return SOURCE_TYPE_LABEL[t];
}

export const seasons: DukSeason[] = [
  {
    id: 1,
    name: '2026 Spring 글로벌 시즌',
    status: 'ACTIVE',
    startDt: '2026.03.01 00:00',
    endDt: '2026.05.31 23:59',
    totalParticipants: 2840,
    rankingReloadAt: '2026.05.10 18:00',
  },
  {
    id: 2,
    name: '2026 Summer 글로벌 시즌',
    status: 'DRAFT',
    startDt: '2026.06.01 00:00',
    endDt: '2026.08.31 23:59',
    totalParticipants: 0,
    rankingReloadAt: null,
  },
  {
    id: 3,
    name: '2025 Winter 글로벌 시즌',
    status: 'CLOSED',
    startDt: '2025.12.01 00:00',
    endDt: '2026.02.28 23:59',
    totalParticipants: 2410,
    rankingReloadAt: '2026.03.01 00:30',
  },
  {
    id: 4,
    name: '2025 Autumn 글로벌 시즌',
    status: 'CLOSED',
    startDt: '2025.09.01 00:00',
    endDt: '2025.11.30 23:59',
    totalParticipants: 1980,
    rankingReloadAt: '2025.12.01 00:25',
  },
];

export const rankings: DukRanking[] = [
  // V01D Top 10
  { rank: 1, artistGroup: 'V01D', memberId: 1001, nickname: 'mooncat', fanPower: 28450, deltaWeekly: +320 },
  { rank: 2, artistGroup: 'V01D', memberId: 1042, nickname: 'lunaria', fanPower: 26120, deltaWeekly: +280 },
  { rank: 3, artistGroup: 'V01D', memberId: 1087, nickname: 'stardust', fanPower: 24890, deltaWeekly: +210 },
  { rank: 4, artistGroup: 'V01D', memberId: 1156, nickname: 'midnight', fanPower: 22100, deltaWeekly: +180 },
  { rank: 5, artistGroup: 'V01D', memberId: 1203, nickname: 'aurora', fanPower: 20340, deltaWeekly: +150 },
  // iKON Top 5
  { rank: 1, artistGroup: 'iKON', memberId: 2010, nickname: 'bobby', fanPower: 31200, deltaWeekly: +410 },
  { rank: 2, artistGroup: 'iKON', memberId: 2045, nickname: 'donghyuk', fanPower: 28900, deltaWeekly: +350 },
  { rank: 3, artistGroup: 'iKON', memberId: 2098, nickname: 'jinhwan', fanPower: 25700, deltaWeekly: +290 },
  { rank: 4, artistGroup: 'iKON', memberId: 2134, nickname: 'junhoe', fanPower: 23450, deltaWeekly: +240 },
  { rank: 5, artistGroup: 'iKON', memberId: 2189, nickname: 'yunhyeong', fanPower: 21200, deltaWeekly: +200 },
  // CELEBUS Top 3
  { rank: 1, artistGroup: 'CELEBUS', memberId: 3001, nickname: 'celest', fanPower: 18900, deltaWeekly: +150 },
  { rank: 2, artistGroup: 'CELEBUS', memberId: 3042, nickname: 'cosmos', fanPower: 16450, deltaWeekly: +120 },
  { rank: 3, artistGroup: 'CELEBUS', memberId: 3087, nickname: 'nebula', fanPower: 14200, deltaWeekly: +90 },
];

export const limits: DukLimit[] = [
  { id: 0, artistGroup: 'V01D', scope: '글로벌', dailyLimit: 500, weeklyLimit: 3000, monthlyLimit: 10000, updatedBy: 'admin', updatedAt: '2026.01.01 00:00' },
  { id: 1, artistGroup: 'V01D', scope: '아티스트별', dailyLimit: 400, weeklyLimit: 2400, monthlyLimit: 8000, updatedBy: 'nill', updatedAt: '2026.03.15 11:30' },
  { id: 2, artistGroup: 'iKON', scope: '아티스트별', dailyLimit: 400, weeklyLimit: 2400, monthlyLimit: 8000, updatedBy: 'carl', updatedAt: '2026.03.10 09:45' },
  { id: 3, artistGroup: 'CELEBUS', scope: '아티스트별', dailyLimit: 300, weeklyLimit: 1800, monthlyLimit: 6000, updatedBy: 'admin', updatedAt: '2026.02.20 14:00' },
];

export const memberHistory: DukHistory[] = [
  { id: 1, memberId: 1001, nickname: 'mooncat', artistGroup: 'V01D', historyType: 'EARN', sourceType: 'FAN_QUEST_REWARD', sourceRefName: 'V01D 데뷔 100일 퀘스트', delta: +200, balanceAfter: 28450, createdAt: '2026.05.10 14:23' },
  { id: 2, memberId: 1001, nickname: 'mooncat', artistGroup: 'V01D', historyType: 'EARN', sourceType: 'DAILY_MISSION', sourceRefName: '일일 출석', delta: +50, balanceAfter: 28250, createdAt: '2026.05.10 08:00' },
  { id: 3, memberId: 1001, nickname: 'mooncat', artistGroup: 'V01D', historyType: 'EARN', sourceType: 'STORY_QUEST_REWARD', sourceRefName: 'V01D 봄 스토리 시즌1 — 에피소드 3', delta: +150, balanceAfter: 28200, createdAt: '2026.05.09 22:15' },
  { id: 4, memberId: 1001, nickname: 'mooncat', artistGroup: 'V01D', historyType: 'EARN', sourceType: 'PM_PARTICIPATION', sourceRefName: 'PM-2026-04-30 컴백 예측', delta: +30, balanceAfter: 28050, createdAt: '2026.04.30 18:45' },
  { id: 5, memberId: 1001, nickname: 'mooncat', artistGroup: 'V01D', historyType: 'EARN', sourceType: 'TRIVIA_PARTICIPATION', sourceRefName: 'V01D 데뷔곡 퀴즈', delta: +80, balanceAfter: 28020, createdAt: '2026.04.28 21:30' },
  { id: 6, memberId: 1001, nickname: 'mooncat', artistGroup: 'V01D', historyType: 'EARN', sourceType: 'RANKING_REWARD', sourceRefName: '2026 Winter 시즌 1위', delta: +500, balanceAfter: 27940, createdAt: '2026.03.01 00:15' },
  { id: 7, memberId: 1001, nickname: 'mooncat', artistGroup: 'V01D', historyType: 'EARN', sourceType: 'BIVE_ACTIVITY', sourceRefName: 'V01D Welcome ED 민팅', delta: +100, balanceAfter: 27440, createdAt: '2026.02.20 16:00' },
  { id: 8, memberId: 1001, nickname: 'mooncat', artistGroup: 'V01D', historyType: 'EARN', sourceType: 'SUPPORT_PARTICIPATION', sourceRefName: '강남역 광고 응원 참여', delta: +60, balanceAfter: 27340, createdAt: '2026.02.10 19:20' },
];

export const dukStats = {
  totalParticipants: seasons.filter((s) => s.status === 'ACTIVE')[0]?.totalParticipants ?? 0,
  artistCount: 3,
  activeLimitProfiles: limits.length,
  weeklyChange: rankings.reduce((sum, r) => sum + r.deltaWeekly, 0),
};

export function getSeasonById(id: number): DukSeason | undefined {
  return seasons.find((s) => s.id === id);
}

export function getRankingsByArtist(artist: ArtistGroup): DukRanking[] {
  return rankings.filter((r) => r.artistGroup === artist);
}

export function getMemberHistory(memberId: number): DukHistory[] {
  return memberHistory.filter((h) => h.memberId === memberId);
}
