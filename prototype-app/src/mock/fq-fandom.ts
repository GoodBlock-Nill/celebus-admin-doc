import type { FandomProgress, MyContribution, TopContributor } from '@/lib/fq-types';

export const mockFandomProgress: FandomProgress = {
  currentLevel: 2,
  totalActivities: 3847,
  nextLevelTarget: 5000,
  levelThresholds: { 1: 500, 2: 2000, 3: 5000, 4: 10000, 5: 20000 },
};

export const mockMyContribution: MyContribution = {
  activityCount: 47,
  percentage: 1.2,
  rank: 8,
};

const contributorNames = [
  '유찬이세상', '보이드러버', '덕질왕V01D', '주연이최고', '케빈팬123',
  '보이드마니아', '노스케맘', 'V01D덕질중 (나)', '지섭이심장', 'ROCKROCK팬',
];

export const mockTopContributors: TopContributor[] = contributorNames.map((name, i) => ({
  rank: i + 1,
  uid: `user-${String(i + 1).padStart(3, '0')}`,
  nickname: name,
  profileImage: `https://api.dicebear.com/7.x/thumbs/svg?seed=${name}`,
  activityCount: Math.max(20, 120 - i * 10 + Math.floor(Math.random() * 5)),
  percentage: parseFloat((Math.max(0.5, 3.2 - i * 0.25)).toFixed(1)),
}));
