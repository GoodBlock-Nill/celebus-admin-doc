// 운영 /fanquest mock — 운영 SSOT 기준 + 일반/반복·덕력 보상 도입
// 참고: v2/BO/FQ/[CEB-BO-FQ-FLOW] 팬퀘스트(Quest) 플로우 및 로직.md
//      v2/APP/[CEB-DUK-101] 덕력 랭킹 (단위: DUK)

import {
  storyQuests,
  episodeGroups,
  getEpisodesByStoryId,
  type StoryQuestStatus,
  type EpisodeGroupStatus,
  type EpisodeKind,
} from './sq';

export type QuestStatus = '진행중' | '임시저장' | '종료';
export type SubmissionStatus = '대기' | '승인' | '반려';
export type QuestKind = '일반' | '반복';
export type RepeatCycle = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export const REPEAT_CYCLE_LABEL: Record<RepeatCycle, string> = {
  DAILY: '일간',
  WEEKLY: '주간',
  MONTHLY: '월간',
};

export interface NftEvent {
  id: number;
  name: string;
}

export interface RewardConfig {
  ticket: { enabled: boolean; count: number };
  duk: { enabled: boolean; amount: number };
  nft: { enabled: boolean; event?: NftEvent };
}

export const EMPTY_REWARD: RewardConfig = {
  ticket: { enabled: false, count: 1 },
  duk: { enabled: false, amount: 50 },
  nft: { enabled: false },
};

export interface Quest {
  id: number;
  status: QuestStatus;
  title: string;
  artist: string;
  period: string;
  reviewNeeded: number;
  /** 대기 중인 제출 건수 — 검수 대기 대시보드에서 사용 (Quest 상세의 pendingCount와 동기) */
  pendingCount: number;
  kind: QuestKind;
  repeatCycle?: RepeatCycle;
  reward: RewardConfig;
}

export interface RelatedLink {
  labelKO: string;
  labelEN: string;
  labelJA: string;
  href: string;
}

export interface QuestDetail extends Quest {
  imageSrc: string;
  questType: string;
  startAt: string;
  endAt: string;
  endDate: string;
  endTime: string;
  relatedLinks: RelatedLink[];
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  titleKO: string;
  titleEN: string;
  titleJA: string;
  descKO: string;
  descEN: string;
  descJA: string;
  guideKO: string;
  guideEN: string;
  guideJA: string;
  totalSubmitted: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
}

export interface QuestSubmission {
  id: number;
  questId: number;
  status: SubmissionStatus;
  submitId: number;
  userId: number;
  nickname: string;
  rejectReason?: string;
  rejectReasonId?: number;
  imageSrc?: string;
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
}

export interface RejectionReason {
  id: number;
  status: 'Active' | 'Inactive';
  displayName: string;
  userMessageKO: string;
  userMessageEN: string;
  userMessageJA: string;
}

// ────────────────────────────────────────────────
// 보상 노출 헬퍼 — 활성 보상만 `·`로 합성
// ────────────────────────────────────────────────

export function formatReward(reward: RewardConfig): string {
  const parts: string[] = [];
  if (reward.ticket.enabled) parts.push(`응모권 ${reward.ticket.count}장`);
  if (reward.duk.enabled) parts.push(`덕력 ${reward.duk.amount} DUK`);
  if (reward.nft.enabled) {
    parts.push(reward.nft.event ? `NFT (${reward.nft.event.name})` : 'NFT');
  }
  return parts.length === 0 ? '-' : parts.join(' · ');
}

export function hasAnyReward(reward: RewardConfig): boolean {
  return reward.ticket.enabled || reward.duk.enabled || reward.nft.enabled;
}

export function formatQuestKind(kind: QuestKind, cycle?: RepeatCycle): string {
  if (kind === '일반') return '일반';
  return cycle ? `반복 (${REPEAT_CYCLE_LABEL[cycle]})` : '반복';
}

// ────────────────────────────────────────────────
// 리스트 mock — 12건 (진행중 10 + 임시저장 1 + 종료 1)
// 일반/반복·덕력 보상 도입 매핑
// ────────────────────────────────────────────────

const NFT_GUESS_JOURNEY: NftEvent = { id: 23, name: "V01D 'GUESS JOURNEY #01 SETLIST' 이벤트 참여 인증 🎧" };
const NFT_RAFFLE_INSTA: NftEvent = { id: 24, name: 'V01D 콘서트 래플 인스타' };
const NFT_RAFFLE_X: NftEvent = { id: 25, name: 'V01D 콘서트 래플 X' };
const NFT_YUCHAN_FOLLOW: NftEvent = { id: 12, name: 'V01D 송유찬 인스타 팔로우' };

