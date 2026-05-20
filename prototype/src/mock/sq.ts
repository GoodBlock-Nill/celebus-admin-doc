// 스토리 퀘스트(SQ) v2.2 — [CEB-BO-011] v2.2 SSOT
// 계층 v2.2: EpisodeGroup → StoryQuest(에피소드) → StoryEpisode(미션, 완료조건 흡수)
// StoryMission 계층 완전 폐기 (chapter 자체에 완료 판정 필드 흡수)
// 수량 제약: 그룹당 메인 5 + 반복 1 / 에피소드당 미션 10

export type StoryQuestStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type EpisodeGroupStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type ArtistGroup = 'V01D' | 'iKON' | 'CELEBUS';
export type EpisodeType = 'FAN_QUEST' | 'PREDICTION_MARKET' | 'SURVIVAL_TRIVIA';
export type EpisodeUserStatus = 'LOCK' | 'ACTIVE' | 'COMPLETED';
// v2.2 — 미션(=chapter)이 완료 조건을 직접 흡수
export type EpisodeCompletedType =
  | 'ADMIN_APPROVAL'
  | 'PM_PARTICIPATION'
  | 'PM_CORRECT'
  | 'TRIVIA_PARTICIPATION'
  | 'TRIVIA_CORRECT_COUNT';

// 운영 용어 재매핑 (v2.2): 상위 "에피소드 그룹" → "에피소드"(StoryQuest, `story_quest`) → "미션"(StoryEpisode, `story_quest_chapter`)
// 수량 제약 — 그룹당 메인 5 + 반복 1, 에피소드당 미션 최대 10
export const MAX_EPISODES_PER_STORY = 10; // 에피소드당 미션 합계 상한
export const MAX_MAIN_EPISODES = 5;       // 그룹당 메인 에피소드 5개
export const MAX_REPEAT_EPISODES = 1;     // 그룹당 반복 에피소드 1개
export const REPEAT_EPISODE_DISPLAY_ORDER = 6; // 메인 5개 다음 마지막 슬롯

export type EpisodeKind = 'MAIN' | 'REPEAT';

