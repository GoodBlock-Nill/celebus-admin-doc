import type { FandomLevelState } from '@/lib/types';

export const MOCK_FANDOM_LEVEL: FandomLevelState = {
  currentLevel: 3,
  currentPt: 3000,
  targetPt: 5000,
  myContributionPt: 150,
  participantCount: 342,
  monthlyTotal: 1200,
  topActivity: 'Quest 미션',
  rewards: [
    { level: 1, targetPt: 500, rewardName: '독점 콘텐츠 해금', unlocked: true },
    { level: 2, targetPt: 2000, rewardName: '보이스 메시지 + 사인 포토카드', unlocked: true },
    { level: 3, targetPt: 5000, rewardName: '디지털 포카세트 + 사인앨범 래플', unlocked: false },
    { level: 4, targetPt: 10000, rewardName: '???', unlocked: false },
    { level: 5, targetPt: 20000, rewardName: '???', unlocked: false },
  ],
  isMax: false,
};

export const MOCK_FANDOM_LEVEL_MAX: FandomLevelState = {
  ...MOCK_FANDOM_LEVEL,
  currentLevel: 5,
  currentPt: 20000,
  targetPt: 20000,
  myContributionPt: 1500,
  participantCount: 890,
  monthlyTotal: 3500,
  rewards: MOCK_FANDOM_LEVEL.rewards.map((r) => ({ ...r, unlocked: true })),
  isMax: true,
};
