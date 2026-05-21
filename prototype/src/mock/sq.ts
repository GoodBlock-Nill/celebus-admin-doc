// 스토리 퀘스트(SQ) v2.3 — [CEB-BO-011] v3.8 + [CEB-BO-SQ-MOCK-GUIDE] v1.0 SSOT
// 계층 v2.2: EpisodeGroup → StoryQuest(에피소드) → StoryEpisode(미션, 완료조건 흡수)
// 수량 제약: 그룹당 메인 5 + 반복 1 / 에피소드당 미션 10
//
// v2.3 mock 풀 개선 (2026-05-21):
// - K-pop 시즌 스토리텔링으로 그룹·에피소드·미션 타이틀 전면 재작성
// - 아티스트 V01D 단일 → V01D + iKON + CELEBUS 3종
// - 정책 매트릭스 6조합(상태 DRAFT/ACTIVE/CLOSED × 유형 팬퀘스트/PM/ST) 100% 커버
// - PM/ST 미션 다국어 titleEN/titleJA 100% 입력 ([CEB-BO-011] §5 정합)
// - 반복 주기 DAILY/WEEKLY/MONTHLY 3종 실장
// - EPISODE_DATA 단일 템플릿 → ALL_EPISODES 직접 정의 배열 구조 전환

export type StoryQuestStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type EpisodeGroupStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type ArtistGroup = 'V01D' | 'iKON' | 'CELEBUS';
export type EpisodeType = 'FAN_QUEST' | 'PREDICTION_MARKET' | 'SURVIVAL_TRIVIA';
export type EpisodeUserStatus = 'LOCK' | 'ACTIVE' | 'COMPLETED';
export type EpisodeCompletedType =
  | 'ADMIN_APPROVAL'
  | 'PM_PARTICIPATION'
  | 'PM_CORRECT'
  | 'TRIVIA_PARTICIPATION'
  | 'TRIVIA_CORRECT_COUNT';

export const MAX_EPISODES_PER_STORY = 10;
export const MAX_MAIN_EPISODES = 5;
export const MAX_REPEAT_EPISODES = 1;
export const REPEAT_EPISODE_DISPLAY_ORDER = 6;

export type EpisodeKind = 'MAIN' | 'REPEAT';

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

export interface StoryQuest {
  id: number;
  groupId: number;
  episodeKind: EpisodeKind;
  displayOrder: number;
  artistGroup: ArtistGroup;
  status: StoryQuestStatus;
  titleKO: string;
  titleEN: string;
  titleJA: string;
  imageUrl: string;
  descKO: string;
  descEN: string;
  descJA: string;
  episodeCount: number;
  activeMembers: number;
  totalCompleted: number;
  pendingReview: number;
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
  /**
   * v3.4 신규 — PM/ST 미션 다국어 타이틀 (KO/EN/JA 3종 모두 필수, 각 50자).
   * 팬퀘스트 미션은 fanQuestId로 자동 상속이라 빈 문자열 유지.
   * [CEB-BO-SQ-204-CREATE] §2-7 / [CEB-BO-011] §5 정합
   */
  titleEN: string;
  titleJA: string;
  imageUrl: string;
  rewardEntryTicket: number;
  rewardFanPoint: number;
  biveRewardYn: boolean;
  mintingEventId: number | null;
  mintingEventName: string | null;
  repeat: boolean;
  inProgressMembers: number;
  completedMembers: number;
  fanQuestId?: number;
  completedType?: EpisodeCompletedType;
  completedValue?: number;
  sourceRefName?: string;
  repeatCycle?: 'DAILY' | 'MONTHLY' | 'WEEKLY' | null;
  openDt?: string;
  closeDt?: string;
}

// ============================================================
// 에피소드 그룹 — 6건 (V01D 3 + iKON 2 + CELEBUS 1)
// 상태 분포: ACTIVE 2 / DRAFT 2 / CLOSED 2 (아티스트당 ACTIVE 1개 한도 정합)
// ============================================================
export const episodeGroups: EpisodeGroup[] = [
  {
    id: 1,
    artistGroup: 'V01D',
    status: 'ACTIVE',
    titleKO: 'V01D — JOURNEY #01 컴백 시즌',
    startDt: '2026.05.01 00:00',
    endDt: '2026.07.31 23:59',
    episodeCount: 6,
    createdBy: 'nill',
    createdAt: '2026.04.20 14:00',
    updatedBy: 'nill',
    updatedAt: '2026.05.10 11:30',
  },
  {
    id: 2,
    artistGroup: 'V01D',
    status: 'CLOSED',
    titleKO: 'V01D — 데뷔 1주년 기념 시즌',
    startDt: '2025.10.01 00:00',
    endDt: '2025.12.31 23:59',
    episodeCount: 5,
    createdBy: 'nill',
    createdAt: '2025.09.18 09:00',
    updatedBy: 'nill',
    updatedAt: '2026.01.05 10:00',
  },
  {
    id: 3,
    artistGroup: 'V01D',
    status: 'DRAFT',
    titleKO: 'V01D — 2026 가을 컴백 예비',
    startDt: '2026.09.01 00:00',
    endDt: '2026.11.30 23:59',
    episodeCount: 3,
    createdBy: 'nill',
    createdAt: '2026.05.15 10:00',
    updatedBy: 'nill',
    updatedAt: '2026.05.20 16:00',
  },
  {
    id: 4,
    artistGroup: 'iKON',
    status: 'ACTIVE',
    titleKO: 'iKON — 데뷔 10주년 글로벌 투어',
    startDt: '2026.04.01 00:00',
    endDt: '2026.06.30 23:59',
    episodeCount: 5,
    createdBy: 'nill',
    createdAt: '2026.03.20 09:00',
    updatedBy: 'nill',
    updatedAt: '2026.05.18 13:00',
  },
  {
    id: 5,
    artistGroup: 'iKON',
    status: 'CLOSED',
    titleKO: 'iKON — KCON 2025 종합 시즌',
    startDt: '2025.07.01 00:00',
    endDt: '2025.09.30 23:59',
    episodeCount: 3,
    createdBy: 'nill',
    createdAt: '2025.06.20 10:00',
    updatedBy: 'nill',
    updatedAt: '2025.10.05 11:00',
  },
  {
    id: 6,
    artistGroup: 'CELEBUS',
    status: 'DRAFT',
    titleKO: 'CELEBUS — 플랫폼 1주년 캠페인',
    startDt: '2026.06.01 00:00',
    endDt: '2026.08.31 23:59',
    episodeCount: 2,
    createdBy: 'nill',
    createdAt: '2026.05.18 11:00',
    updatedBy: 'nill',
    updatedAt: '2026.05.21 10:00',
  },
];