export const quests: Quest[] = [
  {
    id: 1, status: '진행중', title: "V01D 'GUESS JOURNEY #01 SETLIST' 이벤트 참여 인증 🎤",
    artist: 'V01D', period: '2026.05.04 ~ 2026.05.14', reviewNeeded: 7, pendingCount: 2,
    kind: '일반',
    reward: { ticket: { enabled: true, count: 5 }, duk: { enabled: false, amount: 0 }, nft: { enabled: true, event: NFT_GUESS_JOURNEY } },
  },
  {
    id: 2, status: '진행중', title: "인스타에서 V01D 'journey #01' 응원하기 💜",
    artist: 'V01D', period: '2026.05.04 ~ 2026.05.14', reviewNeeded: 4, pendingCount: 4,
    kind: '반복', repeatCycle: 'WEEKLY',
    reward: { ticket: { enabled: true, count: 3 }, duk: { enabled: true, amount: 50 }, nft: { enabled: false } },
  },
  {
    id: 3, status: '진행중', title: "X에서 V01D 'journey #01' 응원하기 💜",
    artist: 'V01D', period: '2026.05.04 ~ 2026.05.14', reviewNeeded: 3, pendingCount: 3,
    kind: '반복', repeatCycle: 'WEEKLY',
    reward: { ticket: { enabled: true, count: 3 }, duk: { enabled: false, amount: 0 }, nft: { enabled: false } },
  },
  {
    id: 4, status: '진행중', title: "인스타에 V01D 'journey #01' 콘서트 래플 소개하기 🎫",
    artist: 'V01D', period: '2026.05.04 ~ 2026.05.14', reviewNeeded: 3, pendingCount: 1,
    kind: '일반',
    reward: { ticket: { enabled: true, count: 2 }, duk: { enabled: false, amount: 0 }, nft: { enabled: true, event: NFT_RAFFLE_INSTA } },
  },
  {
    id: 5, status: '진행중', title: "X에 V01D 'journey #01' 콘서트 래플 소개하기 🎫",
    artist: 'V01D', period: '2026.05.04 ~ 2026.05.14', reviewNeeded: 3, pendingCount: 0,
    kind: '일반',
    reward: { ticket: { enabled: true, count: 2 }, duk: { enabled: false, amount: 0 }, nft: { enabled: false } },
  },
  {
    id: 6, status: '진행중', title: 'iKON 최애곡 스트리밍 인증',
    artist: 'iKON', period: '2026.04.24 ~ 2026.05.14', reviewNeeded: 1, pendingCount: 5,
    kind: '반복', repeatCycle: 'DAILY',
    reward: { ticket: { enabled: false, count: 0 }, duk: { enabled: true, amount: 30 }, nft: { enabled: false } },
  },
  {
    id: 7, status: '진행중', title: 'iKON 콘서트 위시리스트 TOP 5',
    artist: 'iKON', period: '2026.04.24 ~ 2026.05.14', reviewNeeded: 2, pendingCount: 2,
    kind: '일반',
    reward: { ticket: { enabled: true, count: 1 }, duk: { enabled: true, amount: 100 }, nft: { enabled: false } },
  },
  {
    id: 8, status: '진행중', title: '#iKON_CELEBUS 해시태그 포스팅',
    artist: 'iKON', period: '2026.04.24 ~ 2026.05.14', reviewNeeded: 1, pendingCount: 0,
    kind: '반복', repeatCycle: 'WEEKLY',
    reward: { ticket: { enabled: true, count: 1 }, duk: { enabled: false, amount: 0 }, nft: { enabled: false } },
  },
  {
    id: 9, status: '진행중', title: 'iKON 공식 SNS 팔로우 인증',
    artist: 'iKON', period: '2026.04.24 ~ 2026.05.14', reviewNeeded: 1, pendingCount: 1,
    kind: '반복', repeatCycle: 'MONTHLY',
    reward: { ticket: { enabled: true, count: 3 }, duk: { enabled: true, amount: 200 }, nft: { enabled: true, event: NFT_RAFFLE_X } },
  },
  {
    id: 10, status: '진행중', title: 'V01D TikTok 팔로우 또는 YouTube 구독 인증 📲',
    artist: 'V01D', period: '2026.04.27 ~ 2026.12.31', reviewNeeded: 1, pendingCount: 0,
    kind: '반복', repeatCycle: 'DAILY',
    reward: { ticket: { enabled: true, count: 2 }, duk: { enabled: false, amount: 0 }, nft: { enabled: false } },
  },
  {
    id: 11, status: '임시저장', title: 'V01D 신곡 발매 기념 SNS 공유 (작성 중)',
    artist: 'V01D', period: '-', reviewNeeded: 0, pendingCount: 0,
    kind: '일반',
    reward: { ticket: { enabled: true, count: 3 }, duk: { enabled: false, amount: 0 }, nft: { enabled: false } },
  },
  {
    id: 12, status: '종료', title: '송유찬 인스타그램 팔로우 인증',
    artist: 'V01D', period: '2026.02.19 ~ 2026.03.31', reviewNeeded: 0, pendingCount: 0,
    kind: '일반',
    reward: { ticket: { enabled: true, count: 1 }, duk: { enabled: false, amount: 0 }, nft: { enabled: true, event: NFT_YUCHAN_FOLLOW } },
  },
];

// ────────────────────────────────────────────────
// 상세 mock — id 1, 11, 12 풀 detail. 나머지는 fallback 합성
// ────────────────────────────────────────────────

const baseGuide = (kind: 'event' | 'follow' = 'event') => kind === 'event' ? {
  guideKO: `1. @V01D_iX에서 'GUESS JOURNEY #01 SETLIST' 퀴즈 이미지를 확인하세요
2. 본인 SNS(X 또는 인스타그램)에 퀴즈 이미지 + 본인 정답을 함께 업로드하세요
3. 게시물에 포함할 항목:
   • 해시태그 #V01D #보이드 #journey #CELEBUS (4종)
   • 계정 태그 @V01D_iX
4. 게시 후 캡처해서 본 퀘스트로 제출

⚠️ 단순 좋아요·RT는 불인정. 본인 SNS에 퀴즈 이미지 + 정답을 직접 업로드해야 합니다.`,
  guideEN: `1. Find the 'GUESS JOURNEY #01 SETLIST' quiz image on @V01D_iX
2. Post the quiz image + your answers on your own SNS (X or Instagram)
3. Include in your post:
   • Hashtags #V01D #보이드 #journey #CELEBUS (4 total)
   • Account tag @V01D_iX
4. Screenshot your post and submit here

⚠️ Likes/RTs alone NOT accepted. Upload the quiz image + your answers to your own SNS post.`,
  guideJA: `1. @V01D_iXで「GUESS JOURNEY #01 SETLIST」クイズ画像を確認
2. ご自身のSNS(XまたはInstagram)にクイズ画像 + ご自身の回答をアップロード
3. 投稿に含めるもの:
   • ハッシュタグ #V01D #보이드 #journey #CELEBUS (4つ)
   • アカウントタグ @V01D_iX
4. 投稿をキャプチャして本クエストに提出

⚠️ いいね・RTのみでは認められません。ご自身のSNSにクイズ画像 + 回答を直接アップロードしてください。`,
} : {
  guideKO: `1. 송유찬 인스타그램(@uchanzzz)을 팔로우해 주세요.
2. 팔로우 완료 후 프로필 화면을 캡처해 주세요.
3. 캡처 화면에 '팔로잉' 버튼이 보여야 합니다.
4. 본인 계정의 캡처 화면만 인정됩니다.`,
  guideEN: `1. Follow Yuchan's Instagram (@uchanzzz).
2. Capture the profile screen after following.
3. The 'Following' button must be visible in the screenshot.
4. Only screenshots from your own account will be accepted.`,
  guideJA: `1. ユチャンのインスタグラム(@uchanzzz)をフォローしてください。
2. フォロー完了後、プロフィール画面をキャプチャしてください。
3. キャプチャ画面に「フォロー中」ボタンが見える必要があります。
4. ご本人のアカウントのキャプチャのみ認められます。`,
};

