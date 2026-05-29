// 아티스트 팬덤 레벨 — 앱 [CEB-EVT-201] 팬덤 레벨 운영 mock
// 명세: [CEB-BO-EVT-000 v1.4] / [EVT-201 v1.3] / [EVT-401 v1.1]
// 보상 모델 재설계 — 활성 3종(디지털 굿즈=BIVE 캠페인 연계 / 래플 예고 / 서포트 예고)

// 시즌 라이프사이클 3단계 — [CEB-BO-EVT-000 v1.5] §4.1.1
export type FandomStatus = '준비' | '진행중' | '종료';
// 레벨 운영 상태 — [CEB-BO-EVT-000] §4.1.2
export type LevelStatus = '운영중' | '최고레벨';
// 레벨별 보상 종류 (활성 3종) — [CEB-BO-EVT-000] §4.4
export type RewardType = '디지털 굿즈' | '래플 예고' | '서포트 예고';
// BIVE 민팅 연계 상태 — [CEB-BO-EVT-201] §2.5 / [CEB-BO-BIVE-203]
export type MintStatus = '대기' | '민팅중' | '완료';

export const FANDOM_STATUSES: FandomStatus[] = ['준비', '진행중', '종료'];
export const REWARD_TYPES: RewardType[] = ['디지털 굿즈', '래플 예고', '서포트 예고'];
export const MINT_STATUSES: MintStatus[] = ['대기', '민팅중', '완료'];

// 생성 모달용 시즌 연도 목록 — [CEB-BO-EVT-101] §2.4
export const FANDOM_SEASON_YEARS = [2024, 2025, 2026];

// 권장 레벨링 곡선 (단위 DUK) — [CEB-BO-EVT-000] §4.2
export const RECOMMENDED_CURVE = [10000, 30000, 70000, 150000, 300000, 550000, 1000000, 1800000, 3200000, 6000000];

// BIVE 민팅 캠페인 (디지털 굿즈 보상 드롭다운 데이터 소스) — [CEB-BO-BIVE-203]
// "아티스트 키우기 보상" 연결 기능을 가진 활성 민팅 캠페인만 선택 가능
export interface BiveCampaign {
  id: string;
  name: string;
  trigger: '아티스트 키우기 보상';
  biveNames: string[]; // 캠페인에 등록된 BIVE 미리보기명
}

export const BIVE_CAMPAIGNS: BiveCampaign[] = [
  { id: 'BIVE-CMP-01', name: 'V01D 시즌2 디지털 포토카드 캠페인', trigger: '아티스트 키우기 보상', biveNames: ['V01D 포토카드 #001', 'V01D 포토카드 #002', 'V01D 포토카드 #003'] },
  { id: 'BIVE-CMP-02', name: 'V01D 웰컴 뱃지 캠페인', trigger: '아티스트 키우기 보상', biveNames: ['V01D 웰컴 뱃지'] },
  { id: 'BIVE-CMP-03', name: 'iKON 스페셜 뱃지 캠페인', trigger: '아티스트 키우기 보상', biveNames: ['iKON 골드 뱃지', 'iKON 실버 뱃지'] },
  { id: 'BIVE-CMP-04', name: 'CELEBUS 공통 기념 BIVE 캠페인', trigger: '아티스트 키우기 보상', biveNames: ['CELEBUS 1주년 기념 BIVE'] },
  { id: 'BIVE-CMP-05', name: 'MADEIN 데뷔 기념 BIVE 캠페인', trigger: '아티스트 키우기 보상', biveNames: ['MADEIN 데뷔 BIVE'] },
];

export function getBiveCampaignById(id?: string): BiveCampaign | undefined {
  return id ? BIVE_CAMPAIGNS.find((c) => c.id === id) : undefined;
}

export interface FandomLevelStep {
  level: number;
  targetDuk: number;
}

