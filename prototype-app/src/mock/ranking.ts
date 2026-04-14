import type { VirtueRankingState } from '@/lib/types';

export const MOCK_RANKING: VirtueRankingState = {
  myRank: 38,
  myEarnedPt: 2450,
  myHeldPt: 1200,
  seasonLabel: '4월 시즌',
  seasonDaysLeft: 17,
  topUsers: [
    { rank: 1, nickname: 'v01d_lover', earnedPt: 5200, isMe: false },
    { rank: 2, nickname: 'star_chaser', earnedPt: 4800, isMe: false },
    { rank: 3, nickname: 'dream_fan', earnedPt: 4100, isMe: false },
    { rank: 4, nickname: 'music_soul', earnedPt: 3900, isMe: false },
    { rank: 5, nickname: 'fan_forever', earnedPt: 3600, isMe: false },
    { rank: 6, nickname: 'bright_day', earnedPt: 3200, isMe: false },
    { rank: 7, nickname: 'happy_voice', earnedPt: 3000, isMe: false },
    { rank: 8, nickname: 'sweet_melody', earnedPt: 2900, isMe: false },
    { rank: 9, nickname: 'cool_breeze', earnedPt: 2700, isMe: false },
    { rank: 10, nickname: 'shining_star', earnedPt: 2600, isMe: false },
    ...Array.from({ length: 27 }, (_, i) => ({
      rank: 11 + i,
      nickname: `fan_${11 + i}`,
      earnedPt: 2500 - i * 30,
      isMe: false,
    })),
    { rank: 38, nickname: '나', earnedPt: 2450, isMe: true },
    { rank: 38, nickname: 'same_pt_user', earnedPt: 2450, isMe: false },
    ...Array.from({ length: 61 }, (_, i) => ({
      rank: 40 + i,
      nickname: `fan_${40 + i}`,
      earnedPt: 2400 - i * 20,
      isMe: false,
    })),
  ],
};
