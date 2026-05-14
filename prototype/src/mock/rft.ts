// 응모권(RFT) MVP — [CEB-BO-010] v1.1 SSOT
// 라이프사이클 3상태(ISSUED/HELD/USED) + 출처 6종 + 발급 출처 메타

export type RftStatus = 'ISSUED' | 'HELD' | 'USED';

export type RftSourceFeature =
  | 'FANQUEST_REWARD'
  | 'RAFFLE_ENTRY'
  | 'GP_EXCHANGE'
  | 'DAILY_MISSION'
  | 'BIVE_BENEFIT';

export type RftSourceRefType =
  | 'QUEST'
  | 'RAFFLE'
  | 'EXCHANGE'
  | 'MISSION'
  | 'BIVE_TOKEN';

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
}

export const sourcePolicies: SourceMeta[] = [
  {
    code: 'FANQUEST_REWARD',
    nameKO: '팬퀘스트 보상',
    nameEN: 'Fan Quest Reward',
    nameJP: 'ファンクエスト報酬',
    category: 'EARN',
    refType: 'QUEST',
    active: true,
    issueRule: 'Quest별 정책 (1~10장)',
    lastUpdatedBy: 'nill',
    lastUpdatedAt: '2026.05.04 15:38',
  },
  {
    code: 'RAFFLE_ENTRY',
    nameKO: 'Raffle 응모',
    nameEN: 'Raffle Entry',
    nameJP: 'Raffle 応募',
    category: 'USE',
    refType: 'RAFFLE',
    active: true,
    issueRule: 'Raffle별 정책 (응모 비용 -1장)',
    lastUpdatedBy: 'nill',
    lastUpdatedAt: '2026.04.27 12:35',
  },
  {
    code: 'GP_EXCHANGE',
    nameKO: 'GP → 응모권 교환',
    nameEN: 'GP Exchange',
    nameJP: 'GP 交換',
    category: 'EARN',
    refType: 'EXCHANGE',
    active: true,
    gpRate: 25,
    issueRule: '환율: 25 GP / 1장 (전역, 일일 한도 무제한)',
    lastUpdatedBy: 'nill',
    lastUpdatedAt: '2026.04.27 12:35',
  },
  {
    code: 'DAILY_MISSION',
    nameKO: '일일미션 보상',
    nameEN: 'Daily Mission',
    nameJP: 'デイリーミッション',
    category: 'EARN',
    refType: 'MISSION',
    active: true,
    issueRule: '미션별 정책 (1~3장)',
    lastUpdatedBy: 'nill',
    lastUpdatedAt: '2026.04.09 16:41',
  },
  {
    code: 'BIVE_BENEFIT',
    nameKO: 'BIVE 보유 혜택',
    nameEN: 'BIVE Benefit',
    nameJP: 'BIVE 保有特典',
    category: 'EARN',
    refType: 'BIVE_TOKEN',
    active: true,
    issueRule: '혜택별 정책 (N장 / 주기)',
    lastUpdatedBy: 'nill',
    lastUpdatedAt: '2026.02.24 14:15',
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

const NICKNAMES = [
  'luna_jiyun_lee', 'ghksdud', 'nurune', 'sara', 'sxlvxr',
  'gaon3472', 'seul', 'yoonseo', 'pooo', 'xxxx',
  'ttee', 'jisoo_kr', 'haru.ux', 'rosie', 'bumin22',
  'choco', 'ddal', 'eunha', 'fox.lily', 'gguri',
];

const ARTISTS: ('V01D' | 'iKON' | 'CELEBUS' | null)[] = ['V01D', 'iKON', 'CELEBUS', null];

function pickArtistByFeature(feature: RftSourceFeature, idx: number): 'V01D' | 'iKON' | 'CELEBUS' | null {
  // GP_EXCHANGE는 전역(NULL), 그 외는 아티스트 컨텍스트
  if (feature === 'GP_EXCHANGE') return null;
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
    FANQUEST_REWARD: 'QUEST',
    RAFFLE_ENTRY: 'RAFFLE',
    GP_EXCHANGE: 'EXCHANGE',
    DAILY_MISSION: 'MISSION',
    BIVE_BENEFIT: 'BIVE_TOKEN',
  };
  const refIdMap: Record<RftSourceFeature, string> = {
    FANQUEST_REWARD: `Quest #${44 - (id % 8)}`,
    RAFFLE_ENTRY: `Raffle #${12 - (id % 5)}`,
    GP_EXCHANGE: `Tx ${100000 + id}`,
    DAILY_MISSION: `Mission ${(id % 5) + 1}`,
    BIVE_BENEFIT: `BIVE #${3000 + (id % 500)}`,
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
  { d: 0, h: 14, m: 0, f: 'FANQUEST_REWARD', delta: 5, bal: 25 },
  { d: 0, h: 11, m: 1, f: 'GP_EXCHANGE', delta: 1, bal: 26 },
  { d: 0, h: 9, m: 2, f: 'RAFFLE_ENTRY', delta: -1, bal: 25 },
  { d: 0, h: 12, m: 3, f: 'DAILY_MISSION', delta: 2, bal: 24 },
  { d: 1, h: 23, m: 4, f: 'FANQUEST_REWARD', delta: 5, bal: 22 },
  { d: 1, h: 23, m: 5, f: 'BIVE_BENEFIT', delta: 3, bal: 20 },
  { d: 1, h: 21, m: 6, f: 'RAFFLE_ENTRY', delta: -1, bal: 18 },
  { d: 2, h: 17, m: 7, f: 'FANQUEST_REWARD', delta: 5, bal: 17 },
  { d: 2, h: 17, m: 8, f: 'GP_EXCHANGE', delta: 1, bal: 12 },
  { d: 2, h: 17, m: 9, f: 'DAILY_MISSION', delta: 1, bal: 11 },
  { d: 3, h: 16, m: 0, f: 'FANQUEST_REWARD', delta: 3, bal: 10 },
  { d: 3, h: 15, m: 1, f: 'BIVE_BENEFIT', delta: 5, bal: 7 },
  { d: 3, h: 15, m: 2, f: 'RAFFLE_ENTRY', delta: -1, bal: 2 },
  { d: 4, h: 14, m: 3, f: 'GP_EXCHANGE', delta: 2, bal: 3 },
  { d: 4, h: 12, m: 4, f: 'FANQUEST_REWARD', delta: 1, bal: 1 },
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

