import type { RankTier, PointSource, FandomLevel, RewardCategory, TicketChangeType } from './fq-types';

export const TIER_CONFIG: Record<RankTier, { label: string; color: string; bgColor: string; emoji: string }> = {
  LEGEND: { label: '덕력왕', color: '#F59E0B', bgColor: '#FEF3C7', emoji: '👑' },
  TOP10: { label: 'TOP 10', color: '#7C3AED', bgColor: '#F5F3FF', emoji: '💎' },
  SUPER_FAN: { label: '슈퍼팬', color: '#EC4899', bgColor: '#FCE7F3', emoji: '⭐' },
  PARTICIPANT: { label: '참여', color: '#6B7280', bgColor: '#F3F4F6', emoji: '🎵' },
};

export const POINT_SOURCE_CONFIG: Record<PointSource, { label: string; emoji: string; color: string }> = {
  QUEST: { label: '퀘스트', emoji: '📋', color: '#7C3AED' },
  TRIVIA: { label: 'Trivia', emoji: '🧠', color: '#3B82F6' },
  PM_PARTICIPATE: { label: 'PM 참여', emoji: '🎯', color: '#10B981' },
  PM_CORRECT: { label: 'PM 적중', emoji: '🎉', color: '#F59E0B' },
  SNS_SHARE: { label: 'SNS 공유', emoji: '📱', color: '#EC4899' },
  STREAK_7DAY: { label: '7일 스트릭', emoji: '🔥', color: '#EF4444' },
};

export const LEVEL_THRESHOLDS: Record<FandomLevel, number> = {
  1: 500,
  2: 2000,
  3: 5000,
  4: 10000,
  5: 20000,
};

export const LEVEL_REWARDS: Record<FandomLevel, { always: string; event: string }> = {
  1: { always: 'V01D 독점 비하인드 콘텐츠 팩', event: '팬싸 참가권 +1장' },
  2: { always: 'V01D 멤버 보이스 메시지 + 사인 포카 추첨 2명', event: '팬싸 참가권 +2장' },
  3: { always: 'V01D 한정판 디지털 포카 세트 + 사인 앨범 추첨 1명', event: '콘서트 VIP 2장' },
  4: { always: 'V01D 멤버별 독점 셀카 + 사인 앨범 추첨 3명', event: '콘서트 VIP 3장 + 영통 1명' },
  5: { always: 'V01D 특별 영상 메시지 + 기념 굿즈', event: '영통 3명 + V01D 감사 라이브' },
};

export const REWARD_CATEGORY_CONFIG: Record<RewardCategory, { label: string; emoji: string }> = {
  TICKET: { label: '응모권', emoji: '🎫' },
  BADGE_THEME: { label: '뱃지 & 테마', emoji: '🏅' },
  CONTENT: { label: '콘텐츠', emoji: '📸' },
  GOODS: { label: '굿즈', emoji: '🎁' },
  EVENT: { label: '이벤트', emoji: '🎪' },
};

export const TICKET_CHANGE_CONFIG: Record<TicketChangeType, { label: string; color: string }> = {
  QUEST_REWARD: { label: 'QUEST', color: '#10B981' },
  ST_ELIMINATION: { label: 'Survival Trivia', color: '#10B981' },
  PM_REWARD: { label: 'Prediction Market', color: '#10B981' },
  RAFFLE_USE: { label: 'RAFFLE', color: '#EF4444' },
  RAFFLE_RETURN: { label: 'RAFFLE', color: '#10B981' },
};

export const V01D_MEMBERS = [
  { name: '송유찬', nameEn: 'Yuchan Song', role: '리더' },
  { name: '조주연', nameEn: 'Juyeon Cho', role: '메인보컬' },
  { name: '케빈박', nameEn: 'Kevin Park', role: '메인래퍼' },
  { name: '정지섭', nameEn: 'Jisub Jung', role: '메인댄서' },
  { name: '신노스케', nameEn: 'Shinnosuke', role: '막내' },
];

export const V01D_INFO = {
  groupName: 'V01D',
  agency: 'IX Entertainment',
  debutDate: '2026.03.11',
  album: '[01]',
  tracks: ['Tug of War', 'ROCKROCK', 'The One', 'LUNA'],
  sns: {
    x: '@V01D_iX',
    instagram: 'v01d_ix',
    youtube: 'V01D Official',
  },
};
