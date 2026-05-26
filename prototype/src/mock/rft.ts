// 응모권(RFT) MVP — [CEB-BO-010] v2.3 SSOT (Phase 13)
// 라이프사이클 3상태(ISSUED/HELD/USED) + 정규 발급 출처 5종 + 사용 1종 + 발급 출처 메타
// Phase 13 변경: 일일 미션 출처 제거. PM·ST 보상 / 덕력 랭킹 보상 신규 추가.

export type RftStatus = 'ISSUED' | 'HELD' | 'USED';

export type RftSourceFeature =
  | 'QUEST_REWARD'           // 퀘스트 보상
  | 'GAME_REWARD'            // PM·ST 보상 (Phase 13 신규)
  | 'BIVE_BENEFIT'           // BIVE 보유혜택
  | 'DUK_RANKING_REWARD'     // 덕력 랭킹 보상 (Phase 13 신규)
  | 'GP_EXCHANGE'            // GP로 응모권 구매
  | 'RAFFLE_ENTRY';          // 래플 응모 사용
// [CEB-BO-010] v2.6 정합 — 운영 카테고리 3종(RAFFLE_CANCEL_REFUND·ADMIN_CORRECTION·ADMIN_RECLAIM) 폐기 (2026-05-21 정정)

export type RftSourceRefType =
  | 'QUEST'
  | 'GAME'
  | 'BIVE_TOKEN'
  | 'SEASON'
  | 'EXCHANGE'
  | 'RAFFLE';