// 레벨별 보상 — [CEB-BO-EVT-201] §2.4
// 디지털 굿즈: biveCampaignId / 래플·서포트 예고: announceKo/En/Jp
export interface FandomReward {
  level: number;
  kind: RewardType;
  sortOrder: number; // 같은 레벨 내 노출 순서
  biveCampaignId?: string; // 디지털 굿즈 — 연결 BIVE 민팅 캠페인
  titleKo?: string; // 디지털 굿즈 — 보상 타이틀 (한국어, 앱 표시명)
  titleEn?: string; // 디지털 굿즈 — 보상 타이틀 (영어)
  titleJp?: string; // 디지털 굿즈 — 보상 타이틀 (일본어)
  announceKo?: string; // 래플·서포트 예고 — 안내 텍스트 (한국어)
  announceEn?: string; // 래플·서포트 예고 — 안내 텍스트 (영어)
  announceJp?: string; // 래플·서포트 예고 — 안내 텍스트 (일본어)
}

// 레벨업 이력 — [CEB-BO-EVT-201] §2.5
export interface LevelUpHistory {
  level: number;
  achievedAt: string;
  targetMemberCount: number; // 대상 회원 수 (1DUK 이상 기여)
  rewardSummary: string; // 연결 보상 요약 (디지털 굿즈 캠페인명 / 래플·서포트 예고 문구)
}

// 디지털 굿즈(BIVE) 지급 연계 현황 — [CEB-BO-EVT-201] §2.5 / [CEB-BO-EVT-401] §2.3
// 디지털 굿즈 보상만 지급 대상 (래플·서포트 예고는 지급 현황 없음)
export interface BiveGrant {
  id: number;
  member: string;
  level: number;
  campaignName: string; // 연결된 BIVE 민팅 캠페인명
  mintStatus: MintStatus; // BIVE 영역 민팅 상태 (연계 표시)
  date: string;
}

export interface FandomLevel {
  id: number;
  status: FandomStatus;
  levelStatus: LevelStatus; // 현재 레벨 == 최대 레벨 → 최고레벨
  groupName: string;
  season: string;
  seasonPeriod: string;
  levels: FandomLevelStep[];
  currentLevel: number;
  accumulatedDuk: number;
  participants: number;
  updatedAt: string;
  rewards: FandomReward[];
  levelUpHistory: LevelUpHistory[];
  biveGrants: BiveGrant[];
}

const curve = (n: number): FandomLevelStep[] =>
  RECOMMENDED_CURVE.slice(0, n).map((targetDuk, i) => ({ level: i + 1, targetDuk }));

// 레벨 운영 상태 계산 — 현재 레벨이 최대 레벨 이상이면 최고레벨
export function computeLevelStatus(currentLevel: number, levelCount: number): LevelStatus {
  return levelCount > 0 && currentLevel >= levelCount ? '최고레벨' : '운영중';
}