// 에피소드 그룹(최상위, v1.3 신규) — 아티스트별 시즌·큐레이션 묶음. ACTIVE는 아티스트당 1개 제한.
// 입력 항목: 시작일자·종료일자·타이틀·아티스트 (메인 이미지·다국어·설명 없음).
export interface EpisodeGroup {
  id: number;
  artistGroup: ArtistGroup;
  status: EpisodeGroupStatus;
  titleKO: string;
  startDt: string;
  endDt: string;
  episodeCount: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

// 에피소드(중간, ERD: `story_quest`) — 메인 이미지 SSOT. 하위 퀘스트는 별도 이미지 없음.
// v1.3: 상위에 `groupId` FK 추가 (어느 에피소드 그룹에 속하는지)
// v1.4: `displayOrder` 추가 — 그룹 내 노출 순서 (운영자가 직접 설정, 1부터 시작)
// v1.5: 기간(openDt/closeDt) 제거 → 그룹의 startDt/endDt를 단일 SSOT로 사용. 메인 이미지는 3:4 비율.
//       설명 다국어 (descKO/descEN/descJA) 추가.
export interface StoryQuest {
  id: number;
  groupId: number;
  /** v1.6 신규 — 메인 / 반복 종류. 그룹당 MAIN ≤ 5, REPEAT ≤ 1 */
  episodeKind: EpisodeKind;
  displayOrder: number;
  artistGroup: 'V01D' | 'iKON' | 'CELEBUS';
  status: StoryQuestStatus;
  titleKO: string;
  titleEN: string;
  titleJA: string;
  /** v1.2 신규 — 에피소드 메인 이미지 URL (3:4 권장, ≤5MB). ERD `story_quest.image_url` 추가 요청 예정 */
  imageUrl: string;
  /** v1.5 신규 — 에피소드 설명 다국어 (선택) */
  descKO: string;
  descEN: string;
  descJA: string;
  episodeCount: number;
  activeMembers: number;
  totalCompleted: number;
  pendingReview: number;
  /**
   * v3.2 신규 — 메인 에피소드 완료 보상 (메인 에피소드 전용).
   * 에피소드 안의 모든 미션이 완료된 회원에게 자동 지급.
   * REPEAT 에피소드에서는 null.
   */
  episodeReward?: {
    entryTicket: number;
    fanPoint: number;
    biveRewardYn: boolean;
    mintingEventId?: number | null;
    mintingEventName?: string | null;
  } | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface StoryEpisode {
  id: number;
  storyQuestId: number;
  order: number;
  type: EpisodeType;
  titleKO: string;
  /** v1.1 신규 — 에피소드 메인 이미지 URL (ERD `story_quest_chapter.image_url` 추가 요청) */
  imageUrl: string;
  rewardEntryTicket: number;
  rewardFanPoint: number;
  /** v1.1 신규 — BIVE 보상 토글 (ERD `bive_reward_yn` 추가 요청) */
  biveRewardYn: boolean;
  /** ON 일 때만 의미 있음. OFF면 NULL */
  mintingEventId: number | null;
  mintingEventName: string | null;
  repeat: boolean;
  inProgressMembers: number;
  completedMembers: number;
  /** type === 'FAN_QUEST'일 때 참조하는 FQ Quest id (역참조 enabler) */
  fanQuestId?: number;
  // ── v2.2 흡수 필드 (구 StoryMission) — 미션 1개 = 완료 판정 1개
  /** 완료 판정 유형. FAN_QUEST는 ADMIN_APPROVAL 고정 */
  completedType?: EpisodeCompletedType;
  /** TRIVIA_CORRECT_COUNT 일 때만 의미 있음 (예: 7회 정답) */
  completedValue?: number;
  /** PM/ST 미션의 출처 콘텐츠 표시명 (FAN_QUEST는 fanQuestId로 대체) */
  sourceRefName?: string;
  /**
   * REPEAT 에피소드 미션의 반복 주기.
   * v3.2 — 'DAILY' 추가 (PM/ST 반복 미션 반복 주기 일간/주간/월간 3종 정합).
   */
  repeatCycle?: 'DAILY' | 'MONTHLY' | 'WEEKLY' | null;
  /** 운영 기간 — 비우면 그룹 기간 상속 */
  openDt?: string;
  closeDt?: string;
}

export const storyQuests: StoryQuest[] = [
  // ── Group 1 (V01D 에피소드 #1, ACTIVE) — 메인 5 + 반복 1
  {
    id: 1,
    groupId: 1,
    episodeKind: 'MAIN',
    displayOrder: 1,
    artistGroup: 'V01D',
    status: 'ACTIVE',
    titleKO: 'V01D 에피소드 #1 — 메인 1',
    titleEN: 'V01D Episode #1 — Main 1',
    titleJA: 'V01D エピソード #1 — メイン 1',
    imageUrl: '/sq/story-1-main.jpg',
    descKO: 'V01D 에피소드 #1의 첫 번째 메인 에피소드.',
    descEN: 'The first main episode of V01D Episode #1.',
    descJA: 'V01D エピソード #1 の最初のメインエピソード。',
    episodeCount: 5,
    activeMembers: 240,
    totalCompleted: 180,
    pendingReview: 6,
    episodeReward: {
      entryTicket: 20,
      fanPoint: 500,
      biveRewardYn: true,
      mintingEventId: 1,
      mintingEventName: 'V01D Welcome ED',
    },
    createdBy: 'nill',
    createdAt: '2024.12.22 10:00',
    updatedBy: 'nill',
    updatedAt: '2025.06.10 14:00',
  },
  {
    id: 2,
    groupId: 1,
    episodeKind: 'MAIN',
    displayOrder: 2,
    artistGroup: 'V01D',
    status: 'ACTIVE',
    titleKO: 'V01D 에피소드 #1 — 메인 2',
    titleEN: 'V01D Episode #1 — Main 2',
    titleJA: 'V01D エピソード #1 — メイン 2',
    imageUrl: '/sq/story-2-main.jpg',
    descKO: 'V01D 에피소드 #1의 두 번째 메인 에피소드.',
    descEN: 'The second main episode of V01D Episode #1.',
    descJA: 'V01D エピソード #1 の二番目のメインエピソード。',
    episodeCount: 6,
    activeMembers: 215,
    totalCompleted: 160,
    pendingReview: 4,
    createdBy: 'nill',
    createdAt: '2024.12.22 10:10',
    updatedBy: 'nill',
    updatedAt: '2025.06.20 12:00',
  },
  {
    id: 3,
    groupId: 1,
    episodeKind: 'MAIN',
    displayOrder: 3,
    artistGroup: 'V01D',
    status: 'ACTIVE',
    titleKO: 'V01D 에피소드 #1 — 메인 3',
    titleEN: 'V01D Episode #1 — Main 3',
    titleJA: 'V01D エピソード #1 — メイン 3',
    imageUrl: '/sq/story-3-main.jpg',
    descKO: 'V01D 에피소드 #1의 세 번째 메인 에피소드.',
    descEN: 'The third main episode of V01D Episode #1.',
    descJA: 'V01D エピソード #1 の三番目のメインエピソード。',
    episodeCount: 4,
    activeMembers: 198,
    totalCompleted: 130,
    pendingReview: 8,
    createdBy: 'nill',
    createdAt: '2024.12.22 10:20',
    updatedBy: 'nill',
    updatedAt: '2025.07.15 15:00',
  },
  {
    id: 4,
    groupId: 1,
    episodeKind: 'MAIN',
    displayOrder: 4,
    artistGroup: 'V01D',
    status: 'ACTIVE',
    titleKO: 'V01D 에피소드 #1 — 메인 4',
    titleEN: 'V01D Episode #1 — Main 4',
    titleJA: 'V01D エピソード #1 — メイン 4',
    imageUrl: '/sq/story-4-main.jpg',
    descKO: 'V01D 에피소드 #1의 네 번째 메인 에피소드.',
    descEN: 'The fourth main episode of V01D Episode #1.',
    descJA: 'V01D エピソード #1 の四番目のメインエピソード。',
    episodeCount: 5,
    activeMembers: 176,
    totalCompleted: 102,
    pendingReview: 3,
    createdBy: 'nill',
    createdAt: '2024.12.22 10:30',
    updatedBy: 'nill',
    updatedAt: '2025.08.20 09:00',
  },
  {
    id: 5,
    groupId: 1,
    episodeKind: 'MAIN',
    displayOrder: 5,
    artistGroup: 'V01D',
    status: 'ACTIVE',
    titleKO: 'V01D 에피소드 #1 — 메인 5',
    titleEN: 'V01D Episode #1 — Main 5',
    titleJA: 'V01D エピソード #1 — メイン 5',
    imageUrl: '/sq/story-5-main.jpg',
    descKO: 'V01D 에피소드 #1의 다섯 번째 메인 에피소드.',
    descEN: 'The fifth main episode of V01D Episode #1.',
    descJA: 'V01D エピソード #1 の五番目のメインエピソード。',
    episodeCount: 7,
    activeMembers: 152,
    totalCompleted: 80,
    pendingReview: 5,
    createdBy: 'nill',
    createdAt: '2024.12.22 10:40',
    updatedBy: 'nill',
    updatedAt: '2025.09.05 11:00',
  },
  {
    id: 6,
    groupId: 1,
    episodeKind: 'REPEAT',
    displayOrder: REPEAT_EPISODE_DISPLAY_ORDER,
    artistGroup: 'V01D',
    status: 'ACTIVE',
    titleKO: 'V01D 에피소드 #1 — 반복 에피소드',
    titleEN: 'V01D Episode #1 — Repeat',
    titleJA: 'V01D エピソード #1 — 繰り返し',
    imageUrl: '/sq/story-6-main.jpg',
    descKO: 'V01D 에피소드 #1의 매월 반복 진행되는 에피소드.',
    descEN: 'The monthly recurring episode of V01D Episode #1.',
    descJA: 'V01D エピソード #1 の毎月繰り返しエピソード。',
    episodeCount: 3,
    activeMembers: 132,
    totalCompleted: 68,
    pendingReview: 2,
    createdBy: 'nill',
    createdAt: '2024.12.22 10:50',
    updatedBy: 'nill',
    updatedAt: '2025.10.10 16:30',
  },
  // ── Group 2 (V01D 에피소드 #2, DRAFT) — 메인 2
  {
    id: 7,
    groupId: 2,
    episodeKind: 'MAIN',
    displayOrder: 1,
    artistGroup: 'V01D',
    status: 'DRAFT',
    titleKO: 'V01D 에피소드 #2 — 메인 1 (작성 중)',
    titleEN: '',
    titleJA: '',
    imageUrl: '/sq/story-7-main.jpg',
    descKO: 'V01D 에피소드 #2의 첫 번째 메인 에피소드. (작성 중)',
    descEN: '',
    descJA: '',
    episodeCount: 5,
    activeMembers: 0,
    totalCompleted: 0,
    pendingReview: 0,
    createdBy: 'nill',
    createdAt: '2025.12.20 09:30',
    updatedBy: 'nill',
    updatedAt: '2026.01.10 16:00',
  },
  {
    id: 8,
    groupId: 2,
    episodeKind: 'MAIN',
    displayOrder: 2,
    artistGroup: 'V01D',
    status: 'DRAFT',
    titleKO: 'V01D 에피소드 #2 — 메인 2 (작성 중)',
    titleEN: '',
    titleJA: '',
    imageUrl: '/sq/story-8-main.jpg',
    descKO: 'V01D 에피소드 #2의 두 번째 메인 에피소드. (작성 중)',
    descEN: '',
    descJA: '',
    episodeCount: 4,
    activeMembers: 0,
    totalCompleted: 0,
    pendingReview: 0,
    createdBy: 'nill',
    createdAt: '2025.12.20 09:40',
    updatedBy: 'nill',
    updatedAt: '2026.02.15 11:20',
  },
  // ── Group 3 (V01D 에피소드 #0, CLOSED) — 메인 5 + 반복 1
  {
    id: 9,
    groupId: 3,
    episodeKind: 'MAIN',
    displayOrder: 1,
    artistGroup: 'V01D',
    status: 'CLOSED',
    titleKO: 'V01D 에피소드 #0 — 메인 1',
    titleEN: 'V01D Episode #0 — Main 1',
    titleJA: 'V01D エピソード #0 — メイン 1',
    imageUrl: '/sq/story-1-main.jpg',
    descKO: 'V01D 에피소드 #0의 첫 번째 메인 에피소드. (종료)',
    descEN: 'The first main episode of V01D Episode #0. (closed)',
    descJA: 'V01D エピソード #0 の最初のメインエピソード。(終了)',
    episodeCount: 5,
    activeMembers: 410,
    totalCompleted: 378,
    pendingReview: 0,
    createdBy: 'nill',
    createdAt: '2023.12.18 09:00',
    updatedBy: 'nill',
    updatedAt: '2024.12.31 23:50',
  },
  {
    id: 10,
    groupId: 3,
    episodeKind: 'MAIN',
    displayOrder: 2,
    artistGroup: 'V01D',
    status: 'CLOSED',
    titleKO: 'V01D 에피소드 #0 — 메인 2',
    titleEN: 'V01D Episode #0 — Main 2',
    titleJA: 'V01D エピソード #0 — メイン 2',
    imageUrl: '/sq/story-2-main.jpg',
    descKO: 'V01D 에피소드 #0의 두 번째 메인 에피소드. (종료)',
    descEN: 'The second main episode of V01D Episode #0. (closed)',
    descJA: 'V01D エピソード #0 の二番目のメインエピソード。(終了)',
    episodeCount: 6,
    activeMembers: 388,
    totalCompleted: 350,
    pendingReview: 0,
    createdBy: 'nill',
    createdAt: '2023.12.18 09:10',
    updatedBy: 'nill',
    updatedAt: '2024.12.31 23:50',
  },
  {
    id: 11,
    groupId: 3,
    episodeKind: 'MAIN',
    displayOrder: 3,
    artistGroup: 'V01D',
    status: 'CLOSED',
    titleKO: 'V01D 에피소드 #0 — 메인 3',
    titleEN: 'V01D Episode #0 — Main 3',
    titleJA: 'V01D エピソード #0 — メイン 3',
    imageUrl: '/sq/story-3-main.jpg',
    descKO: 'V01D 에피소드 #0의 세 번째 메인 에피소드. (종료)',
    descEN: 'The third main episode of V01D Episode #0. (closed)',
    descJA: 'V01D エピソード #0 の三番目のメインエピソード。(終了)',
    episodeCount: 4,
    activeMembers: 360,
    totalCompleted: 325,
    pendingReview: 0,
    createdBy: 'nill',
    createdAt: '2023.12.18 09:20',
    updatedBy: 'nill',
    updatedAt: '2024.12.31 23:50',
  },
  {
    id: 12,
    groupId: 3,
    episodeKind: 'MAIN',
    displayOrder: 4,
    artistGroup: 'V01D',
    status: 'CLOSED',
    titleKO: 'V01D 에피소드 #0 — 메인 4',
    titleEN: 'V01D Episode #0 — Main 4',
    titleJA: 'V01D エピソード #0 — メイン 4',
    imageUrl: '/sq/story-4-main.jpg',
    descKO: 'V01D 에피소드 #0의 네 번째 메인 에피소드. (종료)',
    descEN: 'The fourth main episode of V01D Episode #0. (closed)',
    descJA: 'V01D エピソード #0 の四番目のメインエピソード。(終了)',
    episodeCount: 5,
    activeMembers: 332,
    totalCompleted: 298,
    pendingReview: 0,
    createdBy: 'nill',
    createdAt: '2023.12.18 09:30',
    updatedBy: 'nill',
    updatedAt: '2024.12.31 23:50',
  },
  {
    id: 13,
    groupId: 3,
    episodeKind: 'MAIN',
    displayOrder: 5,
    artistGroup: 'V01D',
    status: 'CLOSED',
    titleKO: 'V01D 에피소드 #0 — 메인 5',
    titleEN: 'V01D Episode #0 — Main 5',
    titleJA: 'V01D エピソード #0 — メイン 5',
    imageUrl: '/sq/story-5-main.jpg',
    descKO: 'V01D 에피소드 #0의 다섯 번째 메인 에피소드. (종료)',
    descEN: 'The fifth main episode of V01D Episode #0. (closed)',
    descJA: 'V01D エピソード #0 の五番目のメインエピソード。(終了)',
    episodeCount: 7,
    activeMembers: 305,
    totalCompleted: 270,
    pendingReview: 0,
    createdBy: 'nill',
    createdAt: '2023.12.18 09:40',
    updatedBy: 'nill',
    updatedAt: '2024.12.31 23:50',
  },
  {
    id: 14,
    groupId: 3,
    episodeKind: 'REPEAT',
    displayOrder: REPEAT_EPISODE_DISPLAY_ORDER,
    artistGroup: 'V01D',
    status: 'CLOSED',
    titleKO: 'V01D 에피소드 #0 — 반복 에피소드',
    titleEN: 'V01D Episode #0 — Repeat',
    titleJA: 'V01D エピソード #0 — 繰り返し',
    imageUrl: '/sq/story-6-main.jpg',
    descKO: 'V01D 에피소드 #0의 매월 반복 에피소드. (종료)',
    descEN: 'The monthly recurring episode of V01D Episode #0. (closed)',
    descJA: 'V01D エピソード #0 の毎月繰り返しエピソード。(終了)',
    episodeCount: 3,
    activeMembers: 280,
    totalCompleted: 245,
    pendingReview: 0,
    createdBy: 'nill',
    createdAt: '2023.12.18 09:50',
    updatedBy: 'nill',
    updatedAt: '2024.12.31 23:50',
  },
];

export function getStoryQuestById(id: number): StoryQuest | undefined {
  return storyQuests.find((s) => s.id === id);
}

// 에피소드 그룹 — 3건 mock (V01D ACTIVE 1·DRAFT 1·CLOSED 1)
// 정책: ACTIVE는 아티스트당 1개만 허용.
export const episodeGroups: EpisodeGroup[] = [
  {
    id: 1,
    artistGroup: 'V01D',
    status: 'ACTIVE',
    titleKO: 'V01D 에피소드 #1',
    startDt: '2025.01.01 00:00',
    endDt: '2025.12.31 23:59',
    episodeCount: 6,
    createdBy: 'nill',
    createdAt: '2024.12.20 14:00',
    updatedBy: 'nill',
    updatedAt: '2025.06.15 11:30',
  },
  {
    id: 2,
    artistGroup: 'V01D',
    status: 'DRAFT',
    titleKO: 'V01D 에피소드 #2',
    startDt: '2026.01.01 00:00',
    endDt: '2026.12.31 23:59',
    episodeCount: 2,
    createdBy: 'nill',
    createdAt: '2025.12.18 10:00',
    updatedBy: 'nill',
    updatedAt: '2026.02.15 11:20',
  },
  {
    id: 3,
    artistGroup: 'V01D',
    status: 'CLOSED',
    titleKO: 'V01D 에피소드 #0',
    startDt: '2024.01.01 00:00',
    endDt: '2024.12.31 23:59',
    episodeCount: 6,
    createdBy: 'nill',
    createdAt: '2023.12.15 09:00',
    updatedBy: 'nill',
    updatedAt: '2025.01.05 10:00',
  },
];

export function getGroupById(id: number): EpisodeGroup | undefined {
  return episodeGroups.find((g) => g.id === id);
}

export function getEpisodesByGroupId(groupId: number): StoryQuest[] {
  return storyQuests
    .filter((s) => s.groupId === groupId)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

// v1.6 신규 — 메인/반복 분리 조회
export function getMainEpisodesByGroupId(groupId: number): StoryQuest[] {
  return storyQuests
    .filter((s) => s.groupId === groupId && s.episodeKind === 'MAIN')
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getRepeatEpisodeByGroupId(groupId: number): StoryQuest | undefined {
  return storyQuests.find((s) => s.groupId === groupId && s.episodeKind === 'REPEAT');
}

export function canAddMainEpisode(groupId: number): boolean {
  return getMainEpisodesByGroupId(groupId).length < MAX_MAIN_EPISODES;
}

export function canAddRepeatEpisode(groupId: number): boolean {
  return getRepeatEpisodeByGroupId(groupId) === undefined;
}

// ACTIVE 제한 검증: 해당 아티스트에 이미 ACTIVE 그룹이 있는지 (현재 그룹 제외)
export function hasActiveGroupForArtist(artist: ArtistGroup, excludeGroupId?: number): boolean {
  return episodeGroups.some(
    (g) => g.artistGroup === artist && g.status === 'ACTIVE' && g.id !== excludeGroupId,
  );
}

export const groupStats = {
  total: episodeGroups.length,
  draft: episodeGroups.filter((g) => g.status === 'DRAFT').length,
  active: episodeGroups.filter((g) => g.status === 'ACTIVE').length,
  closed: episodeGroups.filter((g) => g.status === 'CLOSED').length,
};

// EPISODE_DATA — 운영 용어상 "미션" (ERD: `story_quest_chapter`). 에피소드(상위)당 최대 10개.
// v2.2: 완료 조건 필드(completedType / sourceRefName / completedValue / repeatCycle / openDt / closeDt)를 직접 흡수.
// 정책: 1개 FQ Quest는 1개 미션에만 매핑된다 (CHAPTER_FAN_QUEST_ASSIGNMENT 참조).
const EPISODE_DATA: Omit<StoryEpisode, 'storyQuestId'>[] = [
  { id: 101, order: 1, type: 'FAN_QUEST', titleKO: '미션 1: 첫 만남 — 데뷔 인증샷 공유', imageUrl: '/sq/ep1.jpg', rewardEntryTicket: 5, rewardFanPoint: 100, biveRewardYn: true, mintingEventId: 23, mintingEventName: 'V01D Welcome ED', repeat: false, inProgressMembers: 234, completedMembers: 234, completedType: 'ADMIN_APPROVAL' },
  { id: 102, order: 2, type: 'PREDICTION_MARKET', titleKO: '미션 2: 무대 뒤 — 다음 활동 예측', imageUrl: '/sq/ep2.jpg', rewardEntryTicket: 10, rewardFanPoint: 200, biveRewardYn: false, mintingEventId: null, mintingEventName: null, repeat: false, inProgressMembers: 220, completedMembers: 195, completedType: 'PM_PARTICIPATION', sourceRefName: 'PM #34 — 다음 컴백 시점' },
  { id: 103, order: 3, type: 'SURVIVAL_TRIVIA', titleKO: '미션 3: 데뷔곡 퀴즈', imageUrl: '/sq/ep3.jpg', rewardEntryTicket: 8, rewardFanPoint: 150, biveRewardYn: true, mintingEventId: 24, mintingEventName: 'V01D Trivia Master', repeat: false, inProgressMembers: 200, completedMembers: 178, completedType: 'TRIVIA_CORRECT_COUNT', completedValue: 7, sourceRefName: 'ST #12 데뷔곡 가사 퀴즈' },
  { id: 104, order: 4, type: 'FAN_QUEST', titleKO: '미션 4: 응원 메시지', imageUrl: '/sq/ep4.jpg', rewardEntryTicket: 6, rewardFanPoint: 120, biveRewardYn: false, mintingEventId: null, mintingEventName: null, repeat: true, inProgressMembers: 150, completedMembers: 90, completedType: 'ADMIN_APPROVAL', repeatCycle: 'MONTHLY' },
  { id: 105, order: 5, type: 'FAN_QUEST', titleKO: '미션 5: 멤버 응원 SNS', imageUrl: '/sq/ep5.jpg', rewardEntryTicket: 7, rewardFanPoint: 130, biveRewardYn: false, mintingEventId: null, mintingEventName: null, repeat: false, inProgressMembers: 120, completedMembers: 75, completedType: 'ADMIN_APPROVAL' },
  { id: 106, order: 6, type: 'PREDICTION_MARKET', titleKO: '미션 6: 컴백 무대 예측', imageUrl: '/sq/ep6.jpg', rewardEntryTicket: 12, rewardFanPoint: 220, biveRewardYn: true, mintingEventId: 26, mintingEventName: 'V01D Prophet', repeat: false, inProgressMembers: 90, completedMembers: 55, completedType: 'PM_CORRECT', sourceRefName: 'PM #35 컴백 앨범 1위 적중' },
  { id: 107, order: 7, type: 'SURVIVAL_TRIVIA', titleKO: '미션 7: 멤버 MBTI 퀴즈', imageUrl: '/sq/ep7.jpg', rewardEntryTicket: 9, rewardFanPoint: 160, biveRewardYn: false, mintingEventId: null, mintingEventName: null, repeat: true, inProgressMembers: 70, completedMembers: 40, completedType: 'TRIVIA_PARTICIPATION', sourceRefName: 'ST #13 MBTI 시리즈', repeatCycle: 'WEEKLY' },
  { id: 108, order: 8, type: 'FAN_QUEST', titleKO: '미션 8: 데뷔 100일 축전', imageUrl: '/sq/ep8.jpg', rewardEntryTicket: 8, rewardFanPoint: 150, biveRewardYn: true, mintingEventId: 27, mintingEventName: 'V01D 100 Days', repeat: false, inProgressMembers: 45, completedMembers: 22, completedType: 'ADMIN_APPROVAL' },
  { id: 109, order: 9, type: 'FAN_QUEST', titleKO: '미션 9: 콘서트 추억 공유', imageUrl: '/sq/ep9.jpg', rewardEntryTicket: 10, rewardFanPoint: 180, biveRewardYn: false, mintingEventId: null, mintingEventName: null, repeat: false, inProgressMembers: 30, completedMembers: 10, completedType: 'ADMIN_APPROVAL' },
  { id: 110, order: 10, type: 'FAN_QUEST', titleKO: '미션 10: 최종 — 팬덤 대모험', imageUrl: '/sq/ep10.jpg', rewardEntryTicket: 20, rewardFanPoint: 500, biveRewardYn: true, mintingEventId: 25, mintingEventName: 'V01D Final Boss', repeat: false, inProgressMembers: 0, completedMembers: 0, completedType: 'ADMIN_APPROVAL' },
];

// chapter id (storyId*100 + order) ↔ fanquest id — 1:1 unique
// 한 fanquest는 정확히 하나의 chapter에만 묶일 수 있다 (운영 정책).
const CHAPTER_FAN_QUEST_ASSIGNMENT: Record<number, number> = {
  101: 1,   // story 1 ch1 (V01D #1 메인1) → GUESS JOURNEY (일반)
  104: 10,  // story 1 ch4                → TikTok 팔로우 (반복 일간)
  105: 2,   // story 1 ch5                → 인스타 응원 (반복 주간)
  204: 3,   // story 2 ch4 (V01D #1 메인2) → X 응원 (반복 주간)
  401: 4,   // story 4 ch1 (V01D #1 메인4) → 인스타 래플 (일반)
  504: 5,   // story 5 ch4 (V01D #1 메인5) → X 래플 (일반)
  1301: 12, // story 13 ch1 (V01D #0 메인5, CLOSED 그룹) → 송유찬 (종료)
};

export function getEpisodesByStoryId(storyId: number): StoryEpisode[] {
  const story = getStoryQuestById(storyId);
  if (!story) return [];
  return EPISODE_DATA.slice(0, story.episodeCount).map((c, i) => {
    const epId = storyId * 100 + i + 1;
    return {
      ...c,
      id: epId,
      storyQuestId: storyId,
      fanQuestId: c.type === 'FAN_QUEST' ? CHAPTER_FAN_QUEST_ASSIGNMENT[epId] : undefined,
    };
  });
}

export function getEpisodeById(epId: number): StoryEpisode | undefined {
  // epId = storyId * 100 + order — 역산하여 매핑
  const storyId = Math.floor(epId / 100);
  const order = epId % 100;
  const story = getStoryQuestById(storyId);
  if (!story || order < 1 || order > story.episodeCount) return undefined;
  const tpl = EPISODE_DATA[order - 1];
  if (!tpl) return undefined;
  return {
    ...tpl,
    id: epId,
    storyQuestId: storyId,
    fanQuestId: tpl.type === 'FAN_QUEST' ? CHAPTER_FAN_QUEST_ASSIGNMENT[epId] : undefined,
  };
}

/**
 * SQ Quest 생성 화면에서 사용 — 이미 다른 chapter에 묶여 있는 fanquest는 드롭다운에서 제외해야 함.
 * @returns 현재 묶인 fanQuestId 집합
 */
export function getAssignedFanQuestIds(): Set<number> {
  return new Set(Object.values(CHAPTER_FAN_QUEST_ASSIGNMENT));
}

export const storyStats = {
  total: storyQuests.length,
  draft: storyQuests.filter((s) => s.status === 'DRAFT').length,
  active: storyQuests.filter((s) => s.status === 'ACTIVE').length,
  closed: storyQuests.filter((s) => s.status === 'CLOSED').length,
  totalPendingReview: storyQuests.reduce((s, q) => s + q.pendingReview, 0),
};

// ============================================================
// 퀘스트 추가 화면용 — 외부 콘텐츠(FanQuest / PM / ST) 참조 리스트
// 에피소드 그룹의 아티스트로 필터링하여 사용
// ============================================================

export interface ExternalContent {
  id: number;
  title: string;
  artistGroup: ArtistGroup;
  status: '진행중' | '예정' | '종료';
  /** v1.6 신규 — 팬퀘스트의 반복 설정 (REPEAT 에피소드 필터링용) */
  repeat: boolean;
}

// 팬퀘스트 — fanquest.ts의 데이터를 SQ 영역에서도 참조용으로 노출
// repeat=true: 반복 가능한 팬퀘스트 (월간/주간 인증류) — REPEAT 에피소드에서 사용
const FAN_QUESTS: ExternalContent[] = [
  { id: 1, title: "V01D 'GUESS JOURNEY #01 SETLIST' 이벤트 참여 인증", artistGroup: 'V01D', status: '진행중', repeat: false },
  { id: 2, title: "인스타에서 V01D 'journey #01' 응원하기", artistGroup: 'V01D', status: '진행중', repeat: true },
  { id: 3, title: "X에서 V01D 'journey #01' 응원하기", artistGroup: 'V01D', status: '진행중', repeat: true },
  { id: 4, title: "인스타에 V01D 'journey #01' 콘서트 래플 소개하기", artistGroup: 'V01D', status: '진행중', repeat: false },
  { id: 5, title: "X에 V01D 'journey #01' 콘서트 래플 소개하기", artistGroup: 'V01D', status: '진행중', repeat: false },
  { id: 6, title: 'iKON 최애곡 스트리밍 인증', artistGroup: 'iKON', status: '진행중', repeat: true },
  { id: 7, title: 'iKON 콘서트 위시리스트 TOP 5', artistGroup: 'iKON', status: '진행중', repeat: false },
  { id: 8, title: '#iKON_CELEBUS 해시태그 포스팅', artistGroup: 'iKON', status: '진행중', repeat: true },
  { id: 9, title: 'iKON 공식 SNS 팔로우 인증', artistGroup: 'iKON', status: '진행중', repeat: true },
  { id: 10, title: 'V01D TikTok 팔로우 또는 YouTube 구독 인증', artistGroup: 'V01D', status: '진행중', repeat: true },
  { id: 20, title: 'CELEBUS 1주년 기념 응원 메시지', artistGroup: 'CELEBUS', status: '진행중', repeat: false },
];

// PM(Prediction Market) — 운영 휴면이지만 mock 시연용
const PREDICTION_MARKETS: ExternalContent[] = [
  { id: 34, title: 'V01D 다음 컴백 시점 예측', artistGroup: 'V01D', status: '진행중', repeat: false },
  { id: 35, title: 'V01D 신규 멤버 발표 시점 예측', artistGroup: 'V01D', status: '예정', repeat: false },
  { id: 36, title: 'iKON 컴백 앨범 1위 차트인 예측', artistGroup: 'iKON', status: '진행중', repeat: false },
  { id: 37, title: 'CELEBUS 1주년 다음 캠페인 주제', artistGroup: 'CELEBUS', status: '예정', repeat: false },
];

// ST(Survival Trivia) — 운영 휴면이지만 mock 시연용
const SURVIVAL_TRIVIA: ExternalContent[] = [
  { id: 12, title: 'V01D 데뷔곡 가사 퀴즈', artistGroup: 'V01D', status: '진행중', repeat: false },
  { id: 13, title: 'V01D 멤버 MBTI 퀴즈', artistGroup: 'V01D', status: '예정', repeat: false },
  { id: 14, title: 'iKON 디스코그래피 마스터 퀴즈', artistGroup: 'iKON', status: '진행중', repeat: false },
  { id: 15, title: 'CELEBUS 운영진 OX 퀴즈', artistGroup: 'CELEBUS', status: '진행중', repeat: false },
];

export function getFanQuestsByArtist(artist: ArtistGroup): ExternalContent[] {
  return FAN_QUESTS.filter((q) => q.artistGroup === artist);
}

// v1.6 신규 — REPEAT 에피소드에서만 노출 (반복 설정된 팬퀘스트만)
export function getRepeatFanQuestsByArtist(artist: ArtistGroup): ExternalContent[] {
  return FAN_QUESTS.filter((q) => q.artistGroup === artist && q.repeat);
}

export function getPredictionMarketsByArtist(artist: ArtistGroup): ExternalContent[] {
  return PREDICTION_MARKETS.filter((p) => p.artistGroup === artist);
}

export function getSurvivalTriviaByArtist(artist: ArtistGroup): ExternalContent[] {
  return SURVIVAL_TRIVIA.filter((s) => s.artistGroup === artist);
}

// PM·ST 완료 조건 운영 정책
export type GameCondition = 'PARTICIPATION_COUNT' | 'WIN_COUNT';
export const GAME_CONDITION_LABEL: Record<GameCondition, string> = {
  PARTICIPATION_COUNT: '참여 횟수',
  WIN_COUNT: '승리 횟수',
};