// ============================================================
// 에피소드(StoryQuest) — 총 24건 (그룹별 분포)
// Group 1 V01D ACTIVE: 메인 5 + 반복 1 (id 1~6)
// Group 2 V01D CLOSED: 메인 4 + 반복 1 (id 7~11)
// Group 3 V01D DRAFT:  메인 2 + 반복 1 (id 12~14)
// Group 4 iKON ACTIVE: 메인 4 + 반복 1 (id 15~19)
// Group 5 iKON CLOSED: 메인 3 (id 20~22)
// Group 6 CELEBUS DRAFT: 메인 2 (id 23~24)
// ============================================================
export const storyQuests: StoryQuest[] = [
  // ── Group 1 (V01D ACTIVE — JOURNEY #01 컴백 시즌)
  {
    id: 1, groupId: 1, episodeKind: 'MAIN', displayOrder: 1,
    artistGroup: 'V01D', status: 'ACTIVE',
    titleKO: '컴백 D-DAY — 신곡 발매 인증',
    titleEN: 'Comeback D-DAY — Title Track Release',
    titleJA: 'カムバック D-DAY — タイトル曲リリース',
    imageUrl: '/sq/v01d-journey-01.jpg',
    descKO: 'JOURNEY #01 타이틀곡 발매일 — 스트리밍·SNS 인증·차트 예측·가사 트리비아로 컴백을 함께 축하합니다.',
    descEN: 'JOURNEY #01 title track release day — celebrate the comeback through streaming proof, SNS posts, chart predictions, and lyrics trivia.',
    descJA: 'JOURNEY #01 タイトル曲リリース日 — ストリーミング認証·SNS投稿·チャート予測·歌詞トリビアでカムバックを一緒にお祝いしましょう。',
    episodeCount: 3,
    activeMembers: 1240, totalCompleted: 820, pendingReview: 18,
    episodeReward: {
      entryTicket: 20, fanPoint: 500, biveRewardYn: true,
      mintingEventId: 23, mintingEventName: 'V01D Welcome ED',
    },
    createdBy: 'nill', createdAt: '2026.04.20 14:10',
    updatedBy: 'nill', updatedAt: '2026.05.01 09:00',
  },
  {
    id: 2, groupId: 1, episodeKind: 'MAIN', displayOrder: 2,
    artistGroup: 'V01D', status: 'ACTIVE',
    titleKO: '뮤직비디오 1000만 뷰 달성',
    titleEN: 'Reach 10M Views on Music Video',
    titleJA: 'ミュージックビデオ1000万再生達成',
    imageUrl: '/sq/v01d-journey-02.jpg',
    descKO: '신곡 뮤직비디오 1000만 뷰까지 함께 달려가는 단계 미션.',
    descEN: 'A milestone episode for reaching 10M views on the new music video together.',
    descJA: '新曲ミュージックビデオ1000万再生まで一緒に走るマイルストーンエピソード。',
    episodeCount: 2,
    activeMembers: 980, totalCompleted: 540, pendingReview: 8,
    episodeReward: {
      entryTicket: 15, fanPoint: 300, biveRewardYn: false,
      mintingEventId: null, mintingEventName: null,
    },
    createdBy: 'nill', createdAt: '2026.04.20 14:20',
    updatedBy: 'nill', updatedAt: '2026.05.05 11:00',
  },
  {
    id: 3, groupId: 1, episodeKind: 'MAIN', displayOrder: 3,
    artistGroup: 'V01D', status: 'ACTIVE',
    titleKO: '음악방송 1위 도전',
    titleEN: 'Conquer Music Show #1',
    titleJA: '音楽番組 1位 挑戦',
    imageUrl: '/sq/v01d-journey-03.jpg',
    descKO: '음악방송 1위를 위해 사전 투표·실시간 시청 인증·결과 예측까지 함께합니다.',
    descEN: 'Pre-voting, live viewing proof, and result prediction for the #1 win on music shows.',
    descJA: '音楽番組 1位のための事前投票·リアルタイム視聴認証·結果予測まで一緒にします。',
    episodeCount: 2,
    activeMembers: 720, totalCompleted: 380, pendingReview: 5,
    episodeReward: {
      entryTicket: 25, fanPoint: 600, biveRewardYn: true,
      mintingEventId: 25, mintingEventName: 'V01D Final Boss',
    },
    createdBy: 'nill', createdAt: '2026.04.20 14:30',
    updatedBy: 'nill', updatedAt: '2026.05.10 09:30',
  },
  {
    id: 4, groupId: 1, episodeKind: 'MAIN', displayOrder: 4,
    artistGroup: 'V01D', status: 'ACTIVE',
    titleKO: '월드투어 응원 프로젝트',
    titleEN: 'World Tour Cheering Project',
    titleJA: 'ワールドツアー応援プロジェクト',
    imageUrl: '/sq/v01d-journey-04.jpg',
    descKO: '월드투어 개최를 위한 글로벌 팬덤 결집 단계.',
    descEN: 'A stage to rally the global fandom for a world tour.',
    descJA: 'ワールドツアー開催のためのグローバルファンダム結集段階。',
    episodeCount: 1,
    activeMembers: 550, totalCompleted: 210, pendingReview: 3,
    episodeReward: null,
    createdBy: 'nill', createdAt: '2026.04.20 14:40',
    updatedBy: 'nill', updatedAt: '2026.05.12 10:00',
  },
  {
    id: 5, groupId: 1, episodeKind: 'MAIN', displayOrder: 5,
    artistGroup: 'V01D', status: 'ACTIVE',
    titleKO: '시즌 피날레 — 팬미팅 인증',
    titleEN: 'Season Finale — Fan Meeting Proof',
    titleJA: 'シーズンフィナーレ — ファンミーティング認証',
    imageUrl: '/sq/v01d-journey-05.jpg',
    descKO: 'JOURNEY #01 시즌 피날레 — 팬미팅 참여 인증 + 시즌 회고.',
    descEN: 'JOURNEY #01 season finale — fan meeting proof + season retrospective.',
    descJA: 'JOURNEY #01 シーズンフィナーレ — ファンミーティング参加認証 + シーズン回顧。',
    episodeCount: 1,
    activeMembers: 320, totalCompleted: 60, pendingReview: 1,
    episodeReward: {
      entryTicket: 30, fanPoint: 800, biveRewardYn: true,
      mintingEventId: 25, mintingEventName: 'V01D Final Boss',
    },
    createdBy: 'nill', createdAt: '2026.04.20 14:50',
    updatedBy: 'nill', updatedAt: '2026.05.15 14:00',
  },
  {
    id: 6, groupId: 1, episodeKind: 'REPEAT', displayOrder: REPEAT_EPISODE_DISPLAY_ORDER,
    artistGroup: 'V01D', status: 'ACTIVE',
    titleKO: '매일 만나는 V01D — 일일·주간 미션',
    titleEN: 'Daily V01D — Daily & Weekly Missions',
    titleJA: '毎日会えるV01D — デイリー·ウィークリーミッション',
    imageUrl: '/sq/v01d-journey-repeat.jpg',
    descKO: '일일 트리비아·주간 라이브 시청 등 반복 미션으로 시즌 동안 매일 V01D를 만납니다.',
    descEN: 'Daily trivia and weekly live viewing — recurring missions to meet V01D every day during the season.',
    descJA: 'デイリートリビア·ウィークリーライブ視聴など繰り返しミッションでシーズン中毎日V01Dに会います。',
    episodeCount: 2,
    activeMembers: 1860, totalCompleted: 1240, pendingReview: 12,
    episodeReward: null,
    createdBy: 'nill', createdAt: '2026.04.20 15:00',
    updatedBy: 'nill', updatedAt: '2026.05.18 16:30',
  },
  // ── Group 2 (V01D CLOSED — 데뷔 1주년 기념 시즌)
  {
    id: 7, groupId: 2, episodeKind: 'MAIN', displayOrder: 1,
    artistGroup: 'V01D', status: 'CLOSED',
    titleKO: '데뷔 1주년 축하 메시지',
    titleEN: '1st Anniversary Celebration Messages',
    titleJA: 'デビュー1周年お祝いメッセージ',
    imageUrl: '/sq/v01d-anniv-01.jpg',
    descKO: '데뷔 1주년을 축하하는 팬들의 메시지 인증.',
    descEN: 'Fans share celebration messages for the 1st debut anniversary.',
    descJA: 'デビュー1周年をお祝いするファンのメッセージ認証。',
    episodeCount: 3,
    activeMembers: 2840, totalCompleted: 2680, pendingReview: 0,
    episodeReward: {
      entryTicket: 20, fanPoint: 500, biveRewardYn: true,
      mintingEventId: 27, mintingEventName: 'V01D 100 Days',
    },
    createdBy: 'nill', createdAt: '2025.09.18 09:10',
    updatedBy: 'nill', updatedAt: '2025.12.31 23:50',
  },
  {
    id: 8, groupId: 2, episodeKind: 'MAIN', displayOrder: 2,
    artistGroup: 'V01D', status: 'CLOSED',
    titleKO: '1주년 추억 트리비아',
    titleEN: '1st Anniversary Memory Trivia',
    titleJA: '1周年思い出トリビア',
    imageUrl: '/sq/v01d-anniv-02.jpg',
    descKO: '데뷔 후 1년간의 활동을 돌아보는 추억 퀴즈.',
    descEN: 'A trivia looking back at one year of activities since debut.',
    descJA: 'デビュー後1年間の活動を振り返る思い出クイズ。',
    episodeCount: 1,
    activeMembers: 2510, totalCompleted: 2380, pendingReview: 0,
    episodeReward: null,
    createdBy: 'nill', createdAt: '2025.09.18 09:20',
    updatedBy: 'nill', updatedAt: '2025.12.31 23:50',
  },
  {
    id: 9, groupId: 2, episodeKind: 'MAIN', displayOrder: 3,
    artistGroup: 'V01D', status: 'CLOSED',
    titleKO: '1주년 기념 행사 참여',
    titleEN: '1st Anniversary Event Participation',
    titleJA: '1周年記念イベント参加',
    imageUrl: '/sq/v01d-anniv-03.jpg',
    descKO: '1주년 오프라인 팬 행사 참여 인증 + 행사 참여수 예측.',
    descEN: '1st anniversary offline fan event participation proof + attendance prediction.',
    descJA: '1周年オフラインファンイベント参加認証 + 参加者数予測。',
    episodeCount: 2,
    activeMembers: 2200, totalCompleted: 2050, pendingReview: 0,
    episodeReward: {
      entryTicket: 15, fanPoint: 300, biveRewardYn: false,
      mintingEventId: null, mintingEventName: null,
    },
    createdBy: 'nill', createdAt: '2025.09.18 09:30',
    updatedBy: 'nill', updatedAt: '2025.12.31 23:50',
  },
  {
    id: 10, groupId: 2, episodeKind: 'MAIN', displayOrder: 4,
    artistGroup: 'V01D', status: 'CLOSED',
    titleKO: '시즌 종료 — 새해 응원 메시지',
    titleEN: 'Season Closing — New Year Cheering',
    titleJA: 'シーズン終了 — 新年応援メッセージ',
    imageUrl: '/sq/v01d-anniv-04.jpg',
    descKO: '1주년 시즌을 마무리하며 다음 해 활동을 응원하는 메시지.',
    descEN: 'Closing the 1st anniversary season with cheering messages for next year.',
    descJA: '1周年シーズンを終え、次年の活動を応援するメッセージ。',
    episodeCount: 1,
    activeMembers: 1890, totalCompleted: 1720, pendingReview: 0,
    episodeReward: null,
    createdBy: 'nill', createdAt: '2025.09.18 09:40',
    updatedBy: 'nill', updatedAt: '2025.12.31 23:50',
  },
  {
    id: 11, groupId: 2, episodeKind: 'REPEAT', displayOrder: REPEAT_EPISODE_DISPLAY_ORDER,
    artistGroup: 'V01D', status: 'CLOSED',
    titleKO: '1주년 시즌 월간 인증 (종료)',
    titleEN: '1st Anniversary Monthly Proof (Closed)',
    titleJA: '1周年シーズン月間認証(終了)',
    imageUrl: '/sq/v01d-anniv-repeat.jpg',
    descKO: '1주년 시즌 3개월 동안 월 1회 진행됐던 반복 미션. (종료)',
    descEN: 'Recurring mission that ran monthly during the 3-month 1st anniversary season. (closed)',
    descJA: '1周年シーズン3か月間月1回行われた繰り返しミッション。(終了)',
    episodeCount: 1,
    activeMembers: 1640, totalCompleted: 1480, pendingReview: 0,
    episodeReward: null,
    createdBy: 'nill', createdAt: '2025.09.18 09:50',
    updatedBy: 'nill', updatedAt: '2025.12.31 23:50',
  },
  // ── Group 3 (V01D DRAFT — 2026 가을 컴백 예비)
  {
    id: 12, groupId: 3, episodeKind: 'MAIN', displayOrder: 1,
    artistGroup: 'V01D', status: 'DRAFT',
    titleKO: '컴백 티저 영상 시청 (작성 중)',
    titleEN: 'Comeback Teaser Video (Draft)',
    titleJA: 'カムバックティザー映像(作成中)',
    imageUrl: '/sq/v01d-fall-01.jpg',
    descKO: '2026 가을 컴백 첫 티저 영상 시청 인증 단계. (작성 중)',
    descEN: 'Episode for watching the first teaser of the 2026 fall comeback. (draft)',
    descJA: '2026年秋カムバック最初のティザー映像視聴認証段階。(作成中)',
    episodeCount: 3,
    activeMembers: 0, totalCompleted: 0, pendingReview: 0,
    episodeReward: null,
    createdBy: 'nill', createdAt: '2026.05.15 10:10',
    updatedBy: 'nill', updatedAt: '2026.05.18 14:00',
  },
  {
    id: 13, groupId: 3, episodeKind: 'MAIN', displayOrder: 2,
    artistGroup: 'V01D', status: 'DRAFT',
    titleKO: '데뷔곡 차트 진입 예측 (작성 중)',
    titleEN: 'Debut Song Chart Entry Prediction (Draft)',
    titleJA: 'デビュー曲チャートイン予測(作成中)',
    imageUrl: '/sq/v01d-fall-02.jpg',
    descKO: '2026 가을 신곡의 차트 진입 순위 예측 미션. (작성 중)',
    descEN: 'Mission to predict chart entry rank of the 2026 fall new song. (draft)',
    descJA: '2026年秋新曲のチャートイン順位予測ミッション。(作成中)',
    episodeCount: 1,
    activeMembers: 0, totalCompleted: 0, pendingReview: 0,
    episodeReward: null,
    createdBy: 'nill', createdAt: '2026.05.15 10:20',
    updatedBy: 'nill', updatedAt: '2026.05.20 16:00',
  },
  {
    id: 14, groupId: 3, episodeKind: 'REPEAT', displayOrder: REPEAT_EPISODE_DISPLAY_ORDER,
    artistGroup: 'V01D', status: 'DRAFT',
    titleKO: '가을 시즌 주간 반복 (작성 중)',
    titleEN: 'Fall Season Weekly Recurring (Draft)',
    titleJA: '秋シーズンウィークリー(作成中)',
    imageUrl: '/sq/v01d-fall-repeat.jpg',
    descKO: '가을 시즌 동안 주 1회 진행될 반복 미션 (작성 중).',
    descEN: 'Recurring mission planned to run weekly during the fall season (draft).',
    descJA: '秋シーズン中週1回行われる繰り返しミッション(作成中)。',
    episodeCount: 1,
    activeMembers: 0, totalCompleted: 0, pendingReview: 0,
    episodeReward: null,
    createdBy: 'nill', createdAt: '2026.05.15 10:30',
    updatedBy: 'nill', updatedAt: '2026.05.20 16:30',
  },
  // ── Group 4 (iKON ACTIVE — 데뷔 10주년 글로벌 투어)
  {
    id: 15, groupId: 4, episodeKind: 'MAIN', displayOrder: 1,
    artistGroup: 'iKON', status: 'ACTIVE',
    titleKO: '10주년 시작 — 멤버 메시지 영상',
    titleEN: '10th Anniversary Kickoff — Member Messages',
    titleJA: '10周年スタート — メンバーメッセージ映像',
    imageUrl: '/sq/ikon-tour-01.jpg',
    descKO: 'iKON 데뷔 10주년 — 각 멤버의 시작 메시지 영상 시청 + 추억 트리비아.',
    descEN: 'iKON 10th anniversary — watch each member message video and answer memory trivia.',
    descJA: 'iKONデビュー10周年 — 各メンバーのスタートメッセージ映像視聴 + 思い出トリビア。',
    episodeCount: 3,
    activeMembers: 950, totalCompleted: 620, pendingReview: 14,
    episodeReward: {
      entryTicket: 20, fanPoint: 500, biveRewardYn: true,
      mintingEventId: 23, mintingEventName: 'V01D Welcome ED',
    },
    createdBy: 'nill', createdAt: '2026.03.20 09:10',
    updatedBy: 'nill', updatedAt: '2026.04.05 11:00',
  },
  {
    id: 16, groupId: 4, episodeKind: 'MAIN', displayOrder: 2,
    artistGroup: 'iKON', status: 'ACTIVE',
    titleKO: '글로벌 투어 도시 예측',
    titleEN: 'Global Tour City Prediction',
    titleJA: 'グローバルツアー都市予測',
    imageUrl: '/sq/ikon-tour-02.jpg',
    descKO: '추가 발표될 글로벌 투어 도시 + 셋리스트 예측.',
    descEN: 'Predict the next announced global tour cities and setlist.',
    descJA: '追加発表されるグローバルツアー都市 + セットリスト予測。',
    episodeCount: 2,
    activeMembers: 780, totalCompleted: 420, pendingReview: 9,
    episodeReward: null,
    createdBy: 'nill', createdAt: '2026.03.20 09:20',
    updatedBy: 'nill', updatedAt: '2026.04.10 13:00',
  },
  {
    id: 17, groupId: 4, episodeKind: 'MAIN', displayOrder: 3,
    artistGroup: 'iKON', status: 'ACTIVE',
    titleKO: '투어 굿즈 사전 예약 인증',
    titleEN: 'Tour Goods Pre-order Proof',
    titleJA: 'ツアーグッズ事前予約認証',
    imageUrl: '/sq/ikon-tour-03.jpg',
    descKO: '글로벌 투어 공식 굿즈 사전 예약 인증샷 업로드.',
    descEN: 'Upload pre-order proof screenshot for global tour official goods.',
    descJA: 'グローバルツアー公式グッズ事前予約認証スクリーンショットをアップロード。',
    episodeCount: 1,
    activeMembers: 540, totalCompleted: 280, pendingReview: 6,
    episodeReward: null,
    createdBy: 'nill', createdAt: '2026.03.20 09:30',
    updatedBy: 'nill', updatedAt: '2026.04.15 10:00',
  },
  {
    id: 18, groupId: 4, episodeKind: 'MAIN', displayOrder: 4,
    artistGroup: 'iKON', status: 'ACTIVE',
    titleKO: '투어 후기 공유',
    titleEN: 'Tour Review Sharing',
    titleJA: 'ツアー後記共有',
    imageUrl: '/sq/ikon-tour-04.jpg',
    descKO: '직관한 투어 공연의 후기를 SNS에 공유 + 해시태그 인증.',
    descEN: 'Share tour concert reviews on SNS + hashtag proof.',
    descJA: '直接観覧したツアー公演の後記をSNSに共有 + ハッシュタグ認証。',
    episodeCount: 1,
    activeMembers: 320, totalCompleted: 140, pendingReview: 4,
    episodeReward: {
      entryTicket: 15, fanPoint: 300, biveRewardYn: false,
      mintingEventId: null, mintingEventName: null,
    },
    createdBy: 'nill', createdAt: '2026.03.20 09:40',
    updatedBy: 'nill', updatedAt: '2026.04.20 14:00',
  },
  {
    id: 19, groupId: 4, episodeKind: 'REPEAT', displayOrder: REPEAT_EPISODE_DISPLAY_ORDER,
    artistGroup: 'iKON', status: 'ACTIVE',
    titleKO: '주간 예측 마라톤 (반복)',
    titleEN: 'Weekly Prediction Marathon (Recurring)',
    titleJA: 'ウィークリー予測マラソン(繰り返し)',
    imageUrl: '/sq/ikon-tour-repeat.jpg',
    descKO: '주 1회 진행되는 PM 예측 미션 — 시즌 동안 주간으로 반복.',
    descEN: 'PM prediction mission running once a week — recurring weekly during the season.',
    descJA: '週1回行われるPM予測ミッション — シーズン中ウィークリーで繰り返し。',
    episodeCount: 1,
    activeMembers: 680, totalCompleted: 410, pendingReview: 0,
    episodeReward: null,
    createdBy: 'nill', createdAt: '2026.03.20 09:50',
    updatedBy: 'nill', updatedAt: '2026.05.18 16:30',
  },
  // ── Group 5 (iKON CLOSED — KCON 2025 종합 시즌)
  {
    id: 20, groupId: 5, episodeKind: 'MAIN', displayOrder: 1,
    artistGroup: 'iKON', status: 'CLOSED',
    titleKO: 'KCON 2025 무대 인증',
    titleEN: 'KCON 2025 Stage Proof',
    titleJA: 'KCON 2025 ステージ認証',
    imageUrl: '/sq/ikon-kcon-01.jpg',
    descKO: 'KCON 2025 무대 관람 인증 + 최애 무대 투표.',
    descEN: 'KCON 2025 stage attendance proof + favorite stage vote.',
    descJA: 'KCON 2025 ステージ観覧認証 + 最推しステージ投票。',
    episodeCount: 3,
    activeMembers: 1520, totalCompleted: 1450, pendingReview: 0,
    episodeReward: {
      entryTicket: 20, fanPoint: 400, biveRewardYn: true,
      mintingEventId: 24, mintingEventName: 'V01D Trivia Master',
    },
    createdBy: 'nill', createdAt: '2025.06.20 10:10',
    updatedBy: 'nill', updatedAt: '2025.10.05 11:00',
  },
  {
    id: 21, groupId: 5, episodeKind: 'MAIN', displayOrder: 2,
    artistGroup: 'iKON', status: 'CLOSED',
    titleKO: 'KCON 굿즈 인증',
    titleEN: 'KCON Goods Proof',
    titleJA: 'KCONグッズ認証',
    imageUrl: '/sq/ikon-kcon-02.jpg',
    descKO: 'KCON 2025 공식 굿즈 구매 인증샷.',
    descEN: 'KCON 2025 official goods purchase proof.',
    descJA: 'KCON 2025 公式グッズ購入認証。',
    episodeCount: 1,
    activeMembers: 1280, totalCompleted: 1180, pendingReview: 0,
    episodeReward: null,
    createdBy: 'nill', createdAt: '2025.06.20 10:20',
    updatedBy: 'nill', updatedAt: '2025.10.05 11:00',
  },
  {
    id: 22, groupId: 5, episodeKind: 'MAIN', displayOrder: 3,
    artistGroup: 'iKON', status: 'CLOSED',
    titleKO: 'KCON 추억 트리비아',
    titleEN: 'KCON Memory Trivia',
    titleJA: 'KCON 思い出トリビア',
    imageUrl: '/sq/ikon-kcon-03.jpg',
    descKO: 'KCON 2025 종료 후 추억을 돌아보는 종합 트리비아.',
    descEN: 'A comprehensive trivia looking back at KCON 2025 after the season.',
    descJA: 'KCON 2025 終了後に思い出を振り返る総合トリビア。',
    episodeCount: 1,
    activeMembers: 1120, totalCompleted: 980, pendingReview: 0,
    episodeReward: null,
    createdBy: 'nill', createdAt: '2025.06.20 10:30',
    updatedBy: 'nill', updatedAt: '2025.10.05 11:00',
  },
  // ── Group 6 (CELEBUS DRAFT — 플랫폼 1주년 캠페인)
  {
    id: 23, groupId: 6, episodeKind: 'MAIN', displayOrder: 1,
    artistGroup: 'CELEBUS', status: 'DRAFT',
    titleKO: '플랫폼 1주년 — 운영진 OX 퀴즈 (작성 중)',
    titleEN: 'Platform 1st Anniversary — Staff OX Quiz (Draft)',
    titleJA: 'プラットフォーム1周年 — 運営陣OXクイズ(作成中)',
    imageUrl: '/sq/celebus-anniv-01.jpg',
    descKO: '플랫폼 1주년 기념 — 운영진 OX 퀴즈 + 다음 캠페인 주제 예측. (작성 중)',
    descEN: 'Platform 1st anniversary — staff OX quiz + next campaign topic prediction. (draft)',
    descJA: 'プラットフォーム1周年記念 — 運営陣OXクイズ + 次のキャンペーンテーマ予測。(作成中)',
    episodeCount: 2,
    activeMembers: 0, totalCompleted: 0, pendingReview: 0,
    episodeReward: null,
    createdBy: 'nill', createdAt: '2026.05.18 11:10',
    updatedBy: 'nill', updatedAt: '2026.05.21 10:00',
  },
  {
    id: 24, groupId: 6, episodeKind: 'MAIN', displayOrder: 2,
    artistGroup: 'CELEBUS', status: 'DRAFT',
    titleKO: '플랫폼 1주년 — 응원 메시지 캠페인 (작성 중)',
    titleEN: 'Platform 1st Anniversary — Cheering Message Campaign (Draft)',
    titleJA: 'プラットフォーム1周年 — 応援メッセージキャンペーン(作成中)',
    imageUrl: '/sq/celebus-anniv-02.jpg',
    descKO: '플랫폼을 이용해주신 팬들에게 보내는 응원 메시지 캠페인. (작성 중)',
    descEN: 'Cheering message campaign for fans who have used the platform. (draft)',
    descJA: 'プラットフォームを利用してくれたファンに送る応援メッセージキャンペーン。(作成中)',
    episodeCount: 1,
    activeMembers: 0, totalCompleted: 0, pendingReview: 0,
    episodeReward: null,
    createdBy: 'nill', createdAt: '2026.05.18 11:20',
    updatedBy: 'nill', updatedAt: '2026.05.21 10:00',
  },
];

