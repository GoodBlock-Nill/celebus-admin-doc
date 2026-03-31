'use client';

import { create } from 'zustand';
import type {
  Chapter,
  SeasonRanking,
  MySeasonStats,
  LeaderboardEntry,
  FandomProgress,
  MyContribution,
  TopContributor,
  RewardItem,
  RewardCategory,
  TicketHistoryItem,
  ActivityFeedItem,
} from '@/lib/fq-types';
import { mockChapters } from '@/mock/fq-chapters';
import { mockSeason, mockMyStats, mockLeaderboard } from '@/mock/fq-ranking';
import { mockFandomProgress, mockMyContribution, mockTopContributors } from '@/mock/fq-fandom';
import { mockRewards } from '@/mock/fq-rewards';
import { mockTicketHistory } from '@/mock/fq-tickets';

interface FQState {
  // Chapters
  chapters: Chapter[];
  completeMission: (chapterId: string, missionId: string) => void;
  completeChapter: (chapterId: string) => void;

  // Ranking
  season: SeasonRanking;
  myStats: MySeasonStats;
  leaderboard: LeaderboardEntry[];

  // Fandom
  fandomProgress: FandomProgress;
  myContribution: MyContribution;
  topContributors: TopContributor[];
  incrementActivity: () => void;

  // Rewards
  rewards: RewardItem[];
  claimReward: (rewardId: string) => void;

  // Tickets
  ticketHistory: TicketHistoryItem[];
  ticketBalance: number;

  // Activity Feed
  activityFeed: ActivityFeedItem[];

  // UI
  activeRewardTab: RewardCategory;
  setActiveRewardTab: (tab: RewardCategory) => void;
  showCelebration: boolean;
  celebrationType: 'chapter' | 'levelUp' | 'reward' | null;
  celebrationData: Record<string, string> | null;
  triggerCelebration: (type: 'chapter' | 'levelUp' | 'reward', data?: Record<string, string>) => void;
  dismissCelebration: () => void;
}

const initialActivityFeed: ActivityFeedItem[] = [
  { id: 'af-1', nickname: '유찬이세상', action: '3장 퀘스트를 클리어했어요!', timestamp: '2026-04-29T10:30:00Z' },
  { id: 'af-2', nickname: '보이드러버', action: 'PM에서 적중! +100 포인트', timestamp: '2026-04-29T10:25:00Z' },
  { id: 'af-3', nickname: '덕질왕V01D', action: '7일 스트릭 달성! 🔥', timestamp: '2026-04-29T10:20:00Z' },
  { id: 'af-4', nickname: '주연이최고', action: '사인 포카 추첨에 응모했어요', timestamp: '2026-04-29T10:15:00Z' },
  { id: 'af-5', nickname: '케빈팬123', action: 'Trivia 10문제 전부 정답!', timestamp: '2026-04-29T10:10:00Z' },
  { id: 'af-6', nickname: '노스케맘', action: '팬덤 레벨업에 기여했어요 +1', timestamp: '2026-04-29T10:05:00Z' },
  { id: 'af-7', nickname: '보이드마니아', action: 'SNS에 V01D 응원 공유!', timestamp: '2026-04-29T10:00:00Z' },
  { id: 'af-8', nickname: '지섭이심장', action: '2장 퀘스트를 클리어했어요!', timestamp: '2026-04-29T09:55:00Z' },
];

export const useFQStore = create<FQState>((set) => ({
  // Chapters
  chapters: mockChapters,

  completeMission: (chapterId, missionId) =>
    set((state) => ({
      chapters: state.chapters.map((ch) =>
        ch.id === chapterId
          ? {
              ...ch,
              missions: ch.missions.map((m) =>
                m.id === missionId
                  ? { ...m, status: 'COMPLETED' as const, currentValue: m.targetValue }
                  : m
              ),
            }
          : ch
      ),
    })),

  completeChapter: (chapterId) =>
    set((state) => {
      const chapterIndex = state.chapters.findIndex((ch) => ch.id === chapterId);
      return {
        chapters: state.chapters.map((ch, i) => {
          if (ch.id === chapterId) {
            return { ...ch, status: 'COMPLETED' as const, completedAt: new Date().toISOString() };
          }
          if (i === chapterIndex + 1 && ch.status === 'LOCKED') {
            return { ...ch, status: 'AVAILABLE' as const };
          }
          return ch;
        }),
        ticketBalance: state.ticketBalance + (state.chapters[chapterIndex]?.reward.tickets ?? 0),
      };
    }),

  // Ranking
  season: mockSeason,
  myStats: mockMyStats,
  leaderboard: mockLeaderboard,

  // Fandom
  fandomProgress: mockFandomProgress,
  myContribution: mockMyContribution,
  topContributors: mockTopContributors,

  incrementActivity: () =>
    set((state) => ({
      fandomProgress: {
        ...state.fandomProgress,
        totalActivities: state.fandomProgress.totalActivities + 1,
      },
      myContribution: {
        ...state.myContribution,
        activityCount: state.myContribution.activityCount + 1,
      },
    })),

  // Rewards
  rewards: mockRewards,

  claimReward: (rewardId) =>
    set((state) => ({
      rewards: state.rewards.map((r) =>
        r.id === rewardId
          ? { ...r, claimStatus: 'CLAIMED' as const, claimedAt: new Date().toISOString() }
          : r
      ),
    })),

  // Tickets
  ticketHistory: mockTicketHistory,
  ticketBalance: 15,

  // Activity Feed
  activityFeed: initialActivityFeed,

  // UI
  activeRewardTab: 'TICKET',
  setActiveRewardTab: (tab) => set({ activeRewardTab: tab }),
  showCelebration: false,
  celebrationType: null,
  celebrationData: null,
  triggerCelebration: (type, data) =>
    set({ showCelebration: true, celebrationType: type, celebrationData: data ?? null }),
  dismissCelebration: () =>
    set({ showCelebration: false, celebrationType: null, celebrationData: null }),
}));