export const fandomLevels: FandomLevel[] = [
  {
    id: 2, status: '진행중', levelStatus: '운영중', groupName: 'V01D', season: 'V01D 팬덤 2기 (2026)', seasonPeriod: '2026.01.01 ~ 2026.12.31',
    levels: curve(10), currentLevel: 4, accumulatedDuk: 1240000, participants: 8210, updatedAt: '2026.05.28 17:21',
    rewards: [
      { level: 2, kind: '디지털 굿즈', biveCampaignId: 'BIVE-CMP-02', titleKo: 'V01D 웰컴 뱃지', titleEn: 'V01D Welcome Badge', titleJp: 'V01D ウェルカムバッジ', sortOrder: 1 },
      { level: 3, kind: '디지털 굿즈', biveCampaignId: 'BIVE-CMP-01', titleKo: 'V01D 시즌2 디지털 포토카드', titleEn: 'V01D S2 Digital Photocard', titleJp: 'V01D シーズン2 デジタルフォトカード', sortOrder: 1 },
      { level: 5, kind: '래플 예고', announceKo: 'Lv.5 달성 시 사인 굿즈 래플 진행 예정', announceEn: 'Signed goods raffle upon reaching Lv.5', announceJp: 'Lv.5達成時 サイングッズ ラッフル予定', sortOrder: 1 },
      { level: 7, kind: '서포트 예고', announceKo: 'Lv.7 달성 시 팬사인회 서포트 이벤트 예정', announceEn: 'Fansign support event upon reaching Lv.7', announceJp: 'Lv.7達成時 ファンサイン会 サポートイベント予定', sortOrder: 1 },
      { level: 10, kind: '서포트 예고', announceKo: 'Lv.10 달성 시 콘서트 VIP 서포트 예정', announceEn: 'Concert VIP support upon reaching Lv.10', announceJp: 'Lv.10達成時 コンサートVIP サポート予定', sortOrder: 1 },
    ],
    levelUpHistory: [
      { level: 1, achievedAt: '2026.02.10 09:30', targetMemberCount: 5120, rewardSummary: '보상 없음' },
      { level: 2, achievedAt: '2026.03.05 14:00', targetMemberCount: 6240, rewardSummary: '디지털 굿즈 · V01D 웰컴 뱃지 캠페인' },
      { level: 3, achievedAt: '2026.04.18 11:20', targetMemberCount: 7510, rewardSummary: '디지털 굿즈 · V01D 시즌2 디지털 포토카드 캠페인' },
      { level: 4, achievedAt: '2026.05.20 10:00', targetMemberCount: 8210, rewardSummary: '보상 없음' },
    ],
    biveGrants: [
      { id: 1, member: 'voidlover', level: 3, campaignName: 'V01D 시즌2 디지털 포토카드 캠페인', mintStatus: '완료', date: '2026.04.18 11:21' },
      { id: 2, member: '신노스케fan', level: 2, campaignName: 'V01D 웰컴 뱃지 캠페인', mintStatus: '완료', date: '2026.03.05 14:01' },
      { id: 3, member: 'kebin_p', level: 3, campaignName: 'V01D 시즌2 디지털 포토카드 캠페인', mintStatus: '민팅중', date: '2026.04.18 11:25' },
    ],
  },
  {
    id: 5, status: '진행중', levelStatus: '운영중', groupName: 'iKON', season: 'iKON 팬덤 2기 (2026)', seasonPeriod: '2026.01.01 ~ 2026.12.31',
    levels: curve(10), currentLevel: 6, accumulatedDuk: 3400000, participants: 19200, updatedAt: '2026.05.27 14:02',
    rewards: [
      { level: 5, kind: '래플 예고', announceKo: 'Lv.5 달성 시 사인 앨범 래플 진행 예정', announceEn: 'Signed album raffle upon reaching Lv.5', announceJp: 'Lv.5達成時 サイン入りアルバム ラッフル予定', sortOrder: 1 },
      { level: 6, kind: '디지털 굿즈', biveCampaignId: 'BIVE-CMP-03', titleKo: 'iKON 스페셜 뱃지', titleEn: 'iKON Special Badge', titleJp: 'iKON スペシャルバッジ', sortOrder: 1 },
    ],
    levelUpHistory: [
      { level: 5, achievedAt: '2026.05.01 09:00', targetMemberCount: 16400, rewardSummary: '래플 예고 · Lv.5 달성 시 사인 앨범 래플 진행 예정' },
      { level: 6, achievedAt: '2026.05.21 09:00', targetMemberCount: 19200, rewardSummary: '디지털 굿즈 · iKON 스페셜 뱃지 캠페인' },
    ],
    biveGrants: [
      { id: 1, member: 'ikonic_99', level: 6, campaignName: 'iKON 스페셜 뱃지 캠페인', mintStatus: '완료', date: '2026.05.21 09:00' },
      { id: 2, member: 'bobby_fan', level: 6, campaignName: 'iKON 스페셜 뱃지 캠페인', mintStatus: '완료', date: '2026.05.21 09:02' },
    ],
  },
  {
    id: 4, status: '진행중', levelStatus: '운영중', groupName: 'MADEIN', season: 'MADEIN 팬덤 2기 (2026)', seasonPeriod: '2026.01.01 ~ 2026.12.31',
    levels: curve(8), currentLevel: 3, accumulatedDuk: 420000, participants: 5300, updatedAt: '2026.05.25 11:10',
    rewards: [
      { level: 1, kind: '디지털 굿즈', biveCampaignId: 'BIVE-CMP-05', titleKo: 'MADEIN 데뷔 기념 BIVE', titleEn: 'MADEIN Debut BIVE', titleJp: 'MADEIN デビュー記念 BIVE', sortOrder: 1 },
      { level: 3, kind: '래플 예고', announceKo: 'Lv.3 달성 시 포토북 래플 진행 예정', announceEn: 'Photobook raffle upon reaching Lv.3', announceJp: 'Lv.3達成時 フォトブック ラッフル予定', sortOrder: 1 },
    ],
    levelUpHistory: [
      { level: 1, achievedAt: '2026.03.12 10:00', targetMemberCount: 3100, rewardSummary: '디지털 굿즈 · MADEIN 데뷔 기념 BIVE 캠페인' },
      { level: 2, achievedAt: '2026.04.20 13:00', targetMemberCount: 4200, rewardSummary: '보상 없음' },
      { level: 3, achievedAt: '2026.05.24 20:05', targetMemberCount: 5300, rewardSummary: '래플 예고 · Lv.3 달성 시 포토북 래플 진행 예정' },
    ],
    biveGrants: [
      { id: 1, member: 'gunwook_p', level: 1, campaignName: 'MADEIN 데뷔 기념 BIVE 캠페인', mintStatus: '완료', date: '2026.03.12 10:00' },
      { id: 2, member: 'madein_lv', level: 1, campaignName: 'MADEIN 데뷔 기념 BIVE 캠페인', mintStatus: '완료', date: '2026.03.12 10:01' },
    ],
  },
  {
    id: 3, status: '준비', levelStatus: '운영중', groupName: 'CELEBUS', season: 'CELEBUS 팬덤 1기 (2026)', seasonPeriod: '2026.01.01 ~ 2026.12.31',
    levels: curve(5), currentLevel: 0, accumulatedDuk: 0, participants: 0, updatedAt: '2026.05.20 09:00',
    rewards: [
      { level: 1, kind: '디지털 굿즈', biveCampaignId: 'BIVE-CMP-04', titleKo: 'CELEBUS 1주년 기념 BIVE', titleEn: 'CELEBUS 1st Anniversary BIVE', titleJp: 'CELEBUS 1周年記念 BIVE', sortOrder: 1 },
    ],
    levelUpHistory: [],
    biveGrants: [],
  },
  {
    id: 1, status: '진행중', levelStatus: '최고레벨', groupName: '언더라이트 (UNDER:LIGHT)', season: '언더라이트 팬덤 2기 (2026)', seasonPeriod: '2026.01.01 ~ 2026.12.31',
    levels: curve(10), currentLevel: 10, accumulatedDuk: 6400000, participants: 41000, updatedAt: '2026.05.28 08:00',
    rewards: [
      { level: 5, kind: '래플 예고', announceKo: 'Lv.5 달성 시 단체 사인 굿즈 래플 진행 예정', announceEn: 'Group signed goods raffle upon reaching Lv.5', announceJp: 'Lv.5達成時 集団サイングッズ ラッフル予定', sortOrder: 1 },
      { level: 10, kind: '서포트 예고', announceKo: 'Lv.10 달성 시 단독 팬미팅 서포트 예정', announceEn: 'Solo fanmeeting support upon reaching Lv.10', announceJp: 'Lv.10達成時 単独ファンミーティング サポート予定', sortOrder: 1 },
    ],
    levelUpHistory: [
      { level: 5, achievedAt: '2026.03.01 12:00', targetMemberCount: 28000, rewardSummary: '래플 예고 · Lv.5 달성 시 단체 사인 굿즈 래플 진행 예정' },
      { level: 10, achievedAt: '2026.05.18 15:00', targetMemberCount: 41000, rewardSummary: '서포트 예고 · Lv.10 달성 시 단독 팬미팅 서포트 예정' },
    ],
    biveGrants: [],
  },
  {
    id: 7, status: '종료', levelStatus: '최고레벨', groupName: 'V01D', season: 'V01D 팬덤 1기 (2025)', seasonPeriod: '2025.01.01 ~ 2025.12.31',
    levels: curve(10), currentLevel: 10, accumulatedDuk: 6100000, participants: 7200, updatedAt: '2026.01.02 10:00',
    rewards: [
      { level: 5, kind: '래플 예고', announceKo: 'Lv.5 달성 시 1기 기념 사인 굿즈 래플 진행 예정', announceEn: '1st season signed goods raffle upon reaching Lv.5', announceJp: 'Lv.5達成時 1期記念サイングッズ ラッフル予定', sortOrder: 1 },
      { level: 10, kind: '디지털 굿즈', biveCampaignId: 'BIVE-CMP-02', titleKo: 'V01D 1기 완주 기념 뱃지', titleEn: 'V01D Season 1 Complete Badge', titleJp: 'V01D 1期完走記念バッジ', sortOrder: 1 },
    ],
    levelUpHistory: [
      { level: 5, achievedAt: '2025.06.10 12:00', targetMemberCount: 4800, rewardSummary: '래플 예고 · Lv.5 달성 시 1기 기념 사인 굿즈 래플 진행 예정' },
      { level: 10, achievedAt: '2025.12.20 18:00', targetMemberCount: 7200, rewardSummary: '디지털 굿즈 · V01D 웰컴 뱃지 캠페인' },
    ],
    biveGrants: [
      { id: 1, member: 'voidlover', level: 10, campaignName: 'V01D 웰컴 뱃지 캠페인', mintStatus: '민팅중', date: '2025.12.20 18:00' },
      { id: 2, member: 'first_fan', level: 10, campaignName: 'V01D 웰컴 뱃지 캠페인', mintStatus: '대기', date: '2025.12.20 18:00' },
    ],
  },
  {
    id: 6, status: '종료', levelStatus: '최고레벨', groupName: 'iKON', season: 'iKON 팬덤 1기 (2025)', seasonPeriod: '2025.01.01 ~ 2025.12.31',
    levels: curve(10), currentLevel: 10, accumulatedDuk: 5800000, participants: 16400, updatedAt: '2025.12.31 23:59',
    rewards: [
      { level: 5, kind: '래플 예고', announceKo: 'Lv.5 달성 시 1기 사인 앨범 래플 진행 예정', announceEn: '1st season signed album raffle upon reaching Lv.5', announceJp: 'Lv.5達成時 1期サイン入りアルバム ラッフル予定', sortOrder: 1 },
      { level: 10, kind: '디지털 굿즈', biveCampaignId: 'BIVE-CMP-03', sortOrder: 1 },
    ],
    levelUpHistory: [
      { level: 5, achievedAt: '2025.07.01 12:00', targetMemberCount: 12000, rewardSummary: '래플 예고 · Lv.5 달성 시 1기 사인 앨범 래플 진행 예정' },
      { level: 10, achievedAt: '2025.12.10 18:00', targetMemberCount: 16400, rewardSummary: '디지털 굿즈 · iKON 스페셜 뱃지 캠페인' },
    ],
    biveGrants: [
      { id: 1, member: 'ikonic_og', level: 10, campaignName: 'iKON 스페셜 뱃지 캠페인', mintStatus: '완료', date: '2025.12.11 09:00' },
      { id: 2, member: 'bobby_fan', level: 10, campaignName: 'iKON 스페셜 뱃지 캠페인', mintStatus: '완료', date: '2025.12.11 09:02' },
    ],
  },
];

export const FANDOM_SEASONS = Array.from(new Set(fandomLevels.map((f) => f.season)));

export const FANDOM_GROUPS = ['V01D', 'iKON', 'MADEIN', 'CELEBUS', '언더라이트 (UNDER:LIGHT)'];

export function getFandomById(id: number): FandomLevel | undefined {
  return fandomLevels.find((f) => f.id === id);
}

// 레벨별 보상 요약 문구 생성 — 레벨업 이력·현황 표시용
export function rewardSummaryOf(reward: FandomReward): string {
  if (reward.kind === '디지털 굿즈') {
    const campaign = getBiveCampaignById(reward.biveCampaignId);
    return `디지털 굿즈 · ${campaign?.name ?? '캠페인 미선택'}`;
  }
  return `${reward.kind} · ${reward.announceKo ?? ''}`;
}