// ============================================================
// 미션(StoryEpisode) — 약 36건 직접 정의 (v2.3 — 구 EPISODE_DATA 단일 템플릿 폐기)
// ID 규칙: storyQuestId * 100 + order (예: story 1의 1번째 미션 = 101)
// 정책 매트릭스 6조합(DRAFT/ACTIVE/CLOSED × 팬퀘스트/PM/ST) 100% 커버
// PM/ST 미션 titleEN/titleJA 100% 입력 ([CEB-BO-011] §5 정합)
// ============================================================
export const storyEpisodes: StoryEpisode[] = [
  // ── Story 1: V01D ACTIVE — 컴백 D-DAY (FQ + PM + ST 3종)
  { id: 101, storyQuestId: 1, order: 1, type: 'FAN_QUEST',
    titleKO: '신곡 멜론 100% 듣기 인증', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/101.jpg',
    rewardEntryTicket: 5, rewardFanPoint: 100, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 1240, completedMembers: 1180,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 1 },
  { id: 102, storyQuestId: 1, order: 2, type: 'PREDICTION_MARKET',
    titleKO: '신곡 멜론 차트 1위 진입 예측',
    titleEN: 'Predict New Song #1 on Melon Chart',
    titleJA: '新曲メロンチャート1位入り予測',
    imageUrl: '/sq/ep/102.jpg',
    rewardEntryTicket: 10, rewardFanPoint: 200, biveRewardYn: true, mintingEventId: 26, mintingEventName: 'V01D Prophet',
    repeat: false, inProgressMembers: 980, completedMembers: 720,
    completedType: 'PM_CORRECT', sourceRefName: 'PM #34 — 다음 컴백 시점' },
  { id: 103, storyQuestId: 1, order: 3, type: 'SURVIVAL_TRIVIA',
    titleKO: '신곡 "JOURNEY" 가사 트리비아 5회 정답',
    titleEN: 'New Song "JOURNEY" Lyrics Trivia — 5 Correct',
    titleJA: '新曲「JOURNEY」歌詞トリビア5回正解',
    imageUrl: '/sq/ep/103.jpg',
    rewardEntryTicket: 8, rewardFanPoint: 150, biveRewardYn: true, mintingEventId: 24, mintingEventName: 'V01D Trivia Master',
    repeat: false, inProgressMembers: 820, completedMembers: 580,
    completedType: 'TRIVIA_CORRECT_COUNT', completedValue: 5, sourceRefName: 'ST #12 데뷔곡 가사 퀴즈' },

  // ── Story 2: V01D ACTIVE — 뮤직비디오 1000만 뷰 (FQ + PM)
  { id: 201, storyQuestId: 2, order: 1, type: 'FAN_QUEST',
    titleKO: 'V01D 뮤직비디오 시청·공유 인증', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/201.jpg',
    rewardEntryTicket: 6, rewardFanPoint: 120, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 980, completedMembers: 640,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 2 },
  { id: 202, storyQuestId: 2, order: 2, type: 'PREDICTION_MARKET',
    titleKO: '뮤직비디오 1000만 뷰 달성 시점 예측',
    titleEN: 'Predict When MV Reaches 10M Views',
    titleJA: 'ミュージックビデオ1000万再生達成時期予測',
    imageUrl: '/sq/ep/202.jpg',
    rewardEntryTicket: 10, rewardFanPoint: 200, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 720, completedMembers: 410,
    completedType: 'PM_PARTICIPATION', sourceRefName: 'PM #35 신규 멤버 발표 시점' },

  // ── Story 3: V01D ACTIVE — 음악방송 1위 (FQ + ST)
  { id: 301, storyQuestId: 3, order: 1, type: 'FAN_QUEST',
    titleKO: '음악방송 사전 투표 참여 인증', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/301.jpg',
    rewardEntryTicket: 7, rewardFanPoint: 130, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 720, completedMembers: 480,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 3 },
  { id: 302, storyQuestId: 3, order: 2, type: 'SURVIVAL_TRIVIA',
    titleKO: 'JOURNEY #01 콘서트 셋리스트 트리비아',
    titleEN: 'JOURNEY #01 Concert Setlist Trivia',
    titleJA: 'JOURNEY #01 コンサートセットリストトリビア',
    imageUrl: '/sq/ep/302.jpg',
    rewardEntryTicket: 9, rewardFanPoint: 180, biveRewardYn: true, mintingEventId: 24, mintingEventName: 'V01D Trivia Master',
    repeat: false, inProgressMembers: 560, completedMembers: 320,
    completedType: 'TRIVIA_PARTICIPATION', sourceRefName: 'ST #13 멤버 MBTI 퀴즈' },

  // ── Story 4: V01D ACTIVE — 월드투어 응원 (FQ)
  { id: 401, storyQuestId: 4, order: 1, type: 'FAN_QUEST',
    titleKO: '월드투어 응원 SNS 포스팅 인증', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/401.jpg',
    rewardEntryTicket: 8, rewardFanPoint: 150, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 550, completedMembers: 320,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 4 },

  // ── Story 5: V01D ACTIVE — 시즌 피날레 (FQ)
  { id: 501, storyQuestId: 5, order: 1, type: 'FAN_QUEST',
    titleKO: '팬미팅 참여 인증샷 업로드', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/501.jpg',
    rewardEntryTicket: 20, rewardFanPoint: 500, biveRewardYn: true, mintingEventId: 25, mintingEventName: 'V01D Final Boss',
    repeat: false, inProgressMembers: 320, completedMembers: 60,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 5 },

  // ── Story 6: V01D ACTIVE 반복 — 일일·주간 (FQ MONTHLY + ST DAILY)
  { id: 601, storyQuestId: 6, order: 1, type: 'FAN_QUEST',
    titleKO: '월간 V01D 라이브 시청 인증', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/601.jpg',
    rewardEntryTicket: 5, rewardFanPoint: 100, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: true, inProgressMembers: 1860, completedMembers: 1240,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 10, repeatCycle: 'MONTHLY' },
  { id: 602, storyQuestId: 6, order: 2, type: 'SURVIVAL_TRIVIA',
    titleKO: '일일 V01D 트리비아 5회 정답',
    titleEN: 'Daily V01D Trivia — 5 Correct',
    titleJA: 'デイリーV01Dトリビア5回正解',
    imageUrl: '/sq/ep/602.jpg',
    rewardEntryTicket: 3, rewardFanPoint: 50, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: true, inProgressMembers: 1240, completedMembers: 820,
    completedType: 'TRIVIA_CORRECT_COUNT', completedValue: 5, sourceRefName: 'ST #12 데뷔곡 가사 퀴즈', repeatCycle: 'DAILY' },

  // ── Story 7: V01D CLOSED — 1주년 축하 (FQ + PM + ST)
  { id: 701, storyQuestId: 7, order: 1, type: 'FAN_QUEST',
    titleKO: '데뷔 1주년 축하 메시지 SNS 인증', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/701.jpg',
    rewardEntryTicket: 8, rewardFanPoint: 150, biveRewardYn: true, mintingEventId: 27, mintingEventName: 'V01D 100 Days',
    repeat: false, inProgressMembers: 2840, completedMembers: 2810,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 1 },
  { id: 702, storyQuestId: 7, order: 2, type: 'PREDICTION_MARKET',
    titleKO: '1주년 기념 행사 참여수 예측',
    titleEN: 'Predict 1st Anniversary Event Attendance',
    titleJA: '1周年記念イベント参加者数予測',
    imageUrl: '/sq/ep/702.jpg',
    rewardEntryTicket: 10, rewardFanPoint: 200, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 2510, completedMembers: 2380,
    completedType: 'PM_PARTICIPATION', sourceRefName: 'PM #34 — 1주년 행사 참여수' },
  { id: 703, storyQuestId: 7, order: 3, type: 'SURVIVAL_TRIVIA',
    titleKO: '1주년 추억 트리비아 7회 정답',
    titleEN: '1st Anniversary Memory Trivia — 7 Correct',
    titleJA: '1周年思い出トリビア7回正解',
    imageUrl: '/sq/ep/703.jpg',
    rewardEntryTicket: 8, rewardFanPoint: 150, biveRewardYn: true, mintingEventId: 24, mintingEventName: 'V01D Trivia Master',
    repeat: false, inProgressMembers: 2310, completedMembers: 2180,
    completedType: 'TRIVIA_CORRECT_COUNT', completedValue: 7, sourceRefName: 'ST #12 데뷔곡 가사 퀴즈' },

  // ── Story 8: V01D CLOSED — 1주년 추억 트리비아 단독 에피소드 (ST)
  { id: 801, storyQuestId: 8, order: 1, type: 'SURVIVAL_TRIVIA',
    titleKO: '1주년 종합 트리비아 10회 정답',
    titleEN: '1st Anniversary Comprehensive Trivia — 10 Correct',
    titleJA: '1周年総合トリビア10回正解',
    imageUrl: '/sq/ep/801.jpg',
    rewardEntryTicket: 12, rewardFanPoint: 250, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 2510, completedMembers: 2380,
    completedType: 'TRIVIA_CORRECT_COUNT', completedValue: 10, sourceRefName: 'ST #13 멤버 MBTI 퀴즈' },

  // ── Story 9: V01D CLOSED — 1주년 행사 (FQ + ST)
  { id: 901, storyQuestId: 9, order: 1, type: 'FAN_QUEST',
    titleKO: '1주년 오프라인 행사 참여 인증', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/901.jpg',
    rewardEntryTicket: 10, rewardFanPoint: 200, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 2200, completedMembers: 2080,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 2 },
  { id: 902, storyQuestId: 9, order: 2, type: 'SURVIVAL_TRIVIA',
    titleKO: '행사 무대 셋리스트 트리비아',
    titleEN: 'Event Stage Setlist Trivia',
    titleJA: 'イベントステージセットリストトリビア',
    imageUrl: '/sq/ep/902.jpg',
    rewardEntryTicket: 8, rewardFanPoint: 150, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 2050, completedMembers: 1920,
    completedType: 'TRIVIA_PARTICIPATION', sourceRefName: 'ST #12 데뷔곡 가사 퀴즈' },

  // ── Story 10: V01D CLOSED — 새해 응원 (FQ)
  { id: 1001, storyQuestId: 10, order: 1, type: 'FAN_QUEST',
    titleKO: '새해 응원 SNS 포스팅 인증', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/1001.jpg',
    rewardEntryTicket: 6, rewardFanPoint: 120, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 1890, completedMembers: 1720,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 3 },

  // ── Story 11: V01D CLOSED 반복 — 월간 인증 (FQ MONTHLY)
  { id: 1101, storyQuestId: 11, order: 1, type: 'FAN_QUEST',
    titleKO: '월간 V01D 활동 정리 인증 (종료)', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/1101.jpg',
    rewardEntryTicket: 5, rewardFanPoint: 100, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: true, inProgressMembers: 1640, completedMembers: 1480,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 5, repeatCycle: 'MONTHLY' },

  // ── Story 12: V01D DRAFT — 컴백 티저 (FQ + PM + ST)
  { id: 1201, storyQuestId: 12, order: 1, type: 'FAN_QUEST',
    titleKO: '컴백 티저 영상 시청 인증 (작성 중)', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/1201.jpg',
    rewardEntryTicket: 5, rewardFanPoint: 100, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 0, completedMembers: 0,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 4 },
  { id: 1202, storyQuestId: 12, order: 2, type: 'PREDICTION_MARKET',
    titleKO: '컴백곡 차트 진입 순위 예측',
    titleEN: 'Predict Comeback Song Chart Entry Rank',
    titleJA: 'カムバック曲チャートイン順位予測',
    imageUrl: '/sq/ep/1202.jpg',
    rewardEntryTicket: 10, rewardFanPoint: 200, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 0, completedMembers: 0,
    completedType: 'PM_PARTICIPATION', sourceRefName: 'PM #34 — 다음 컴백 시점' },
  { id: 1203, storyQuestId: 12, order: 3, type: 'SURVIVAL_TRIVIA',
    titleKO: '컴백곡 티저 영상 트리비아 5회 정답',
    titleEN: 'Comeback Teaser Trivia — 5 Correct',
    titleJA: 'カムバックティザートリビア5回正解',
    imageUrl: '/sq/ep/1203.jpg',
    rewardEntryTicket: 8, rewardFanPoint: 150, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 0, completedMembers: 0,
    completedType: 'TRIVIA_CORRECT_COUNT', completedValue: 5, sourceRefName: 'ST #12 데뷔곡 가사 퀴즈' },

  // ── Story 13: V01D DRAFT — 차트 진입 예측 (PM)
  { id: 1301, storyQuestId: 13, order: 1, type: 'PREDICTION_MARKET',
    titleKO: '데뷔곡 차트 진입 순위 예측 (작성 중)',
    titleEN: 'Debut Song Chart Entry Rank Prediction (Draft)',
    titleJA: 'デビュー曲チャートイン順位予測(作成中)',
    imageUrl: '/sq/ep/1301.jpg',
    rewardEntryTicket: 12, rewardFanPoint: 250, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 0, completedMembers: 0,
    completedType: 'PM_CORRECT', sourceRefName: 'PM #35 신규 멤버 발표 시점' },

  // ── Story 14: V01D DRAFT 반복 — 가을 주간 (FQ WEEKLY)
  { id: 1401, storyQuestId: 14, order: 1, type: 'FAN_QUEST',
    titleKO: '주간 가을 시즌 인증 (작성 중)', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/1401.jpg',
    rewardEntryTicket: 5, rewardFanPoint: 100, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: true, inProgressMembers: 0, completedMembers: 0,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 10, repeatCycle: 'WEEKLY' },

  // ── Story 15: iKON ACTIVE — 10주년 시작 (FQ + PM + ST)
  { id: 1501, storyQuestId: 15, order: 1, type: 'FAN_QUEST',
    titleKO: '멤버 메시지 영상 시청 인증', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/1501.jpg',
    rewardEntryTicket: 6, rewardFanPoint: 120, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 950, completedMembers: 720,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 6 },
  { id: 1502, storyQuestId: 15, order: 2, type: 'PREDICTION_MARKET',
    titleKO: 'iKON 컴백 앨범 1위 예측',
    titleEN: 'Predict iKON Comeback Album #1',
    titleJA: 'iKONカムバックアルバム1位予測',
    imageUrl: '/sq/ep/1502.jpg',
    rewardEntryTicket: 10, rewardFanPoint: 200, biveRewardYn: true, mintingEventId: 26, mintingEventName: 'V01D Prophet',
    repeat: false, inProgressMembers: 780, completedMembers: 540,
    completedType: 'PM_CORRECT', sourceRefName: 'PM #36 iKON 컴백 앨범 1위 차트인' },
  { id: 1503, storyQuestId: 15, order: 3, type: 'SURVIVAL_TRIVIA',
    titleKO: 'iKON 디스코그래피 마스터 트리비아',
    titleEN: 'iKON Discography Master Trivia',
    titleJA: 'iKONディスコグラフィーマスタートリビア',
    imageUrl: '/sq/ep/1503.jpg',
    rewardEntryTicket: 9, rewardFanPoint: 180, biveRewardYn: true, mintingEventId: 24, mintingEventName: 'V01D Trivia Master',
    repeat: false, inProgressMembers: 640, completedMembers: 420,
    completedType: 'TRIVIA_PARTICIPATION', sourceRefName: 'ST #14 iKON 디스코그래피 마스터 퀴즈' },

  // ── Story 16: iKON ACTIVE — 글로벌 투어 도시 (FQ + PM)
  { id: 1601, storyQuestId: 16, order: 1, type: 'FAN_QUEST',
    titleKO: '#iKON_TOUR 해시태그 포스팅 인증', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/1601.jpg',
    rewardEntryTicket: 7, rewardFanPoint: 130, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 780, completedMembers: 510,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 8 },
  { id: 1602, storyQuestId: 16, order: 2, type: 'PREDICTION_MARKET',
    titleKO: '다음 발표 투어 도시 예측',
    titleEN: 'Predict Next Announced Tour City',
    titleJA: '次に発表されるツアー都市予測',
    imageUrl: '/sq/ep/1602.jpg',
    rewardEntryTicket: 10, rewardFanPoint: 200, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 620, completedMembers: 380,
    completedType: 'PM_PARTICIPATION', sourceRefName: 'PM #36 iKON 컴백 앨범 1위 차트인' },

  // ── Story 17: iKON ACTIVE — 굿즈 사전 예약 (FQ)
  { id: 1701, storyQuestId: 17, order: 1, type: 'FAN_QUEST',
    titleKO: '투어 굿즈 사전 예약 인증샷', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/1701.jpg',
    rewardEntryTicket: 8, rewardFanPoint: 150, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 540, completedMembers: 280,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 7 },

  // ── Story 18: iKON ACTIVE — 투어 후기 (FQ)
  { id: 1801, storyQuestId: 18, order: 1, type: 'FAN_QUEST',
    titleKO: '직관 후기 SNS 공유 인증', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/1801.jpg',
    rewardEntryTicket: 15, rewardFanPoint: 300, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 320, completedMembers: 140,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 9 },

  // ── Story 19: iKON ACTIVE 반복 — 주간 PM (PM WEEKLY)
  { id: 1901, storyQuestId: 19, order: 1, type: 'PREDICTION_MARKET',
    titleKO: '주간 iKON 활동 예측 마라톤',
    titleEN: 'Weekly iKON Activity Prediction Marathon',
    titleJA: 'ウィークリーiKON活動予測マラソン',
    imageUrl: '/sq/ep/1901.jpg',
    rewardEntryTicket: 8, rewardFanPoint: 150, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: true, inProgressMembers: 680, completedMembers: 410,
    completedType: 'PM_PARTICIPATION', sourceRefName: 'PM #36 iKON 컴백 앨범 1위 차트인', repeatCycle: 'WEEKLY' },

  // ── Story 20: iKON CLOSED — KCON 무대 (FQ + PM + ST)
  { id: 2001, storyQuestId: 20, order: 1, type: 'FAN_QUEST',
    titleKO: 'KCON 2025 무대 관람 인증', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/2001.jpg',
    rewardEntryTicket: 10, rewardFanPoint: 200, biveRewardYn: true, mintingEventId: 24, mintingEventName: 'V01D Trivia Master',
    repeat: false, inProgressMembers: 1520, completedMembers: 1480,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 6 },
  { id: 2002, storyQuestId: 20, order: 2, type: 'PREDICTION_MARKET',
    titleKO: '최애 무대 1위 예측',
    titleEN: 'Predict Favorite Stage #1',
    titleJA: '最推しステージ1位予測',
    imageUrl: '/sq/ep/2002.jpg',
    rewardEntryTicket: 8, rewardFanPoint: 150, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 1380, completedMembers: 1320,
    completedType: 'PM_CORRECT', sourceRefName: 'PM #36 iKON 컴백 앨범 1위 차트인' },
  { id: 2003, storyQuestId: 20, order: 3, type: 'SURVIVAL_TRIVIA',
    titleKO: 'KCON 2025 무대 트리비아',
    titleEN: 'KCON 2025 Stage Trivia',
    titleJA: 'KCON 2025 ステージトリビア',
    imageUrl: '/sq/ep/2003.jpg',
    rewardEntryTicket: 8, rewardFanPoint: 150, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 1280, completedMembers: 1180,
    completedType: 'TRIVIA_PARTICIPATION', sourceRefName: 'ST #14 iKON 디스코그래피 마스터 퀴즈' },

  // ── Story 21: iKON CLOSED — KCON 굿즈 (FQ)
  { id: 2101, storyQuestId: 21, order: 1, type: 'FAN_QUEST',
    titleKO: 'KCON 공식 굿즈 구매 인증', titleEN: '', titleJA: '',
    imageUrl: '/sq/ep/2101.jpg',
    rewardEntryTicket: 6, rewardFanPoint: 120, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 1280, completedMembers: 1180,
    completedType: 'ADMIN_APPROVAL', fanQuestId: 7 },

  // ── Story 22: iKON CLOSED — 추억 트리비아 (ST)
  { id: 2201, storyQuestId: 22, order: 1, type: 'SURVIVAL_TRIVIA',
    titleKO: 'KCON 2025 종합 추억 트리비아 10회 정답',
    titleEN: 'KCON 2025 Memory Trivia — 10 Correct',
    titleJA: 'KCON 2025 思い出トリビア10回正解',
    imageUrl: '/sq/ep/2201.jpg',
    rewardEntryTicket: 10, rewardFanPoint: 200, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 1120, completedMembers: 980,
    completedType: 'TRIVIA_CORRECT_COUNT', completedValue: 10, sourceRefName: 'ST #14 iKON 디스코그래피 마스터 퀴즈' },

  // ── Story 23: CELEBUS DRAFT — 운영진 OX 퀴즈 (PM + ST)
  { id: 2301, storyQuestId: 23, order: 1, type: 'PREDICTION_MARKET',
    titleKO: '플랫폼 다음 캠페인 주제 예측 (작성 중)',
    titleEN: "Predict Platform's Next Campaign Topic (Draft)",
    titleJA: 'プラットフォーム次のキャンペーンテーマ予測(作成中)',
    imageUrl: '/sq/ep/2301.jpg',
    rewardEntryTicket: 5, rewardFanPoint: 100, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 0, completedMembers: 0,
    completedType: 'PM_PARTICIPATION', sourceRefName: 'PM #37 CELEBUS 1주년 다음 캠페인 주제' },
  { id: 2302, storyQuestId: 23, order: 2, type: 'SURVIVAL_TRIVIA',
    titleKO: 'CELEBUS 운영진 OX 퀴즈 5회 정답',
    titleEN: 'CELEBUS Staff OX Quiz — 5 Correct',
    titleJA: 'CELEBUS運営陣OXクイズ5回正解',
    imageUrl: '/sq/ep/2302.jpg',
    rewardEntryTicket: 5, rewardFanPoint: 100, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 0, completedMembers: 0,
    completedType: 'TRIVIA_CORRECT_COUNT', completedValue: 5, sourceRefName: 'ST #15 CELEBUS 운영진 OX 퀴즈' },

  // ── Story 24: CELEBUS DRAFT — 응원 메시지 (ST)
  { id: 2401, storyQuestId: 24, order: 1, type: 'SURVIVAL_TRIVIA',
    titleKO: 'CELEBUS 1주년 추억 트리비아 (작성 중)',
    titleEN: 'CELEBUS 1st Anniversary Memory Trivia (Draft)',
    titleJA: 'CELEBUS 1周年思い出トリビア(作成中)',
    imageUrl: '/sq/ep/2401.jpg',
    rewardEntryTicket: 5, rewardFanPoint: 100, biveRewardYn: false, mintingEventId: null, mintingEventName: null,
    repeat: false, inProgressMembers: 0, completedMembers: 0,
    completedType: 'TRIVIA_PARTICIPATION', sourceRefName: 'ST #15 CELEBUS 운영진 OX 퀴즈' },
];

