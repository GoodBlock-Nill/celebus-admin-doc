// ============================================================
// CELEBUS v2 고도화 타입 정의
// ============================================================

// --- 아티스트 ---

export interface ArtistMember {
  id: string;
  name: string;
  nameEn: string;
  imageUrl: string;
}

export interface Artist {
  id: string;
  name: string;
  nameEn: string;
  logoUrl: string;
  backgroundUrl: string;
  members: ArtistMember[];
}

// --- 유저 ---

export interface UserCurrency {
  virtue: number;        // 보유 덕력
  virtueEarned: number;  // 획득 덕력 (누적)
  tickets: number;       // 응모권
  gp: number;            // GP
  celebPoint: number;    // Celeb Point (Coming Soon)
}

export interface UserStreak {
  current: number;       // 현재 연속 출석일
  lastCheckIn: string;   // 마지막 출석 날짜 (ISO)
  todayCheckedIn: boolean;
}

export interface User {
  id: string;
  nickname: string;
  profileImageUrl: string;
  currency: UserCurrency;
  streak: UserStreak;
  followedArtistIds: string[];
  isLoggedIn: boolean;
}

// --- 서비스 카드 (아티스트 탭) ---

export type ServiceCardGroup = 'mission' | 'record' | 'more';

export type ServiceCardId =
  | 'challenge'
  | 'daily-mission'
  | 'support'
  | 'virtue'
  | 'collection'
  | 'raffle'
  | 'fandom-level'
  | 'info'
  | 'memory';

export interface ServiceCardData {
  id: ServiceCardId;
  group: ServiceCardGroup;
  icon: string;
  title: string;
  statusText: string;
  href: string;
  comingSoon: boolean;
}

// --- 그룹 라벨 ---

export const SERVICE_GROUP_LABELS: Record<ServiceCardGroup, string> = {
  mission: '미션',
  record: '내기록',
  more: '더보기',
};

// --- Quest 스토리 ---

export type ChapterStatus = 'locked' | 'provisional' | 'active' | 'reviewing' | 'cleared';

export type MissionStatus = 'INCOMPLETE' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'AUTO_COMPLETED';

export type RejectReasonCode = 'IMG_BLUR' | 'WRONG_OBJ' | 'DUP_ENTRY' | 'DATE_EXP' | 'ETC_INPUT';

export interface MissionRelatedLink {
  label: string;
  url: string;
}

export interface QuestMission {
  id: string;
  title: string;
  type: 'capture' | 'trivia' | 'pm';
  status: MissionStatus;
  rewardText: string;
  rejectReasonCode?: RejectReasonCode;
  rejectReasonText?: string;
  relatedLinks?: MissionRelatedLink[];
  gameUnavailable?: boolean;
}

export interface QuestChapter {
  id: string;
  number: number;
  title: string;
  description: string;
  status: ChapterStatus;
  missions: QuestMission[];
  goodsName: string;
  goodsGrade: number;
  goodsClaimed: boolean;
  missionHint: string;
}

export interface RepeatingQuest {
  id: string;
  title: string;
  period: string;
  missionCount: number;
  rewardText: string;
  status: 'active' | 'ready' | 'ended';
}

// --- 덕력 랭킹 ---

export interface RankingUser {
  rank: number;
  nickname: string;
  earnedPt: number;
  isMe: boolean;
}

export interface VirtueRankingState {
  myRank: number;
  myEarnedPt: number;
  myHeldPt: number;
  seasonLabel: string;
  seasonDaysLeft: number;
  topUsers: RankingUser[];
}

// --- 서포트 이벤트 ---

export type SupportEventStatus = 'active' | 'achieved' | 'executing' | 'completed' | 'expired' | 'cancelled';

export interface SupportEvent {
  id: string;
  title: string;
  icon: string;
  status: SupportEventStatus;
  targetPt: number;
  currentPt: number;
  myInvestPt: number;
  participants: number;
  daysLeft: number;
  description: string;
  resultMessage?: string;
  resultImages?: string[];
}

// --- 팬덤 레벨 ---

export interface FandomLevelReward {
  level: number;
  targetPt: number;
  rewardName: string;
  unlocked: boolean;
}

export interface FandomLevelState {
  currentLevel: number;
  currentPt: number;
  targetPt: number;
  myContributionPt: number;
  participantCount: number;
  monthlyTotal: number;
  topActivity: string;
  rewards: FandomLevelReward[];
  isMax: boolean;
}

// --- 일일 미션 ---

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  targetHref: string;
  rewardPt: number;
  completed: boolean;
}

export interface StreakBonus {
  days: number;
  rewardPt: number;
  claimed: boolean;
}

export interface DailyState {
  checkedIn: boolean;
  mission: DailyMission;
  streak: number;
  weekRecord: boolean[]; // 월~일 7칸
  bonuses: StreakBonus[];
}

// --- 토스트 ---

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}