export const questDetail1: QuestDetail = {
  ...quests[0],
  imageSrc: '',
  questType: '이미지 촬영 및 업로드',
  startAt: '2026.05.04 15:49',
  endAt: '2026.05.14 23:59',
  endDate: '2026-05-14',
  endTime: '23:59',
  relatedLinks: [
    { labelKO: '@V01D_iX', labelEN: '@V01D_iX', labelJA: '@V01D_iX', href: 'https://x.com/V01D_iX/status/2051152210780880941' },
    { labelKO: 'Google Form', labelEN: 'Google Form', labelJA: 'Google Form', href: 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSeCd-gOSeYLeCXFMUbeZcBU9CCDmckD9CgG1UozMKF0PuC7CA/viewform' },
  ],
  createdBy: 'nill',
  createdAt: '2026.05.04 15:38',
  updatedBy: 'nill',
  updatedAt: '2026.05.04 15:49',
  titleKO: "V01D 'GUESS JOURNEY #01 SETLIST' 이벤트 참여 인증 🎤",
  titleEN: "V01D 'GUESS JOURNEY #01 SETLIST' Event Participation 🎤",
  titleJA: "V01D「GUESS JOURNEY #01 SETLIST」イベント参加認証 🎤",
  descKO: "V01D 공식 X(@V01D_iX)에서 진행 중인 'GUESS JOURNEY #01 SETLIST' 이벤트에 참여하고 본인 참여 게시물·인용·댓글을 캡처해서 제출해주세요! ※ 이 이벤트는 V01D 측 단독 이벤트이며 CELEBUS와 무관합니다. CELEBUS는 참여 인증만 받습니다.",
  descEN: "Participate in the 'GUESS JOURNEY #01 SETLIST' event hosted on V01D's official X (@V01D_iX) and submit a screenshot of your participation (quote tweet or comment). ※ This event is run independently by V01D and is unrelated to CELEBUS.",
  descJA: "V01D公式X(@V01D_iX)で開催中の「GUESS JOURNEY #01 SETLIST」イベントに参加して、本人の参加投稿・引用・댓글을 캡처해서 제출해주세요！※ このイベントはV01D側の単独イベントであり、CELEBUSとは無関係です。",
  ...baseGuide('event'),
  totalSubmitted: 50,
  approvedCount: 47,
  rejectedCount: 1,
  pendingCount: 2,
};

const questDetail11: QuestDetail = {
  ...quests[10],
  imageSrc: '',
  questType: '이미지 촬영 및 업로드',
  startAt: '-',
  endAt: '-',
  endDate: '',
  endTime: '23:59',
  relatedLinks: [],
  createdBy: 'nill',
  createdAt: '2026.05.10 14:00',
  updatedBy: 'nill',
  updatedAt: '2026.05.11 09:30',
  titleKO: 'V01D 신곡 발매 기념 SNS 공유 (작성 중)',
  titleEN: '',
  titleJA: '',
  descKO: 'V01D 신곡 발매를 SNS에 공유하고 인증해 주세요. (작성 중)',
  descEN: '',
  descJA: '',
  guideKO: '',
  guideEN: '',
  guideJA: '',
  totalSubmitted: 0,
  approvedCount: 0,
  rejectedCount: 0,
  pendingCount: 0,
};

const questDetail12: QuestDetail = {
  ...quests[11],
  imageSrc: '',
  questType: '이미지 촬영 및 업로드',
  startAt: '2026.02.19 15:09',
  endAt: '2026.03.31 14:29',
  endDate: '2026-03-31',
  endTime: '14:29',
  relatedLinks: [],
  createdBy: 'nill',
  createdAt: '2026.02.19 15:08',
  updatedBy: 'nill',
  updatedAt: '2026.03.31 14:29',
  titleKO: '송유찬 인스타그램 팔로우 인증',
  titleEN: 'Yuchan Instagram Follow Certification',
  titleJA: 'ユチャン インスタグラムフォロー認証',
  descKO: '송유찬의 인스타그램을 팔로우하고 인증샷을 올려주세요! 팔로우 인증 시 응모권과 NFT를 드립니다.',
  descEN: "Follow Yuchan's Instagram and upload your proof! Get entry tickets and NFT when you certify your follow.",
  descJA: 'ユチャンのインスタグラムをフォローして認証ショットをアップ！フォロー認証で応募券とNFTがもらえます。',
  ...baseGuide('follow'),
  totalSubmitted: 312,
  approvedCount: 298,
  rejectedCount: 14,
  pendingCount: 0,
};

// ────────────────────────────────────────────────
// 제출 mock
// ────────────────────────────────────────────────

export const questSubmissions: QuestSubmission[] = [
  { id: 1, questId: 1, status: '대기', submitId: 5168, userId: 10599, nickname: 'sohyun', submittedAt: '2026.05.12 11:52' },
  { id: 2, questId: 1, status: '대기', submitId: 5169, userId: 10853, nickname: 'mina', submittedAt: '2026.05.12 12:18' },
  { id: 3, questId: 1, status: '승인', submitId: 5144, userId: 10401, nickname: 'ji_eun', submittedAt: '2026.05.12 01:10', processedAt: '2026.05.12 09:49', processedBy: 'carl' },
  { id: 4, questId: 1, status: '승인', submitId: 5113, userId: 10322, nickname: 'saimyou', submittedAt: '2026.05.11 21:48', processedAt: '2026.05.12 09:49', processedBy: 'carl' },
  { id: 5, questId: 1, status: '승인', submitId: 5028, userId: 10218, nickname: 'sssssouffleeeee', submittedAt: '2026.05.11 16:58', processedAt: '2026.05.11 17:34', processedBy: 'carl' },
  { id: 6, questId: 1, status: '승인', submitId: 4971, userId: 10144, nickname: 'hanneee', submittedAt: '2026.05.11 03:57', processedAt: '2026.05.11 08:32', processedBy: 'nill' },
  { id: 7, questId: 1, status: '승인', submitId: 4909, userId: 10089, nickname: 'sususususu01222', submittedAt: '2026.05.10 15:14', processedAt: '2026.05.10 18:17', processedBy: 'nill' },
  { id: 8, questId: 1, status: '승인', submitId: 4901, userId: 10067, nickname: 'taev2on', submittedAt: '2026.05.10 12:11', processedAt: '2026.05.10 18:17', processedBy: 'nill' },
  { id: 9, questId: 1, status: '승인', submitId: 4827, userId: 9988, nickname: 'asdel', submittedAt: '2026.05.09 08:00', processedAt: '2026.05.09 21:33', processedBy: 'nill' },
  { id: 10, questId: 1, status: '반려', submitId: 4826, userId: 9985, nickname: 'ajin', rejectReason: '이미지 품질 불량', rejectReasonId: 3, submittedAt: '2026.05.09 07:31', processedAt: '2026.05.09 21:33', processedBy: 'nill' },
  { id: 11, questId: 1, status: '승인', submitId: 4822, userId: 9970, nickname: 'lajkdream', submittedAt: '2026.05.09 02:30', processedAt: '2026.05.09 21:33', processedBy: 'nill' },
  { id: 12, questId: 1, status: '승인', submitId: 4817, userId: 9955, nickname: 'numwanjush', submittedAt: '2026.05.09 01:42', processedAt: '2026.05.09 21:33', processedBy: 'nill' },
];

// ────────────────────────────────────────────────
// 반려사유 마스터
// ────────────────────────────────────────────────

export const rejectionReasons: RejectionReason[] = [
  {
    id: 1,
    status: 'Active',
    displayName: '촬영 조건 미달',
    userMessageKO: '제출하신 이미지가 Quest에서 요구하는 촬영 조건을 충족하지 않습니다. 가이드를 확인 후 다시 참여해 주세요.',
    userMessageEN: 'Your submission does not meet the photo requirements for this Quest. Please review the guide and try again.',
    userMessageJA: 'ご提出いただいた画像が、Questで要求されている撮影条件を満たしていません。ガイドをご確認の上、再度ご参加ください。',
  },
  {
    id: 2,
    status: 'Active',
    displayName: '부적절한 콘텐츠',
    userMessageKO: '제출하신 이미지에 부적절한 콘텐츠가 포함되어 있습니다. 가이드라인을 확인 후 다시 참여해 주세요.',
    userMessageEN: 'Your submission contains inappropriate content. Please review the guidelines and try again.',
    userMessageJA: 'ご提出いただいた画像に不適절한 コンテンツが含まれています。ガイドラインをご確認の上、再度ご参加ください。',
  },
  {
    id: 3,
    status: 'Active',
    displayName: '이미지 품질 불량',
    userMessageKO: '제출하신 이미지의 품질이 낮아 인증이 어렵습니다. 선명한 이미지로 다시 참여해 주세요.',
    userMessageEN: 'Your submitted image quality is too low to verify. Please resubmit with a clearer image.',
    userMessageJA: 'ご提出いただいた画像の品質が低く、認証が困難です。鮮明な画像で再度ご参加ください。',
  },
];

// ────────────────────────────────────────────────
// 조회 헬퍼
// ────────────────────────────────────────────────

const detailMap = new Map<number, QuestDetail>([
  [1, questDetail1],
  [11, questDetail11],
  [12, questDetail12],
]);

export function getQuestById(id: number): QuestDetail | undefined {
  const fromMap = detailMap.get(id);
  if (fromMap) return fromMap;
  const base = quests.find((q) => q.id === id);
  if (!base) return undefined;
  return { ...questDetail1, ...base };
}

export function getQuestSubmissions(questId: number, status?: SubmissionStatus | 'all'): QuestSubmission[] {
  return questSubmissions
    .filter((s) => s.questId === questId)
    .filter((s) => (status && status !== 'all' ? s.status === status : true));
}

export function getActiveRejectionReasons(): RejectionReason[] {
  return rejectionReasons.filter((r) => r.status === 'Active');
}

/**
 * 검수 대기 중인 제출이 있는 Quest 목록 (검토필요 내림차순).
 * 종료/임시저장 상태도 포함되지만 mock 상 모두 0이라 자연 제외됨.
 */
export function getQuestsWithPending(): Quest[] {
  return quests
    .filter((q) => q.pendingCount > 0)
    .sort((a, b) => b.pendingCount - a.pendingCount);
}

// ────────────────────────────────────────────────
// SQ ↔ FQ 역참조
// ────────────────────────────────────────────────

export interface FanQuestUsage {
  groupId: number;
  groupTitle: string;
  groupStatus: EpisodeGroupStatus;
  storyQuestId: number;
  storyQuestTitle: string;
  storyQuestStatus: StoryQuestStatus;
  episodeKind: EpisodeKind;
  chapterOrder: number;
  chapterTitleKO: string;
}

export function getFanQuestUsages(fanQuestId: number): FanQuestUsage[] {
  const result: FanQuestUsage[] = [];
  for (const story of storyQuests) {
    const chapters = getEpisodesByStoryId(story.id);
    for (const c of chapters) {
      if (c.type === 'FAN_QUEST' && c.fanQuestId === fanQuestId) {
        const group = episodeGroups.find((g) => g.id === story.groupId);
        if (!group) continue;
        result.push({
          groupId: group.id,
          groupTitle: group.titleKO,
          groupStatus: group.status,
          storyQuestId: story.id,
          storyQuestTitle: story.titleKO,
          storyQuestStatus: story.status,
          episodeKind: story.episodeKind,
          chapterOrder: c.order,
          chapterTitleKO: c.titleKO,
        });
      }
    }
  }
  return result;
}

// ============================================================
// Raffle (래플) — 운영 /fanquest?tab=raffle SSOT 기반 mock
// 상태 4종: 임시저장 → 진행중 → 추첨대기 → 종료
// 참고: v2/BO/FQ/[CEB-BO-FQ-102|204|205|206]*.md
// ============================================================

export type RaffleStatus = '임시저장' | '진행중' | '추첨대기' | '종료';
export type RaffleDeliveryType = '현장 수령' | '배송' | '온라인';
export type RafflePrizeUnit = '장' | '개';
export type WinnerStatus = '당첨' | '미당첨';

export interface RafflePickup {
  startDt: string;
  endDt: string;
  openTime: string;
  closeTime: string;
  locationKO: string;
  locationEN: string;
  locationJA: string;
  itemsKO: string;
  itemsEN: string;
  itemsJA: string;
}

export interface Raffle {
  id: number;
  status: RaffleStatus;
  artist: string;
  /** 운영 동일 — 종료시 리스트에서 "숨김" badge 노출 */
  hidden: boolean;
  startAt: string; // 게시 시점 자동 기록
  endAt: string;
  winnerCount: number;
  deliveryType: RaffleDeliveryType;
  imageUrl: string;
  titleKO: string;
  titleEN: string;
  titleJA: string;
  descKO: string;
  descEN: string;
  descJA: string;
  prizeKO: string;
  prizeEN: string;
  prizeJA: string;
  prizeUnit: RafflePrizeUnit;
  pickup: RafflePickup;
  noticeKO: string;
  noticeEN: string;
  noticeJA: string;
  /** v2.2 신규 — 추가 보상: 당첨자에게 자동 민팅되는 BIVE NFT */
  biveRewardYn: boolean;
  mintingEventId: number | null;
  mintingEventName: string | null;
  /** 진행중·종료 공통 통계 */
  totalParticipants: number;
  totalTicketsUsed: number;
  /** 종료 전용 통계 */
  winnerPaid?: number;
  winnerCountFinal?: number;
  loserCount?: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

/** v2.2 — Raffle 추가 보상 BIVE 캠페인 옵션 풀 ([CEB-BO-004] 호환) */
export const RAFFLE_MINTING_EVENTS: { id: number; name: string }[] = [
  { id: 23, name: 'V01D Welcome ED' },
  { id: 24, name: 'V01D Trivia Master' },
  { id: 25, name: 'V01D Final Boss' },
  { id: 26, name: 'V01D Prophet' },
  { id: 27, name: 'V01D 100 Days' },
  { id: 28, name: 'iKON FOUREVER Commemorative' },
];

export interface RaffleEntry {
  raffleId: number;
  userId: number;
  nickname: string;
  phone: string;
  recentTicketsUsed: number;
  recentEntryAt: string;
  cumulativeTickets: number;
  excludedFromDraw: boolean;
}

export interface RaffleEntryEvent {
  entryId: number;
  raffleId: number;
  userId: number;
  ticketsUsed: number;
  entryAt: string;
}

export interface RaffleWinner {
  raffleId: number;
  userId: number;
  nickname: string;
  phone: string;
  status: WinnerStatus;
  drawAt: string;
  cumulativeTickets: number;
  paid: boolean;
  note: string;
}

export interface RaffleDraw {
  raffleId: number;
  seed: string;
  drawnAt: string;
  drawnBy: string;
}

export const RAFFLE_STATUS_BADGE: Record<RaffleStatus, string> = {
  '임시저장': 'bg-gray-200 text-gray-700',
  '진행중': 'bg-emerald-100 text-emerald-700',
  '추첨대기': 'bg-gray-900 text-white',
  '종료': 'bg-gray-400 text-white',
};

export type RaffleEntryStatus = '정상' | '추첨 제외';
export const RAFFLE_ENTRY_STATUS_BADGE: Record<RaffleEntryStatus, string> = {
  '정상': 'bg-gray-100 text-gray-600',
  '추첨 제외': 'bg-rose-100 text-rose-700',
};

// ── 데이터 ─────────────────────────────────────────────────

export const raffles: Raffle[] = [
  {
    id: 101,
    status: '임시저장',
    artist: 'V01D',
    hidden: false,
    startAt: '',
    endAt: '2026.06.30 23:59',
    winnerCount: 10,
    deliveryType: '배송',
    imageUrl: '/raffle/raffle-101.jpg',
    titleKO: 'V01D 데뷔 100일 기념 굿즈 박스',
    titleEN: '',
    titleJA: '',
    descKO: 'V01D 데뷔 100일을 기념해 한정 굿즈 박스를 추첨으로 증정합니다. (작성 중)',
    descEN: '',
    descJA: '',
    prizeKO: '굿즈 박스 (포토북, 포스터, 미공개 사진집)',
    prizeEN: '',
    prizeJA: '',
    prizeUnit: '개',
    pickup: {
      startDt: '2026.07.05', endDt: '2026.07.15', openTime: '09:00', closeTime: '18:00',
      locationKO: '국내 배송 (CJ대한통운)', locationEN: '', locationJA: '',
      itemsKO: '주소·연락처 (앱 내 등록)', itemsEN: '', itemsJA: '',
    },
    noticeKO: '• 배송지 미등록 시 당첨 무효\n• 7일 이내 미수령 시 자동 폐기',
    noticeEN: '',
    noticeJA: '',
    biveRewardYn: false,
    mintingEventId: null,
    mintingEventName: null,
    totalParticipants: 0,
    totalTicketsUsed: 0,
    createdBy: 'nill', createdAt: '2026.05.10 14:00', updatedBy: 'nill', updatedAt: '2026.05.12 09:30',
  },
  {
    id: 102,
    status: '진행중',
    artist: 'iKON',
    hidden: false,
    startAt: '2026.04.24 09:25',
    endAt: '2026.05.13 23:59',
    winnerCount: 40,
    deliveryType: '현장 수령',
    imageUrl: '/raffle/raffle-102.jpg',
    titleKO: 'iKON FOUREVER TOUR in SEOUL · DAY 1 (5/16 토)',
    titleEN: 'iKON FOUREVER TOUR in SEOUL · DAY 1 (May 16, Sat)',
    titleJA: 'iKON FOUREVER TOUR in SEOUL · DAY 1 (5/16 土)',
    descKO: 'iKON FOUREVER TOUR 서울 공연 티켓! 2026.5.16(토) 18:00 장충체육관에서 JAY·BOBBY·SONG·CHAN의 무대를 만나보세요. 응모권을 여러 장 사용할수록 당첨 확률이 올라갑니다.',
    descEN: 'iKON FOUREVER TOUR in Seoul ticket! May 16 (Sat) 6PM at Jangchung Arena — catch JAY · BOBBY · SONG · CHAN on stage. More raffle tickets used, higher your winning chance.',
    descJA: 'iKON FOUREVER TOUR ソウル公演チケット！2026.5.16(土)18:00 奨忠体育館でJAY・BOBBY・SONG・CHANのステージへ。応募券を多く使うほど当選確率がアップ。',
    prizeKO: '공연 티켓 (SR SEAT)', prizeEN: 'Concert Ticket (SR SEAT)', prizeJA: '公演チケット (SR SEAT)',
    prizeUnit: '장',
    pickup: {
      startDt: '2026.05.16', endDt: '2026.05.16', openTime: '15:00', closeTime: '18:00',
      locationKO: '장충체육관 현장 부스 내 CELEBUS 수령 창구',
      locationEN: 'CELEBUS desk at the on-site booth, Jangchung Arena',
      locationJA: '奨忠体育館 現地ブース内 CELEBUS受取窓口',
      itemsKO: '당첨 기념 BIVE + 프로필 닉네임 (2중 확인)',
      itemsEN: 'Winner BIVE + profile nickname (2-step check)',
      itemsJA: '当選記念BIVE + プロフィールニックネーム (2重確認)',
    },
    noticeKO: '• 당첨 결과는 마감 후 앱 [Fan Quest 내역 > Raffle 탭]에서 확인합니다.\n• 티켓은 공연 당일 장충체육관 CELEBUS 창구에서 본인 직접 수령.\n• 양도·대리 수령 불가, 공연 시작 전 미수령 시 자동 소멸.\n• SR SEAT(정가 165,000원 상당), 세부 좌석 임의 배정.\n• 문의: cs@celebus.xyz',
    noticeEN: '• Winners announced after the deadline in [Fan Quest History > Raffle tab].\n• Pick up in person at the CELEBUS desk at Jangchung Arena on show day.\n• No transfers/proxy. Uncollected tickets forfeit at showtime.\n• SR SEAT (face value KRW 165,000); seat assigned at random.\n• Contact: cs@celebus.xyz',
    noticeJA: '• 当選結果は締切後にアプリ [Fan Quest履歴 > Raffleタブ] でご確認ください。\n• 公演当日、奨忠体育館 CELEBUS窓口にて本人直接受取。\n• 譲渡・代理不可、開演前未受取は自動失効。\n• お問い合わせ: cs@celebus.xyz',
    biveRewardYn: true,
    mintingEventId: 28,
    mintingEventName: 'iKON FOUREVER Commemorative',
    totalParticipants: 136,
    totalTicketsUsed: 1626,
    createdBy: 'nill', createdAt: '2026.04.24 09:25', updatedBy: 'nill', updatedAt: '2026.04.24 09:25',
  },
  {
    id: 103,
    status: '진행중',
    artist: 'V01D',
    hidden: false,
    startAt: '2026.05.04 10:00',
    endAt: '2026.05.15 23:59',
    winnerCount: 30,
    deliveryType: '현장 수령',
    imageUrl: '/raffle/raffle-103.jpg',
    titleKO: "V01D 'journey #01' 콘서트 티켓 래플 (5/17 일)",
    titleEN: "V01D 'journey #01' Concert Ticket Raffle (May 17, Sun)",
    titleJA: "V01D 'journey #01' コンサートチケットラッフル (5/17 日)",
    descKO: "V01D 첫 단독 콘서트 'journey #01' 티켓! 응모권을 사용해 당첨에 도전하세요.",
    descEN: "V01D's first solo concert 'journey #01' tickets! Use raffle tickets to win.",
    descJA: "V01D初単独コンサート 'journey #01' のチケット！応募券を使って当選を狙いましょう。",
    prizeKO: '공연 티켓 (R SEAT)', prizeEN: 'Concert Ticket (R SEAT)', prizeJA: '公演チケット (R SEAT)',
    prizeUnit: '장',
    pickup: {
      startDt: '2026.05.17', endDt: '2026.05.17', openTime: '16:00', closeTime: '19:00',
      locationKO: '올림픽홀 CELEBUS 부스',
      locationEN: 'Olympic Hall CELEBUS Booth',
      locationJA: 'オリンピックホール CELEBUSブース',
      itemsKO: '신분증 + 앱 당첨 BIVE',
      itemsEN: 'ID + Winner BIVE in app',
      itemsJA: '身分証 + アプリ当選BIVE',
    },
    noticeKO: '• 본인 직접 수령\n• 양도 불가',
    noticeEN: '• Pick up in person\n• No transfers',
    noticeJA: '• 本人直接受取\n• 譲渡不可',
    biveRewardYn: true,
    mintingEventId: 25,
    mintingEventName: 'V01D Final Boss',
    totalParticipants: 71,
    totalTicketsUsed: 279,
    createdBy: 'nill', createdAt: '2026.05.04 10:00', updatedBy: 'nill', updatedAt: '2026.05.04 10:00',
  },
  {
    id: 104,
    status: '추첨대기',
    artist: 'V01D',
    hidden: false,
    startAt: '2026.02.19 10:00',
    endAt: '2026.03.30 23:59',
    winnerCount: 10,
    deliveryType: '현장 수령',
    imageUrl: '/raffle/raffle-104.jpg',
    titleKO: 'V01D 하이터치 이벤트 추첨',
    titleEN: 'V01D High-Touch Event Raffle',
    titleJA: 'V01D ハイタッチイベント抽選',
    descKO: '응모권으로 V01D 멤버와 직접 하이터치할 기회! 마감 후 추첨하기를 진행해주세요.',
    descEN: 'Use raffle tickets to high-five V01D members in person! Draw after the deadline.',
    descJA: '応募券でV01Dメンバーとハイタッチできるチャンス！締切後に抽選してください。',
    prizeKO: '하이터치 패스', prizeEN: 'High-Touch Pass', prizeJA: 'ハイタッチパス',
    prizeUnit: '장',
    pickup: {
      startDt: '2026.04.05', endDt: '2026.04.05', openTime: '13:00', closeTime: '16:00',
      locationKO: '서울 코엑스 B홀',
      locationEN: 'COEX Hall B, Seoul',
      locationJA: 'ソウル COEX Bホール',
      itemsKO: '당첨 BIVE + 신분증',
      itemsEN: 'Winner BIVE + ID',
      itemsJA: '当選BIVE + 身分証',
    },
    noticeKO: '• 사진 촬영 불가\n• 본인 확인 후 입장',
    noticeEN: '• No photos\n• Entry after ID check',
    noticeJA: '• 撮影禁止\n• 本人確認後入場',
    biveRewardYn: false,
    mintingEventId: null,
    mintingEventName: null,
    totalParticipants: 20,
    totalTicketsUsed: 227,
    createdBy: 'nill', createdAt: '2026.02.19 10:00', updatedBy: 'nill', updatedAt: '2026.02.19 10:00',
  },
  {
    id: 105,
    status: '종료',
    artist: 'V01D',
    hidden: false,
    startAt: '2026.04.01 10:00',
    endAt: '2026.04.08 23:59',
    winnerCount: 15,
    deliveryType: '배송',
    imageUrl: '/raffle/raffle-105.jpg',
    titleKO: '[1차] V01D 데뷔 기념 멤버 친필 싸인 앨범[01]',
    titleEN: '[Round 1] V01D Debut Member Signed Album [01]',
    titleJA: '[第1回] V01D デビュー記念メンバー直筆サインアルバム[01]',
    descKO: 'V01D 데뷔 기념 멤버 친필 싸인 앨범을 추첨으로 증정합니다.',
    descEN: 'V01D debut member-signed album by lottery.',
    descJA: 'V01Dデビュー記念メンバー直筆サインアルバムを抽選贈呈。',
    prizeKO: '친필 싸인 앨범 1장', prizeEN: 'Signed album', prizeJA: '直筆サインアルバム',
    prizeUnit: '장',
    pickup: {
      startDt: '2026.04.12', endDt: '2026.04.20', openTime: '09:00', closeTime: '18:00',
      locationKO: '국내 배송', locationEN: 'Domestic shipping', locationJA: '国内配送',
      itemsKO: '주소·연락처 (앱 등록)', itemsEN: 'Address/contact (in app)', itemsJA: '住所・連絡先(アプリ)',
    },
    noticeKO: '• 7일 이내 배송지 미등록 시 무효',
    noticeEN: '• Forfeit if address not set within 7 days',
    noticeJA: '• 7日以内に住所未登録時無効',
    biveRewardYn: true,
    mintingEventId: 27,
    mintingEventName: 'V01D 100 Days',
    totalParticipants: 139,
    totalTicketsUsed: 698,
    winnerPaid: 1,
    winnerCountFinal: 15,
    loserCount: 124,
    createdBy: 'nill', createdAt: '2026.04.01 10:00', updatedBy: 'nill', updatedAt: '2026.04.09 14:20',
  },
  {
    id: 106,
    status: '종료',
    artist: 'V01D',
    hidden: true,
    startAt: '2026.04.09 10:00',
    endAt: '2026.04.15 23:59',
    winnerCount: 15,
    deliveryType: '배송',
    imageUrl: '/raffle/raffle-106.jpg',
    titleKO: '[2차] V01D 데뷔 기념 멤버 친필 싸인 앨범[01]',
    titleEN: '[Round 2] V01D Debut Member Signed Album [01]',
    titleJA: '[第2回] V01D デビュー記念メンバー直筆サインアルバム[01]',
    descKO: 'V01D 데뷔 기념 친필 싸인 앨범 2차 추첨.',
    descEN: 'Round 2 lottery for V01D signed album.',
    descJA: 'V01Dデビューサインアルバム 第2回抽選。',
    prizeKO: '친필 싸인 앨범 1장', prizeEN: 'Signed album', prizeJA: '直筆サインアルバム',
    prizeUnit: '장',
    pickup: {
      startDt: '2026.04.20', endDt: '2026.04.27', openTime: '09:00', closeTime: '18:00',
      locationKO: '국내 배송', locationEN: 'Domestic shipping', locationJA: '国内配送',
      itemsKO: '주소·연락처 (앱 등록)', itemsEN: 'Address/contact', itemsJA: '住所・連絡先',
    },
    noticeKO: '• 본 래플은 운영자가 숨김 처리하여 앱에 노출되지 않습니다.',
    noticeEN: '• Hidden by admin — not shown in app.',
    noticeJA: '• 管理者により非表示。',
    biveRewardYn: false,
    mintingEventId: null,
    mintingEventName: null,
    totalParticipants: 120,
    totalTicketsUsed: 979,
    winnerPaid: 15,
    winnerCountFinal: 15,
    loserCount: 105,
    createdBy: 'nill', createdAt: '2026.04.09 10:00', updatedBy: 'nill', updatedAt: '2026.04.16 11:00',
  },
];

// ── Entries (응모자 — 진행중·추첨대기·종료) ──────────────

const ENTRY_NICKNAMES = [
  'sihyeon329', 'dochi', 'yewon1640', 'ripple_ripple_820', 'marble_cloud_180',
  'marble_delta_240', 'river_violet_328', 'olive_violet_610', 'cloud_ember_452', 'pixel_dawn_274',
  'mellow_mellow_338', 'harbor_aurora_996', 'ye.n2324', 'stella', 'xisamdhus',
  'satin_pixel_824', 'delta_tulip_122', 'stellar_ember_832', 'delta_delta_790', 'lucid_aurora_115',
  'sky_navy_007', 'fan_loyal_412', 'minty_breeze_058', 'crimson_glow_733', 'cobalt_dawn_281',
  'velvet_moss_604', 'amber_orchid_817', 'gold_lotus_550', 'silver_pine_172', 'maple_sunset_466',
];

function genEntries(raffleId: number, count: number, baseDate: string): RaffleEntry[] {
  return Array.from({ length: count }).map((_, i) => {
    const recentTicketsUsed = [1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 12, 14, 20, 1, 1, 3, 1, 5, 11, 11][i % 20];
    const cumulative = [25, 5, 40, 1, 1, 1, 1, 1, 1, 1, 22, 49, 28, 1, 1, 11, 5, 11, 11, 11][i % 20];
    return {
      raffleId,
      userId: raffleId * 1000 + i + 1,
      nickname: ENTRY_NICKNAMES[i % ENTRY_NICKNAMES.length],
      phone: `010${String(10000000 + i * 137 + raffleId).padStart(8, '0')}`,
      recentTicketsUsed,
      recentEntryAt: `${baseDate} ${String(7 + (i % 12)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
      cumulativeTickets: cumulative,
      excludedFromDraw: false,
    };
  });
}

export const raffleEntries: RaffleEntry[] = [
  ...genEntries(102, 25, '2026.05.13'),
  ...genEntries(103, 15, '2026.05.12'),
  ...genEntries(104, 20, '2026.03.29'),
  ...genEntries(105, 25, '2026.04.08'),
  ...genEntries(106, 25, '2026.04.15'),
];

// ── Entry Events (시계열, 응모내역 모달용) ─────────────────

function genEntryEvents(raffleId: number, userId: number, total: number, baseDt: string): RaffleEntryEvent[] {
  const splits = total === 1 ? [1] : total <= 3 ? [1, 1, 1].slice(0, total) : [1, 1, 1, total - 3];
  return splits.map((tickets, i) => ({
    entryId: raffleId * 10000 + userId * 10 + i,
    raffleId,
    userId,
    ticketsUsed: tickets,
    entryAt: `${baseDt} ${String(7 + i * 2).padStart(2, '0')}:${String((i * 11) % 60).padStart(2, '0')}`,
  }));
}

// ── Winners (추첨 결과 — 종료 raffle만) ────────────────────

const WINNER_NICKNAMES_105 = ['4nellie2', '808one', 'ahyon', 'arty', 'camila2', 'haelulu', 'juyeonii', 'lemon', 'marina', 'noah', 'olive', 'pepper', 'quartz', 'rin', 'skye'];

function genWinners(raffleId: number, winnerCount: number, totalCount: number, drawDate: string): RaffleWinner[] {
  return Array.from({ length: totalCount }).map((_, i) => {
    const isWinner = i < winnerCount;
    return {
      raffleId,
      userId: raffleId * 1000 + i + 1,
      nickname: isWinner ? (WINNER_NICKNAMES_105[i] ?? `winner_${i}`) : ENTRY_NICKNAMES[(i + 5) % ENTRY_NICKNAMES.length],
      phone: `010${String(20000000 + i * 211 + raffleId).padStart(8, '0')}`,
      status: isWinner ? '당첨' : '미당첨',
      drawAt: drawDate,
      cumulativeTickets: isWinner ? [11, 11, 4, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11][i] ?? 5 : 1,
      paid: raffleId === 106 ? true : (isWinner && i === 0),
      note: '',
    };
  });
}

export const raffleWinners: RaffleWinner[] = [
  ...genWinners(105, 15, 139, '2026.04.09'),
  ...genWinners(106, 15, 120, '2026.04.16'),
];

export const raffleDraws: RaffleDraw[] = [
  { raffleId: 105, seed: 'a3f47b8c92e1d05f6b27', drawnAt: '2026.04.09 10:30', drawnBy: 'nill' },
  { raffleId: 106, seed: 'b7e29d04f6a8c1e3d540', drawnAt: '2026.04.16 11:00', drawnBy: 'nill' },
];

// ── 헬퍼 ─────────────────────────────────────────────────

export function getRaffleById(id: number): Raffle | undefined {
  return raffles.find((r) => r.id === id);
}

export function getRaffleEntries(raffleId: number): RaffleEntry[] {
  return raffleEntries.filter((e) => e.raffleId === raffleId);
}

export function getRaffleEntryEvents(raffleId: number, userId: number): RaffleEntryEvent[] {
  const entry = raffleEntries.find((e) => e.raffleId === raffleId && e.userId === userId);
  if (!entry) return [];
  return genEntryEvents(raffleId, userId, entry.cumulativeTickets, '2026.05.12');
}

export function getRaffleWinners(raffleId: number): RaffleWinner[] {
  return raffleWinners.filter((w) => w.raffleId === raffleId);
}

export function getRaffleDraw(raffleId: number): RaffleDraw | undefined {
  return raffleDraws.find((d) => d.raffleId === raffleId);
}

/**
 * Mock 시드 생성 — 운영의 SHA256 기반을 단순화하여 hex 16자만 생성
 */
export function generateMockSeed(raffleId: number): string {
  const buf = `${raffleId}-${Date.now()}-${Math.random()}`;
  let h = 0;
  for (let i = 0; i < buf.length; i++) h = (h * 31 + buf.charCodeAt(i)) >>> 0;
  return Array.from({ length: 5 }, () => ((h = (h * 1103515245 + 12345) >>> 0) >>> 0).toString(16).padStart(4, '0')).join('').slice(0, 20);
}
