// ===== Chapter & Story Quest =====
export type ChapterStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
export type MissionType = 'QUEST' | 'TRIVIA' | 'PM' | 'SNS_SHARE';
export type MissionStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';

export interface Mission {
  id: string;
  chapterId: string;
  type: MissionType;
  title: string;
  description: string;
  status: MissionStatus;
  targetValue: number;
  currentValue: number;
  rewardTickets: number;
}

export interface ChapterReward {
  tickets: number;
  bonusContent: string | null;
  digitalPhotocard: string | null;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  status: ChapterStatus;
  missions: Mission[];
  reward: ChapterReward;
  completedAt: string | null;
}

// ===== Season Ranking =====
export type RankTier = 'LEGEND' | 'TOP10' | 'SUPER_FAN' | 'PARTICIPANT';
export type PointSource = 'QUEST' | 'TRIVIA' | 'PM_PARTICIPATE' | 'PM_CORRECT' | 'SNS_SHARE' | 'STREAK_7DAY';

export interface SeasonRanking {
  seasonId: string;
  seasonName: string;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  isEventActive: boolean;
}

export interface MySeasonStats {
  rank: number;
  totalParticipants: number;
  tier: RankTier;
  totalPoints: number;
  pointBreakdown: Record<PointSource, number>;
  currentStreak: number;
  longestStreak: number;
  percentile: number;
}

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  nickname: string;
  profileImage: string;
  tier: RankTier;
  totalPoints: number;
  isMe: boolean;
}

// ===== Fandom Level =====
export type FandomLevel = 1 | 2 | 3 | 4 | 5;

export interface FandomProgress {
  currentLevel: FandomLevel;
  totalActivities: number;
  nextLevelTarget: number;
  levelThresholds: Record<FandomLevel, number>;
}

export interface MyContribution {
  activityCount: number;
  percentage: number;
  rank: number;
}

export interface TopContributor {
  rank: number;
  uid: string;
  nickname: string;
  profileImage: string;
  activityCount: number;
  percentage: number;
}

// ===== Rewards =====
export type RewardCategory = 'TICKET' | 'BADGE_THEME' | 'CONTENT' | 'GOODS' | 'EVENT';
export type RewardType = 'ALWAYS' | 'EVENT';
export type RewardClaimStatus = 'LOCKED' | 'CLAIMABLE' | 'CLAIMED';

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  category: RewardCategory;
  rewardType: RewardType;
  emoji: string;
  source: string;
  claimStatus: RewardClaimStatus;
  claimedAt: string | null;
}

// ===== Ticket History =====
export type TicketChangeType = 'QUEST_REWARD' | 'ST_ELIMINATION' | 'PM_REWARD' | 'RAFFLE_USE' | 'RAFFLE_RETURN';

export interface TicketHistoryItem {
  id: string;
  type: TicketChangeType;
  sourceLabel: string;
  title: string;
  amount: number;
  balanceAfter: number;
  datetime: string;
}

// ===== Activity Feed =====
export interface ActivityFeedItem {
  id: string;
  nickname: string;
  action: string;
  timestamp: string;
}

// ===== Raffle =====
export type RaffleStatus = 'ACTIVE' | 'CLOSED' | 'ENDED';
export type RaffleResultStatus = 'PENDING' | 'WON' | 'LOST';
export type ReceiveType = 'ONSITE' | 'DELIVERY' | 'ONLINE';

export interface Raffle {
  id: string;
  artistName: string;
  title: string;
  description: string;
  reward: string;
  receiveType: ReceiveType;
  thumbnailEmoji: string;
  thumbnailUrl: string;
  startDate: string;
  endDate: string;
  totalUsers: number;
  totalTickets: number;
  myTickets: number;
  status: RaffleStatus;
  resultStatus: RaffleResultStatus | null;
}

// ===== Active Quest (for submission) =====
export type QuestSubmissionStatus = 'AVAILABLE' | 'PENDING' | 'COMPLETED' | 'REJECTED';

export interface ActiveQuest {
  id: string;
  artistName: string;
  title: string;
  description: string;
  rewardTickets: number;
  relatedLinks: { label: string; url: string }[];
  submissionStatus: QuestSubmissionStatus;
  rejectionCode: string | null;
  uploadGuide: string | null;
  submittedAt: string | null;
  dDay: number;
  startDate: string;
  endDate: string;
}

// ===== NFT Collection =====
export type NFTType = 'PHOTOCARD' | 'BADGE' | 'SPECIAL';
export type NFTRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface NFTItem {
  id: string;
  name: string;
  description: string;
  imageEmoji: string;
  imageUrl: string;
  artistName: string;
  type: NFTType;
  rarity: NFTRarity;
  acquiredAt: string;
  source: string;
}

// ===== Event History (Quest/Raffle combined) =====
export type EventType = 'QUEST' | 'RAFFLE';
export type EventQuestStatus = 'COMPLETED' | 'PENDING' | 'REJECTED';
export type EventRaffleStatus = 'ACTIVE' | 'CLOSED' | 'WON' | 'LOST';

export interface EventHistoryItem {
  id: string;
  type: EventType;
  artistName: string;
  title: string;
  datetime: string;
  questStatus?: EventQuestStatus;
  raffleStatus?: EventRaffleStatus;
  ticketsUsed?: number;
  rewardTickets?: number;
  rejectionCode?: string;
  raffleId?: string;
}