// ============================================================
// 헬퍼 함수 — v2.3에서 시그니처 유지 (화면 코드 의존성 보호)
// ============================================================

export function getStoryQuestById(id: number): StoryQuest | undefined {
  return storyQuests.find((s) => s.id === id);
}

export function getGroupById(id: number): EpisodeGroup | undefined {
  return episodeGroups.find((g) => g.id === id);
}

export function getEpisodesByGroupId(groupId: number): StoryQuest[] {
  return storyQuests
    .filter((s) => s.groupId === groupId)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

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

export function getEpisodesByStoryId(storyId: number): StoryEpisode[] {
  return storyEpisodes
    .filter((e) => e.storyQuestId === storyId)
    .sort((a, b) => a.order - b.order);
}

export function getEpisodeById(epId: number): StoryEpisode | undefined {
  return storyEpisodes.find((e) => e.id === epId);
}

/**
 * SQ 미션 추가 화면에서 사용 — 이미 다른 미션에 묶여 있는 fanquest는 드롭다운에서 제외해야 함.
 * @returns 현재 묶인 fanQuestId 집합
 */
export function getAssignedFanQuestIds(): Set<number> {
  return new Set(
    storyEpisodes
      .filter((e) => e.type === 'FAN_QUEST' && e.fanQuestId != null)
      .map((e) => e.fanQuestId!),
  );
}

export const storyStats = {
  total: storyQuests.length,
  draft: storyQuests.filter((s) => s.status === 'DRAFT').length,
  active: storyQuests.filter((s) => s.status === 'ACTIVE').length,
  closed: storyQuests.filter((s) => s.status === 'CLOSED').length,
  totalPendingReview: storyQuests.reduce((s, q) => s + q.pendingReview, 0),
};

// ============================================================
// 미션 추가 화면용 — 외부 콘텐츠(FanQuest / PM / ST) 참조 리스트
// 에피소드 그룹의 아티스트로 필터링하여 사용
// ============================================================

export interface ExternalContent {
  id: number;
  title: string;
  artistGroup: ArtistGroup;
  status: '진행중' | '예정' | '종료';
  repeat: boolean;
}

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

const PREDICTION_MARKETS: ExternalContent[] = [
  { id: 34, title: 'V01D 다음 컴백 시점 예측', artistGroup: 'V01D', status: '진행중', repeat: false },
  { id: 35, title: 'V01D 신규 멤버 발표 시점 예측', artistGroup: 'V01D', status: '예정', repeat: false },
  { id: 36, title: 'iKON 컴백 앨범 1위 차트인 예측', artistGroup: 'iKON', status: '진행중', repeat: false },
  { id: 37, title: 'CELEBUS 1주년 다음 캠페인 주제', artistGroup: 'CELEBUS', status: '예정', repeat: false },
];

const SURVIVAL_TRIVIA: ExternalContent[] = [
  { id: 12, title: 'V01D 데뷔곡 가사 퀴즈', artistGroup: 'V01D', status: '진행중', repeat: false },
  { id: 13, title: 'V01D 멤버 MBTI 퀴즈', artistGroup: 'V01D', status: '예정', repeat: false },
  { id: 14, title: 'iKON 디스코그래피 마스터 퀴즈', artistGroup: 'iKON', status: '진행중', repeat: false },
  { id: 15, title: 'CELEBUS 운영진 OX 퀴즈', artistGroup: 'CELEBUS', status: '진행중', repeat: false },
];

export function getFanQuestsByArtist(artist: ArtistGroup): ExternalContent[] {
  return FAN_QUESTS.filter((q) => q.artistGroup === artist);
}

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
