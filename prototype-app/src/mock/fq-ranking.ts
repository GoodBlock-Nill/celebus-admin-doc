import type { SeasonRanking, MySeasonStats, LeaderboardEntry } from '@/lib/fq-types';

export const mockSeason: SeasonRanking = {
  seasonId: 'season-2026-04',
  seasonName: 'V01D 덕력 시즌 4월',
  month: 4,
  year: 2026,
  startDate: '2026-04-01T00:00:00Z',
  endDate: '2026-04-30T23:59:59Z',
  isEventActive: true,
};

export const mockMyStats: MySeasonStats = {
  rank: 12,
  totalParticipants: 487,
  tier: 'SUPER_FAN' as const,
  totalPoints: 2450,
  pointBreakdown: {
    QUEST: 850,
    TRIVIA: 540,
    PM_PARTICIPATE: 280,
    PM_CORRECT: 300,
    SNS_SHARE: 200,
    STREAK_7DAY: 280,
  },
  currentStreak: 5,
  longestStreak: 12,
  percentile: 2.5,
};

const fanNicknames = [
  '유찬이세상', '보이드러버', '주연이최고', '케빈팬123', '노스케맘',
  'V01D_forever', '유찬향기', '지섭이심장', 'ROCKROCK팬', '보이드조아',
  '유찬이별', '주연이빛', '케빈박사랑', '지섭이미소', '노스케천사',
  '덕질왕V01D', '보이드덕후', '유찬이행복', '01앨범최고', 'TugOfWar중독',
  '보이드마니아', '주연이응원', '케빈박짱', 'V01D_LUNA', '보이드별빛',
  '유찬이세계', '지섭이빛나', '노스케사랑해', '보이드갤러', '덕력만렙',
  'V01D입덕중', '유찬이귀여워', '주연이노래짱', '케빈래퍼왕', '지섭댄스',
  '노스케막내온탑', '보이드팬싸가자', '01앨범100번', '유찬이눈빛', 'VOID아님V01D',
  '보이드신곡언제', '주연이고음미쳤', '케빈박멋져', '지섭이카리스마', '노스케웃음천사',
  '보이드콘서트가자', '유찬이리더십', '주연이왕자', '케빈박천재', 'V01D_BEST',
];

export const mockLeaderboard: LeaderboardEntry[] = fanNicknames.map((nickname, i) => {
  const rank = i + 1;
  const basePoints = 5000 - rank * 80 + Math.floor(Math.random() * 40);
  const isMe = rank === 12;

  let tier: LeaderboardEntry['tier'] = 'PARTICIPANT';
  if (rank === 1) tier = 'LEGEND';
  else if (rank <= 10) tier = 'TOP10';
  else if (rank <= 49) tier = 'SUPER_FAN';

  return {
    rank,
    uid: `user-${String(rank).padStart(3, '0')}`,
    nickname: isMe ? 'V01D덕질중 (나)' : nickname,
    profileImage: `https://api.dicebear.com/7.x/thumbs/svg?seed=${nickname}`,
    tier,
    totalPoints: isMe ? 2450 : Math.max(100, basePoints),
    isMe,
  };
});