export interface SourceMeta {
  code: RftSourceFeature;
  nameKO: string;
  nameEN: string;
  nameJP: string;
  category: 'EARN' | 'USE';
  refType: RftSourceRefType;
  active: boolean;
  // GP_EXCHANGE 전용 환율 (N GP / 1장)
  gpRate?: number;
  // 발급 룰 요약 (운영자 노출)
  issueRule: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export interface RftLog {
  id: number;
  occurredAt: string; // YYYY.MM.DD HH:mm
  memberId: number;
  nickname: string;
  status: RftStatus;
  delta: number; // +N장 (발급) / -N장 (사용)
  balanceAfter: number;
  sourceFeature: RftSourceFeature;
  sourceArtistContext: 'V01D' | 'iKON' | 'CELEBUS' | null; // null = 전역
  sourceRefId: string;
  sourceRefType: RftSourceRefType;
  // [CEB-BO-RFT-201] §2-3·§4 정합 — 삭제 회원 처리 (2026-05-21 sync 정정)
  memberDeleted?: boolean;
}

export const sourcePolicies: SourceMeta[] = [
  {
    code: 'QUEST_REWARD',
    nameKO: '퀘스트 보상',
    nameEN: 'Quest Reward',
    nameJP: 'クエスト報酬',
    category: 'EARN',
    refType: 'QUEST',
    active: true,
    issueRule: 'Quest별 정책 (1~10장)',
    lastUpdatedBy: 'nill',
    lastUpdatedAt: '2026.05.04 15:38',
  },
  {
    code: 'GAME_REWARD',
    nameKO: 'PM·ST 보상',
    nameEN: 'PM·ST Reward',
    nameJP: 'PM・ST 報酬',
    category: 'EARN',
    refType: 'GAME',
    active: true,
    issueRule: '게임별 응모권 지급 토글이 켜져 있을 때 종료 시 자동 (기본: PM 미지급, ST 생존자 0매·탈락자 1매)',
    lastUpdatedBy: 'nill',
    lastUpdatedAt: '2026.05.14 10:00',
  },
  {
    code: 'BIVE_BENEFIT',
    nameKO: 'BIVE 보유혜택',
    nameEN: 'BIVE Benefit',
    nameJP: 'BIVE 保有特典',
    category: 'EARN',
    refType: 'BIVE_TOKEN',
    active: true,
    issueRule: '혜택별 정책 (N장 / 주기)',
    lastUpdatedBy: 'nill',
    lastUpdatedAt: '2026.02.24 14:15',
  },
  {
    code: 'DUK_RANKING_REWARD',
    nameKO: '덕력 랭킹 보상',
    nameEN: 'Fan Power Ranking Reward',
    nameJP: '덕力 ランキング報酬',
    category: 'EARN',
    refType: 'SEASON',
    active: true,
    issueRule: '덕력 시즌 정산 시 티어·랭킹 보상으로 자동 발급',
    lastUpdatedBy: 'nill',
    lastUpdatedAt: '2026.05.14 10:00',
  },
  {
    code: 'GP_EXCHANGE',
    nameKO: 'GP로 응모권 구매',
    nameEN: 'GP Purchase',
    nameJP: 'GP 購入',
    category: 'EARN',
    refType: 'EXCHANGE',
    active: true,
    gpRate: 25,
    issueRule: '환율: 25 GP / 1장 (전역, 일일 한도 무제한). 앱내 구매 운영 토글이 켜져 있을 때만',
    lastUpdatedBy: 'nill',
    lastUpdatedAt: '2026.04.27 12:35',
  },
  {
    code: 'RAFFLE_ENTRY',
    nameKO: '래플 응모 사용',
    nameEN: 'Raffle Entry',
    nameJP: 'Raffle 応募',
    category: 'USE',
    refType: 'RAFFLE',
    active: true,
    issueRule: 'Raffle별 정책 (응모 비용 -1장)',
    lastUpdatedBy: 'nill',
    lastUpdatedAt: '2026.04.27 12:35',
  },
];

// 결정적 회원·로그 시드 데이터
// ── GP 교환 정책 (운영자 설정 — [CEB-BO-RFT-301]) ────────────
export interface GpExchangePolicy {
  rate: number;                          // N GP → 응모권 1장
  dailyLimitPerMember: number | null;    // 회원당 1일 응모권 교환 한도 (장). null = 무제한
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}
export const initialGpExchangePolicy: GpExchangePolicy = {
  rate: 25,
  dailyLimitPerMember: null,  // 기본값: 무제한
  lastUpdatedBy: 'nill',
  lastUpdatedAt: '2026.04.27 12:35',
};

// ── 앱내 응모권 구매 운영 토글 (Buy-RF-Ticket-001 — [CEB-BO-RFT-301] §2-6) ────────────
// Phase 13 신규 — 점검·장애 시 운영자가 앱 [구매하기] 버튼을 즉시 비활성
export interface AppBuyTogglePolicy {
  enabled: boolean;                      // true = 정상 운영 / false = 점검중
  maintenanceReason: string;             // OFF 시 사유 (선택 입력, 운영 로그 보존용)
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}
export const initialAppBuyTogglePolicy: AppBuyTogglePolicy = {
  enabled: true,
  maintenanceReason: '',
  lastUpdatedBy: 'nill',
  lastUpdatedAt: '2026.05.14 10:00',
};

// ── PM·ST 게임별 응모권 지급 기본 정책 (RFT-301 §2-7) ────────────
// Phase 13 신규 — 게임 종료 시 자동 지급. 게임별 오버라이드는 RFT-302
export interface GameRewardPolicyRow {
  type: 'PM' | 'ST_SURVIVOR' | 'ST_ELIMINATED';
  label: string;
  enabled: boolean;
  defaultAmount: number;                 // 기본 지급 수량 (장)
  note: string;
}
export interface GameRewardPolicy {
  rows: GameRewardPolicyRow[];
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}
export const initialGameRewardPolicy: GameRewardPolicy = {
  rows: [
    { type: 'PM',            label: 'Prediction Market',        enabled: true, defaultAmount: 0, note: '게임별로 운영자가 수량 지정' },
    { type: 'ST_SURVIVOR',   label: 'Survival Trivia (생존자)', enabled: true, defaultAmount: 0, note: '게임별로 운영자가 수량 지정' },
    { type: 'ST_ELIMINATED', label: 'Survival Trivia (탈락자)', enabled: true, defaultAmount: 0, note: '게임별로 운영자가 수량 지정' },
  ],
  lastUpdatedBy: 'nill',
  lastUpdatedAt: '2026.05.14 10:00',
};

const NICKNAMES = [
  'luna_jiyun_lee', 'ghksdud', 'nurune', 'sara', 'sxlvxr',
  'gaon3472', 'seul', 'yoonseo', 'pooo', 'xxxx',
  'ttee', 'jisoo_kr', 'haru.ux', 'rosie', 'bumin22',
  'choco', 'ddal', 'eunha', 'fox.lily', 'gguri',
];

const ARTISTS: ('V01D' | 'iKON' | 'CELEBUS' | null)[] = ['V01D', 'iKON', 'CELEBUS', null];

function pickArtistByFeature(feature: RftSourceFeature, idx: number): 'V01D' | 'iKON' | 'CELEBUS' | null {
  // GP_EXCHANGE / DUK_RANKING_REWARD는 전역(NULL), 그 외는 아티스트 컨텍스트
  if (feature === 'GP_EXCHANGE' || feature === 'DUK_RANKING_REWARD') return null;
  return ARTISTS[idx % 3] as 'V01D' | 'iKON' | 'CELEBUS';
}

function makeLog(
  id: number,
  daysAgo: number,
  hours: number,
  memberIdx: number,
  feature: RftSourceFeature,
  delta: number,
  balanceAfter: number,
): RftLog {
  const date = new Date(2026, 4, 7 - daysAgo, hours, (id * 7) % 60);
  const occurredAt = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const nickname = NICKNAMES[memberIdx % NICKNAMES.length];
  const artistContext = pickArtistByFeature(feature, memberIdx);
  const refMap: Record<RftSourceFeature, RftSourceRefType> = {
    QUEST_REWARD: 'QUEST',
    GAME_REWARD: 'GAME',
    BIVE_BENEFIT: 'BIVE_TOKEN',
    DUK_RANKING_REWARD: 'SEASON',
    GP_EXCHANGE: 'EXCHANGE',
    RAFFLE_ENTRY: 'RAFFLE',
  };
  const refIdMap: Record<RftSourceFeature, string> = {
    QUEST_REWARD: `Quest #${44 - (id % 8)}`,
    GAME_REWARD: `Game #${20 - (id % 6)}`,
    BIVE_BENEFIT: `BIVE #${3000 + (id % 500)}`,
    DUK_RANKING_REWARD: `Season #${(id % 4) + 1}`,
    GP_EXCHANGE: `Tx ${100000 + id}`,
    RAFFLE_ENTRY: `Raffle #${12 - (id % 5)}`,
  };
  return {
    id,
    occurredAt,
    memberId: 100 + memberIdx,
    nickname,
    status: delta > 0 ? 'ISSUED' : 'USED',
    delta,
    balanceAfter,
    sourceFeature: feature,
    sourceArtistContext: artistContext,
    sourceRefId: refIdMap[feature],
    sourceRefType: refMap[feature],
  };
}

const SAMPLE_LOGS: { d: number; h: number; m: number; f: RftSourceFeature; delta: number; bal: number }[] = [
  { d: 0, h: 14, m: 0, f: 'QUEST_REWARD', delta: 5, bal: 25 },
  { d: 0, h: 11, m: 1, f: 'GP_EXCHANGE', delta: 1, bal: 26 },
  { d: 0, h: 9, m: 2, f: 'RAFFLE_ENTRY', delta: -1, bal: 25 },
  { d: 0, h: 12, m: 3, f: 'GAME_REWARD', delta: 2, bal: 24 },          // PM 정답 보상
  { d: 1, h: 23, m: 4, f: 'QUEST_REWARD', delta: 5, bal: 22 },
  { d: 1, h: 23, m: 5, f: 'BIVE_BENEFIT', delta: 3, bal: 20 },
  { d: 1, h: 21, m: 6, f: 'RAFFLE_ENTRY', delta: -1, bal: 18 },
  { d: 2, h: 17, m: 7, f: 'QUEST_REWARD', delta: 5, bal: 17 },
  { d: 2, h: 17, m: 8, f: 'GP_EXCHANGE', delta: 1, bal: 12 },
  { d: 2, h: 17, m: 9, f: 'DUK_RANKING_REWARD', delta: 10, bal: 11 },
  { d: 2, h: 20, m: 5, f: 'GAME_REWARD', delta: 3, bal: 14 },          // ST 생존자 보상 (사이클 5 신규)
  { d: 3, h: 16, m: 0, f: 'QUEST_REWARD', delta: 3, bal: 10 },
  { d: 3, h: 15, m: 1, f: 'BIVE_BENEFIT', delta: 5, bal: 7 },
  { d: 3, h: 15, m: 2, f: 'RAFFLE_ENTRY', delta: -1, bal: 2 },
  { d: 3, h: 22, m: 3, f: 'GAME_REWARD', delta: 1, bal: 3 },           // ST 탈락자 응모권 (사이클 5 신규)
  { d: 4, h: 14, m: 3, f: 'GP_EXCHANGE', delta: 2, bal: 3 },
  { d: 4, h: 12, m: 4, f: 'GAME_REWARD', delta: 1, bal: 1 },           // PM 정답 보상
];

// 12명 회원 × 약 10건 = 약 120건 변동 로그
export const rftLogs: RftLog[] = (() => {
  const out: RftLog[] = [];
  let id = 1;
  for (let mi = 0; mi < 12; mi++) {
    SAMPLE_LOGS.forEach((s) => {
      out.push(makeLog(id++, s.d, s.h, mi, s.f, s.delta, s.bal + (mi % 5)));
    });
  }
  return out.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
})();

// 집계
export const rftStats = {
  totalIssued: rftLogs.filter((l) => l.delta > 0).reduce((s, l) => s + l.delta, 0),
  totalUsed: -rftLogs.filter((l) => l.delta < 0).reduce((s, l) => s + l.delta, 0),
  totalHeld: rftLogs.reduce((s, l) => s + l.delta, 0),
};

// 발급 출처(EARN) 5종만 분포 — 사용(USE) 출처는 별도 함수로 분리하여 혼동 방지
const EARN_SOURCES: RftSourceFeature[] = sourcePolicies
  .filter((p) => p.category === 'EARN')
  .map((p) => p.code);
const USE_SOURCES: RftSourceFeature[] = sourcePolicies
  .filter((p) => p.category === 'USE')
  .map((p) => p.code);

// 출처별 발급 분포 (이번 달 = 전체 mock 기간) — EARN 카테고리만
export function getSourceDistribution(): Record<string, number> {
  const map: Record<string, number> = {};
  EARN_SOURCES.forEach((c) => { map[c] = 0; });
  rftLogs.forEach((l) => {
    if (l.delta > 0 && map[l.sourceFeature] !== undefined) {
      map[l.sourceFeature] += l.delta;
    }
  });
  return map;
}

// 출처별 사용 분포 — USE 카테고리만 (현재 RAFFLE_ENTRY 1종)
export function getUseDistribution(): Record<string, number> {
  const map: Record<string, number> = {};
  USE_SOURCES.forEach((c) => { map[c] = 0; });
  rftLogs.forEach((l) => {
    if (l.delta < 0 && map[l.sourceFeature] !== undefined) {
      map[l.sourceFeature] += -l.delta;
    }
  });
  return map;
}

