// [CEB-BO-ART-401] v1.7 정합
// 덕력(DUK) — 아티스트 그룹 단위 독립 관리. 그룹별 시즌(1개월 단위)·획득/사용 ledger.
// 출처 enum은 [CEB-000] §5.2 v5.6 보상 매트릭스 활동 8종 + §3.2 사용처 2종 SSOT 정합.
// v1.7 — 시즌명 다국어(ko/en/ja) / 강제 종료(closeType) / 보상 구간 대상명·아이콘 추가

export type DukSeasonStatus = '예정' | '진행중' | '종료';
export type DukLedgerType = '획득' | '사용';

// 다국어 라벨 (LangField 패턴 정합 — KO/EN/JA)
export interface DukLangText {
  ko: string;
  en: string;
  ja: string;
}

export interface DukSeason {
  id: number;
  artistGroupId: number;
  artistGroupName: string;
  name: DukLangText; // v1.7 — string → DukLangText (ko/en/ja 다국어)
  startAt: string; // YYYY.MM.DD HH:mm
  endAt: string; // 시작일 + 1개월 자동 산출 (시즌 = 1개월 단위)
  status: DukSeasonStatus;
  closeType?: 'auto' | 'forced'; // v1.7 — 종료 구분. 'forced'=강제종료(미지급). 미설정=자연종료
}

export interface DukLedger {
  id: number;
  occurredAt: string; // YYYY.MM.DD HH:mm:ss (초 단위까지 — 동점 시 먼저 도달 우선 판정용)
  artistGroupId: number;
  artistGroupName: string;
  memberId: string; // 회원 id (mock/members.ts와 정합 — string)
  memberNickname: string;
  type: DukLedgerType;
  source: string; // 한국어
  amount: number; // 양수
  balanceAfter: number;
  seasonId?: number; // 시즌 귀속 (월 prefix가 아닌 시즌 id로 집계)
}

// v1.5 — 월별 보상 매트릭스 / v1.6 — 1구간 = 복수 상품 nested
export type DukRewardTargetType = '등수' | '퍼센트' | '등수범위';

export type DukPrizeType = '배송 수령' | '현장 수령' | 'BIVE NFT' | '응모권' | '덕력';

interface DukPrizeBase {
  id: number;
  title: DukLangText;
}

export interface DukPrizeShipping extends DukPrizeBase {
  type: '배송 수령';
  deliveryDeadlineDt: string; // YYYY-MM-DD
  deliveryDeadlineTime: string; // HH:mm
  deliveryFormUrl: string;
}

export interface DukPrizePickup extends DukPrizeBase {
  type: '현장 수령';
  pickupStartDt: string;
  pickupEndDt: string;
  openTime: string;
  closeTime: string;
  location: DukLangText;
  items: DukLangText;
}

export interface DukPrizeBive extends DukPrizeBase {
  type: 'BIVE NFT';
  mintingEventId: number; // RAFFLE_MINTING_EVENTS.id
}

export interface DukPrizeTicket extends DukPrizeBase {
  type: '응모권';
  count: number;
}

export interface DukPrizeDuk extends DukPrizeBase {
  type: '덕력';
  amount: number;
}

export type DukRewardPrize =
  | DukPrizeShipping
  | DukPrizePickup
  | DukPrizeBive
  | DukPrizeTicket
  | DukPrizeDuk;

export interface DukRewardTier {
  id: number;
  targetType: DukRewardTargetType;
  targetValue: string; // 등수=숫자 / 퍼센트=숫자 / 등수범위=N-M
  targetName: DukLangText; // v1.7 — 보상 구간 대상명 (한/영/일, 각 30자, 필수)
  iconSrc: string; // v1.7 — 대상 아이콘 이미지 파일명 (필수)
  prizes: DukRewardPrize[]; // v1.6 — 1구간 = 복수 상품. 최소 1개 필수
}

// 시즌당 1건의 보상 세트. 시즌 = 1개월, 시즌당 1회 정산 (미팅 정합 2026-06-02).
export interface DukSeasonReward {
  id: number;
  seasonId: number;
  tiers: DukRewardTier[];
  settledAt?: string; // 정산 완료 일시 (YYYY.MM.DD HH:mm) — 설정 시 잠금
}

// 활성 그룹 5종 (mock/artists.ts와 정합)
export const dukActiveGroups: { id: number; name: string }[] = [
  { id: 1, name: '언더라이트 (UNDER:LIGHT)' },
  { id: 2, name: 'V01D' },
  { id: 3, name: 'CELEBUS' },
  { id: 4, name: 'MADEIN' },
  { id: 5, name: 'iKON' },
];

// 출처 enum ([CEB-000] v5.6 정합 — §5.2 활동 매트릭스 8종 + §3.2 사용처 2종)
export const dukSourcesEarn = [
  '출석 체크', // T1
  '응모권 사용', // T1
  '일일 미션', // T2
  '게임 참여', // T2 (PM·ST 공통)
  'SNS 공유', // T2
  'Quest 완료', // T3
  '기억저장소 업로드', // T3
  '디지털 굿즈 획득', // T3
] as const;
export const dukSourcesSpend = ['서포트 응원', '독점 콘텐츠 해금'] as const;

// ─────────────────────────────────────────────
// 덕력 지급 정책 ([CEB-BO-ART-401-POLICY] / [CEB-000] §5.2 아티스트별 활동별 지급 정책)
// 자동 적립 활동만 정책 매트릭스 대상 (Quest 완료·게임 참여는 콘텐츠별 직접 입력 → 제외)
// 신규 아티스트 생성 시 권장값으로 기본 정책 자동 생성 → '미설정' 상태 부재
// ─────────────────────────────────────────────
export type DukPolicyTier = 'T1' | 'T2' | 'T3' | '보너스';

export interface DukPolicyActivity {
  key: string;
  label: string;
  tier: DukPolicyTier;
  recommended: number; // [CEB-000] §5.2 권장값
}

// 정책 매트릭스 대상 자동 적립 활동 9종 (권장값)
export const DUK_POLICY_ACTIVITIES: DukPolicyActivity[] = [
  { key: 'attendance', label: '출석 체크', tier: 'T1', recommended: 5 },
  { key: 'ticket_use', label: '응모권 사용', tier: 'T1', recommended: 5 },
  { key: 'daily_mission', label: '일일 미션 모두 완료', tier: 'T2', recommended: 25 },
  { key: 'sns_share', label: 'SNS 공유', tier: 'T2', recommended: 25 },
  { key: 'memory_upload', label: '기억저장소 업로드', tier: 'T3', recommended: 75 },
  { key: 'goods_acquire', label: '디지털 굿즈 획득', tier: 'T3', recommended: 75 },
  { key: 'streak_7', label: '스트릭 7일', tier: '보너스', recommended: 200 },
  { key: 'streak_14', label: '스트릭 14일', tier: '보너스', recommended: 500 },
  { key: 'streak_30', label: '스트릭 30일', tier: '보너스', recommended: 1000 },
];

export interface DukPolicyRow {
  activityKey: string;
  duk: number; // 지급 덕력 (0 이상 정수)
  enabled: boolean; // 사용 여부 (미사용 시 미지급)
}

export interface DukGroupPolicy {
  groupId: number;
  rows: DukPolicyRow[];
  updatedAt: string;
  updatedBy: string;
}

// 신규 아티스트 기본 정책 생성 (권장값·전부 사용 ON) — 미설정 상태 부재
export function createDefaultDukPolicy(groupId: number): DukGroupPolicy {
  return {
    groupId,
    rows: DUK_POLICY_ACTIVITIES.map((a) => ({ activityKey: a.key, duk: a.recommended, enabled: true })),
    updatedAt: '2026.06.10 14:30',
    updatedBy: 'nill',
  };
}

// 그룹별 정책 시드 — 전 활성 그룹이 권장값 기본 정책 보유(미설정 없음)
export const dukPolicies: DukGroupPolicy[] = dukActiveGroups.map((g) => createDefaultDukPolicy(g.id));

export function getDukPolicy(groupId: number): DukGroupPolicy {
  return dukPolicies.find((p) => p.groupId === groupId) ?? createDefaultDukPolicy(groupId);
}

// ─────────────────────────────────────────────
// 시즌 mock — 시즌 = 1개월 단위 (미팅 정합 2026-06-02). 종료일 = 시작일 + 1개월. 시즌당 1회 정산.
// v1.7 — name: DukLangText (ko/en/ja). iKON 2026.05 시즌(501)을 강제 종료 데모로 지정.
// ─────────────────────────────────────────────
export const dukSeasons: DukSeason[] = [
  // 언더라이트
  {
    id: 103, artistGroupId: 1, artistGroupName: '언더라이트 (UNDER:LIGHT)',
    name: { ko: '언더라이트 2025.12 시즌', en: 'UNDER:LIGHT 2025.12 Season', ja: 'アンダーライト 2025.12 シーズン' },
    startAt: '2025.12.01 00:00', endAt: '2025.12.31 23:59', status: '종료',
  },
  {
    id: 101, artistGroupId: 1, artistGroupName: '언더라이트 (UNDER:LIGHT)',
    name: { ko: '언더라이트 2026.05 시즌', en: 'UNDER:LIGHT 2026.05 Season', ja: 'アンダーライト 2026.05 シーズン' },
    startAt: '2026.05.01 00:00', endAt: '2026.05.31 23:59', status: '종료',
  },
  {
    id: 102, artistGroupId: 1, artistGroupName: '언더라이트 (UNDER:LIGHT)',
    name: { ko: '언더라이트 2026.06 시즌', en: 'UNDER:LIGHT 2026.06 Season', ja: 'アンダーライト 2026.06 シーズン' },
    startAt: '2026.06.01 00:00', endAt: '2026.06.30 23:59', status: '진행중',
  },
  // V01D
  {
    id: 204, artistGroupId: 2, artistGroupName: 'V01D',
    name: { ko: 'V01D 2025.12 시즌', en: 'V01D 2025.12 Season', ja: 'V01D 2025.12 シーズン' },
    startAt: '2025.12.01 00:00', endAt: '2025.12.31 23:59', status: '종료',
  },
  {
    id: 201, artistGroupId: 2, artistGroupName: 'V01D',
    name: { ko: 'V01D 2026.05 시즌', en: 'V01D 2026.05 Season', ja: 'V01D 2026.05 シーズン' },
    startAt: '2026.05.01 00:00', endAt: '2026.05.31 23:59', status: '종료',
  },
  {
    id: 202, artistGroupId: 2, artistGroupName: 'V01D',
    name: { ko: 'V01D 2026.06 시즌', en: 'V01D 2026.06 Season', ja: 'V01D 2026.06 シーズン' },
    startAt: '2026.06.01 00:00', endAt: '2026.06.30 23:59', status: '진행중',
  },
  {
    id: 203, artistGroupId: 2, artistGroupName: 'V01D',
    name: { ko: 'V01D 2026.07 시즌', en: 'V01D 2026.07 Season', ja: 'V01D 2026.07 シーズン' },
    startAt: '2026.07.01 00:00', endAt: '2026.07.31 23:59', status: '예정',
  },
  // CELEBUS
  {
    id: 301, artistGroupId: 3, artistGroupName: 'CELEBUS',
    name: { ko: 'CELEBUS 2026.06 시즌', en: 'CELEBUS 2026.06 Season', ja: 'CELEBUS 2026.06 シーズン' },
    startAt: '2026.06.01 00:00', endAt: '2026.06.30 23:59', status: '진행중',
  },
  // MADEIN
  {
    id: 401, artistGroupId: 4, artistGroupName: 'MADEIN',
    name: { ko: 'MADEIN 2026.06 시즌', en: 'MADEIN 2026.06 Season', ja: 'MADEIN 2026.06 シーズン' },
    startAt: '2026.06.01 00:00', endAt: '2026.06.30 23:59', status: '진행중',
  },
  // iKON
  {
    id: 501, artistGroupId: 5, artistGroupName: 'iKON',
    name: { ko: 'iKON 2026.05 시즌', en: 'iKON 2026.05 Season', ja: 'iKON 2026.05 シーズン' },
    startAt: '2026.05.01 00:00', endAt: '2026.05.31 23:59', status: '종료',
    closeType: 'forced', // v1.7 — 강제 종료 데모 시즌 (보상 미지급)
  },
  {
    id: 502, artistGroupId: 5, artistGroupName: 'iKON',
    name: { ko: 'iKON 2026.06 시즌', en: 'iKON 2026.06 Season', ja: 'iKON 2026.06 シーズン' },
    startAt: '2026.06.01 00:00', endAt: '2026.06.30 23:59', status: '진행중',
  },
];

// 헬퍼: 강제 종료 시즌 여부 (보상 미지급·미정산)
export function isSeasonForcedClosed(seasonId: number): boolean {
  return dukSeasons.find((s) => s.id === seasonId)?.closeType === 'forced';
}

// ─────────────────────────────────────────────
// 회원 풀 (덕력 활동 회원 50명) — mock/members.ts NICKNAMES + user_{idNum} 패턴 정합
// 처음 8명은 기존 핵심 회원 (id=578~571), 9~50명은 신규 (id=570~529)
// ─────────────────────────────────────────────
const dukMembers: { id: string; nickname: string }[] = [
  // 핵심 8명 (NICKNAMES[0~7])
  { id: '578', nickname: 'in.mycosmos' },
  { id: '577', nickname: 'qqqaas' },
  { id: '576', nickname: 'luna_jiyun_lee' },
  { id: '575', nickname: 'dhyem' },
  { id: '574', nickname: 'jaea306122' },
  { id: '573', nickname: 'manju' },
  { id: '572', nickname: 'sally410504' },
  { id: '571', nickname: 'sohyun0105' },
  // NICKNAMES[8]은 빈 값 → user_570 fallback
  { id: '570', nickname: 'user_570' },
  // NICKNAMES[9~24] (16명)
  { id: '569', nickname: 'suu.b1n' },
  { id: '568', nickname: 'mimi' },
  { id: '567', nickname: 'jjeom5jjang' },
  { id: '566', nickname: 'effieee02' },
  { id: '565', nickname: 'xxxx' },
  { id: '564', nickname: 'rdy0602' },
  { id: '563', nickname: 'lena' },
  { id: '562', nickname: 'xbdjeui' },
  { id: '561', nickname: 'c.s.k' },
  { id: '560', nickname: 'yoon' },
  { id: '559', nickname: 'hello17' },
  { id: '558', nickname: 'ttee' },
  { id: '557', nickname: 'celebus' },
  { id: '556', nickname: 'joonk85' },
  { id: '555', nickname: 'teddy2' },
  { id: '554', nickname: 'mice' },
  // user_{idNum} 패턴 (25명) — id=553~529
  { id: '553', nickname: 'user_553' },
  { id: '552', nickname: 'user_552' },
  { id: '551', nickname: 'user_551' },
  { id: '550', nickname: 'user_550' },
  { id: '549', nickname: 'user_549' },
  { id: '548', nickname: 'user_548' },
  { id: '547', nickname: 'user_547' },
  { id: '546', nickname: 'user_546' },
  { id: '545', nickname: 'user_545' },
  { id: '544', nickname: 'user_544' },
  { id: '543', nickname: 'user_543' },
  { id: '542', nickname: 'user_542' },
  { id: '541', nickname: 'user_541' },
  { id: '540', nickname: 'user_540' },
  { id: '539', nickname: 'user_539' },
  { id: '538', nickname: 'user_538' },
  { id: '537', nickname: 'user_537' },
  { id: '536', nickname: 'user_536' },
  { id: '535', nickname: 'user_535' },
  { id: '534', nickname: 'user_534' },
  { id: '533', nickname: 'user_533' },
  { id: '532', nickname: 'user_532' },
  { id: '531', nickname: 'user_531' },
  { id: '530', nickname: 'user_530' },
  { id: '529', nickname: 'user_529' },
];

// ─────────────────────────────────────────────
// ledger mock (v1.1 — seasonId 1년 시즌으로 매핑)
// occurredAt은 그대로 유지 (다양한 월 분포로 월 단위 조회 의미 보존)
// ─────────────────────────────────────────────
function buildLedger(): DukLedger[] {
  const rows: DukLedger[] = [];
  let id = 1;
  const balance: Record<string, number> = {};
  const k = (mid: string, gid: number) => `${mid}-${gid}`;

  // occurredAt이 "YYYY.MM.DD HH:mm" (분 단위)면 행별 고유 초(:SS)를 자동 부여.
  // 동점 시 "먼저 도달한 회원 우선" 판정을 위해 초 단위 정밀도가 필요 (미팅 정합 2026-06-02).
  const withSeconds = (occurredAt: string): string => {
    if (/\d{2}:\d{2}:\d{2}$/.test(occurredAt)) return occurredAt; // 이미 초 포함
    const sec = String(id % 60).padStart(2, '0'); // 행 id 기반 결정적 초 부여 (고유성 확보)
    return `${occurredAt}:${sec}`;
  };

  const push = (
    occurredAtRaw: string,
    seasonId: number | undefined,
    groupId: number,
    groupName: string,
    memberIdx: number,
    type: DukLedgerType,
    source: string,
    amount: number,
  ) => {
    const m = dukMembers[memberIdx];
    const key = k(m.id, groupId);
    const prev = balance[key] ?? 0;
    // v1.8 — 사용 타입 + 잔액 미달이면 행 skip (음수 잔액 노출 방지)
    if (type === '사용' && prev < amount) return;
    const next = type === '획득' ? prev + amount : prev - amount;
    balance[key] = next;
    const occurredAt = withSeconds(occurredAtRaw);
    rows.push({
      id: id++,
      occurredAt,
      artistGroupId: groupId,
      artistGroupName: groupName,
      memberId: m.id,
      memberNickname: m.nickname,
      type,
      source,
      amount,
      balanceAfter: next,
      seasonId,
    });
  };

  // ─ 언더라이트 2026 시즌 (102)
  push('2026.04.05 10:12', 102, 1, '언더라이트 (UNDER:LIGHT)', 0, '획득', 'Quest 완료', 120);
  push('2026.04.08 14:30', 102, 1, '언더라이트 (UNDER:LIGHT)', 1, '획득', 'Quest 완료', 90);
  push('2026.04.12 21:05', 102, 1, '언더라이트 (UNDER:LIGHT)', 0, '획득', '디지털 굿즈 획득', 200);
  push('2026.04.20 09:00', 102, 1, '언더라이트 (UNDER:LIGHT)', 2, '획득', '응모권 사용', 30);
  push('2026.04.25 18:45', 102, 1, '언더라이트 (UNDER:LIGHT)', 0, '사용', '서포트 응원', 100);
  push('2026.05.02 12:20', 102, 1, '언더라이트 (UNDER:LIGHT)', 3, '획득', '기억저장소 업로드', 500);
  push('2026.05.10 16:30', 102, 1, '언더라이트 (UNDER:LIGHT)', 1, '사용', '서포트 응원', 50);
  push('2026.05.15 22:10', 102, 1, '언더라이트 (UNDER:LIGHT)', 0, '획득', '일일 미션', 150);
  push('2026.05.20 09:55', 102, 1, '언더라이트 (UNDER:LIGHT)', 2, '획득', '출석 체크', 80);
  push('2026.05.25 19:00', 102, 1, '언더라이트 (UNDER:LIGHT)', 0, '사용', '독점 콘텐츠 해금', 200);

  // ─ V01D 2026 시즌 (202)
  push('2026.04.02 11:00', 202, 2, 'V01D', 0, '획득', 'Quest 완료', 100);
  push('2026.04.05 13:20', 202, 2, 'V01D', 4, '획득', '게임 참여', 80);
  push('2026.04.10 19:40', 202, 2, 'V01D', 4, '획득', '디지털 굿즈 획득', 350);
  push('2026.04.18 22:15', 202, 2, 'V01D', 5, '획득', '응모권 사용', 40);
  push('2026.04.22 10:30', 202, 2, 'V01D', 0, '사용', '서포트 응원', 150);
  push('2026.05.01 15:00', 202, 2, 'V01D', 6, '획득', '디지털 굿즈 획득', 800);
  push('2026.05.05 18:25', 202, 2, 'V01D', 4, '사용', '서포트 응원', 70);
  push('2026.05.12 21:50', 202, 2, 'V01D', 5, '획득', 'SNS 공유', 130);
  push('2026.05.18 09:10', 202, 2, 'V01D', 6, '획득', '기억저장소 업로드', 250);
  push('2026.05.22 14:05', 202, 2, 'V01D', 4, '사용', '독점 콘텐츠 해금', 300);
  push('2026.05.26 17:30', 202, 2, 'V01D', 0, '획득', 'Quest 완료', 90);

  // ─ CELEBUS 데뷔 시즌 (301)
  push('2026.05.02 09:00', 301, 3, 'CELEBUS', 7, '획득', '디지털 굿즈 획득', 500);
  push('2026.05.06 12:00', 301, 3, 'CELEBUS', 0, '획득', 'Quest 완료', 60);
  push('2026.05.10 14:30', 301, 3, 'CELEBUS', 1, '획득', '일일 미션', 70);
  push('2026.05.14 16:00', 301, 3, 'CELEBUS', 7, '사용', '서포트 응원', 200);
  push('2026.05.18 18:30', 301, 3, 'CELEBUS', 2, '획득', '응모권 사용', 25);
  push('2026.05.22 20:00', 301, 3, 'CELEBUS', 0, '획득', 'Quest 완료', 300);
  push('2026.05.25 21:30', 301, 3, 'CELEBUS', 7, '사용', '서포트 응원', 50);

  // ─ MADEIN 2026 시즌 (401)
  push('2026.02.05 10:00', 401, 4, 'MADEIN', 3, '획득', 'Quest 완료', 100);
  push('2026.02.20 14:00', 401, 4, 'MADEIN', 3, '획득', '디지털 굿즈 획득', 400);
  push('2026.03.10 16:00', 401, 4, 'MADEIN', 5, '획득', '게임 참여', 80);
  push('2026.03.25 18:00', 401, 4, 'MADEIN', 3, '사용', '서포트 응원', 250);
  push('2026.04.15 20:00', 401, 4, 'MADEIN', 6, '획득', '디지털 굿즈 획득', 600);
  push('2026.04.30 22:00', 401, 4, 'MADEIN', 5, '획득', '기억저장소 업로드', 90);
  push('2026.05.08 09:30', 401, 4, 'MADEIN', 3, '획득', '응모권 사용', 30);
  push('2026.05.15 11:00', 401, 4, 'MADEIN', 6, '사용', '서포트 응원', 200);
  push('2026.05.22 13:30', 401, 4, 'MADEIN', 5, '사용', '독점 콘텐츠 해금', 60);

  // ─ iKON 2026 시즌 (502) — 2026.04~05 활동
  push('2026.04.03 10:00', 502, 5, 'iKON', 4, '획득', 'Quest 완료', 110);
  push('2026.04.08 13:00', 502, 5, 'iKON', 6, '획득', 'SNS 공유', 85);
  push('2026.04.15 16:00', 502, 5, 'iKON', 4, '획득', '디지털 굿즈 획득', 300);
  push('2026.04.22 19:00', 502, 5, 'iKON', 7, '획득', '응모권 사용', 45);
  push('2026.04.28 21:00', 502, 5, 'iKON', 4, '사용', '서포트 응원', 180);
  push('2026.05.05 10:30', 502, 5, 'iKON', 6, '획득', 'Quest 완료', 700);
  push('2026.05.12 13:00', 502, 5, 'iKON', 7, '사용', '서포트 응원', 65);
  push('2026.05.18 15:30', 502, 5, 'iKON', 4, '획득', '출석 체크', 120);
  push('2026.05.25 18:00', 502, 5, 'iKON', 6, '획득', '디지털 굿즈 획득', 280);

  // ─ V01D 2025 시즌 (201, 종료)
  push('2025.10.10 10:00', 201, 2, 'V01D', 0, '획득', 'Quest 완료', 100);
  push('2025.10.20 14:00', 201, 2, 'V01D', 4, '획득', '디지털 굿즈 획득', 250);
  push('2025.11.05 16:00', 201, 2, 'V01D', 5, '획득', '기억저장소 업로드', 400);
  push('2025.11.20 18:00', 201, 2, 'V01D', 4, '사용', '서포트 응원', 200);
  push('2025.12.10 10:00', 201, 2, 'V01D', 0, '획득', '응모권 사용', 60);

  // ─ 언더라이트 2025 시즌 (101, 종료)
  push('2025.10.15 10:00', 101, 1, '언더라이트 (UNDER:LIGHT)', 0, '획득', 'Quest 완료', 90);
  push('2025.11.10 14:00', 101, 1, '언더라이트 (UNDER:LIGHT)', 2, '획득', '디지털 굿즈 획득', 300);
  push('2025.12.05 16:00', 101, 1, '언더라이트 (UNDER:LIGHT)', 3, '획득', '기억저장소 업로드', 500);
  push('2025.12.20 18:00', 101, 1, '언더라이트 (UNDER:LIGHT)', 0, '사용', '서포트 응원', 150);

  // ─ iKON 2025 시즌 (501, 강제 종료 데모)
  // 강제 종료 시즌이므로 ledger 활동은 존재하나 dukSeasonRewards에 settledAt 없음 → 지급 내역 0건
  push('2025.10.20 10:00', 501, 5, 'iKON', 4, '획득', 'Quest 완료', 95);
  push('2025.11.15 14:00', 501, 5, 'iKON', 6, '획득', '디지털 굿즈 획득', 280);
  push('2025.12.10 16:00', 501, 5, 'iKON', 7, '획득', '디지털 굿즈 획득', 450);
  push('2025.12.28 18:00', 501, 5, 'iKON', 4, '사용', '서포트 응원', 220);

  // ─────────────────────────────────────────────
  // 신규 42명 (idx 8~49) 자동 생성 — 시드 RNG로 그룹·시기·출처·금액 분포
  // mock/members.ts 시드 패턴 정합. 핵심 8명은 위 hard-coded ledger 유지
  // ─────────────────────────────────────────────
  const earnSources: { source: string; tier: number }[] = [
    { source: '출석 체크', tier: 5 },
    { source: '응모권 사용', tier: 5 },
    { source: '일일 미션', tier: 25 },
    { source: '게임 참여', tier: 25 },
    { source: 'SNS 공유', tier: 25 },
    { source: 'Quest 완료', tier: 75 },
    { source: '기억저장소 업로드', tier: 75 },
    { source: '디지털 굿즈 획득', tier: 75 },
  ];
  const spendSources = ['서포트 응원', '독점 콘텐츠 해금'];

  function seededRng(seed: number) {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }
  const pad2 = (n: number) => String(n).padStart(2, '0');

  function findSeasonId(groupId: number, occurredAt: string): number | undefined {
    return dukSeasons.find(
      (s) => s.artistGroupId === groupId && s.startAt <= occurredAt && occurredAt <= s.endAt,
    )?.id;
  }

  // 신규 회원 idx 8~49 (총 42명)
  for (let mi = 8; mi < dukMembers.length; mi++) {
    const r = seededRng(2000 + mi);
    // 회원당 1~3개 그룹 활동
    const groupCount = 1 + Math.floor(r() * 3);
    const groupIdxList = new Set<number>();
    while (groupIdxList.size < groupCount) {
      groupIdxList.add(Math.floor(r() * dukActiveGroups.length));
    }
    for (const gi of groupIdxList) {
      const group = dukActiveGroups[gi];
      // 그룹당 2~6개 활동
      const actCount = 2 + Math.floor(r() * 5);
      for (let ai = 0; ai < actCount; ai++) {
        const isEarn = r() > 0.18; // 82% 획득
        // 시즌 = 1개월 (미팅 정합). 거래 일시를 시즌 존재 월에 분포시켜 시즌 매칭률 확보.
        // 2026.06(진행중)·2026.05(종료) 중심 + 소수 2026.04(시즌 없음 "—") + 2025.12(전년도 종료 시즌, 연도 선택 데모)
        let year = 2026;
        let month: number;
        const mr = r();
        if (mr < 0.55) month = 6;
        else if (mr < 0.78) month = 5;
        else if (mr < 0.88) month = 4;
        else { year = 2025; month = 12; }
        const day = 1 + Math.floor(r() * 27);
        const hour = 9 + Math.floor(r() * 12);
        const minute = Math.floor(r() * 60);
        const occurredAt = `${year}.${pad2(month)}.${pad2(day)} ${pad2(hour)}:${pad2(minute)}`;

        if (isEarn) {
          const earn = earnSources[Math.floor(r() * earnSources.length)];
          // 티어 기본값에 ±50% 변동
          const amount = Math.max(1, Math.round(earn.tier * (0.5 + r() * 1.5)));
          push(
            occurredAt,
            findSeasonId(group.id, occurredAt),
            group.id,
            group.name,
            mi,
            '획득',
            earn.source,
            amount,
          );
        } else {
          const source = spendSources[Math.floor(r() * spendSources.length)];
          const amount = 30 + Math.floor(r() * 250);
          push(
            occurredAt,
            findSeasonId(group.id, occurredAt),
            group.id,
            group.name,
            mi,
            '사용',
            source,
            amount,
          );
        }
      }
    }
  }

  return rows;
}

export const dukLedger: DukLedger[] = buildLedger();

// ─────────────────────────────────────────────
// 도우미 — 동적 도출
// ─────────────────────────────────────────────

export interface DukRankingRow {
  rank: number;
  memberId: string;
  memberNickname: string;
  totalAmount: number; // 시즌 내 '획득(적립)' 덕력 누적 (사용분 차감 없음)
  lastChangedAt: string; // 최근 획득 변동 일시 (= 최종 누적 도달 시각, 동점 판정용)
}

// 시즌 단위 획득 누적 랭킹 (미팅 정합 2026-06-02)
// - 집계 단위: seasonId (월 prefix가 아닌 시즌 귀속 id)
// - 점수: '획득(적립)' 합계만. '사용(소비)'은 순위에 영향 없음
// - 노출 대상: 시즌 내 획득 > 0 회원
// - 동점 처리: 같은 누적이면 '먼저 도달한 회원'이 상위 (최종 획득 일시 빠른 순). 동순위 없음
export function getDukRankingBySeason(seasonId: number): DukRankingRow[] {
  const earned = dukLedger.filter((l) => l.seasonId === seasonId && l.type === '획득');
  const acc: Record<string, { nickname: string; total: number; firstReachAt: string }> = {};
  for (const l of earned) {
    const cur = acc[l.memberId] ?? {
      nickname: l.memberNickname,
      total: 0,
      firstReachAt: l.occurredAt,
    };
    cur.total += l.amount;
    // 최종 누적에 도달한 시각 = 가장 늦은 획득 일시 (초 단위 정밀도)
    if (l.occurredAt > cur.firstReachAt) cur.firstReachAt = l.occurredAt;
    acc[l.memberId] = cur;
  }
  return Object.entries(acc)
    .map(([mid, v]) => ({
      memberId: mid,
      memberNickname: v.nickname,
      totalAmount: v.total,
      lastChangedAt: v.firstReachAt,
    }))
    .filter((r) => r.totalAmount > 0)
    // 획득 누적 내림차순 → 동점 시 최종 도달 일시 오름차순(먼저 도달 우선)
    .sort((a, b) => b.totalAmount - a.totalAmount || (a.lastChangedAt < b.lastChangedAt ? -1 : 1))
    .map((r, i) => ({ rank: i + 1, ...r }));
}

// 그룹의 ledger occurredAt에서 활동 연도 집합 추출 (오름차순)
export function getActiveYears(groupId: number): number[] {
  const years = new Set<number>();
  for (const l of dukLedger) {
    if (l.artistGroupId !== groupId) continue;
    const y = Number(l.occurredAt.slice(0, 4));
    if (!Number.isNaN(y)) years.add(y);
  }
  return Array.from(years).sort((a, b) => a - b);
}

// 그룹별 시즌 리스트 (시작일 내림차순)
export function getSeasonsByGroup(groupId: number): DukSeason[] {
  return dukSeasons
    .filter((s) => s.artistGroupId === groupId)
    .sort((a, b) => (a.startAt < b.startAt ? 1 : -1));
}

// ─────────────────────────────────────────────
// v1.5 — 월별 보상 매트릭스 / v1.7 — 구간 대상명·아이콘 추가
// ─────────────────────────────────────────────

// 다국어 헬퍼
const lang = (ko: string, en: string, ja: string): DukLangText => ({ ko, en, ja });

// 시즌별 보상 mock — 시즌 = 1개월 단위, 시즌당 1건 (1구간 = 복수 상품 nested 구조).
// settledAt 채워진 entry = 정산 완료(잠금). 상품 5종 모두 1회 이상 등장하도록 분포.
// v1.7 — 강제 종료 시즌(501)은 settledAt 없음 → 지급 내역 0건 (의도된 동작).
export const dukSeasonRewards: DukSeasonReward[] = [
  // V01D 2026.06 시즌 (202) — 진행중·미정산 (수정 가능)
  {
    id: 1, seasonId: 202,
    tiers: [
      {
        id: 1, targetType: '등수', targetValue: '1',
        targetName: lang('최우수 팬', 'Best Fan', 'ベストファン'),
        iconSrc: 'duk-icon-1st.png',
        prizes: [
          { id: 101, type: '배송 수령', title: lang('V01D 사인 앨범', 'V01D Signed Album', 'V01Dサイン入りアルバム'), deliveryDeadlineDt: '2026-07-15', deliveryDeadlineTime: '23:59', deliveryFormUrl: 'https://forms.gle/v01d-202606' },
          { id: 102, type: '덕력', title: lang('1위 보너스 덕력', '1st Bonus Fan Power', '1位ボーナス推し力'), amount: 1000 },
        ],
      },
      {
        id: 2, targetType: '등수범위', targetValue: '2-10',
        targetName: lang('TOP 10 팬', 'TOP 10 Fan', 'TOP 10 ファン'),
        iconSrc: 'duk-icon-top10.png',
        prizes: [
          { id: 103, type: '응모권', title: lang('TOP 10 응모권', 'TOP 10 Tickets', 'TOP10 応募券'), count: 5 },
        ],
      },
      {
        id: 3, targetType: '퍼센트', targetValue: '30',
        targetName: lang('상위 30% 팬', 'Top 30% Fan', '上位30%ファン'),
        iconSrc: 'duk-icon-top30.png',
        prizes: [
          { id: 104, type: 'BIVE NFT', title: lang('V01D 시즌 BIVE', 'V01D Season BIVE', 'V01DシーズンBIVE'), mintingEventId: 24 },
        ],
      },
    ],
  },
  // V01D 2026.05 시즌 (201) — 종료·정산 완료
  {
    id: 2, seasonId: 201, settledAt: '2026.05.31 23:59',
    tiers: [
      {
        id: 11, targetType: '등수', targetValue: '1',
        targetName: lang('최우수 팬', 'Best Fan', 'ベストファン'),
        iconSrc: 'duk-icon-1st.png',
        prizes: [
          { id: 201, type: '배송 수령', title: lang('V01D 사인 앨범', 'V01D Signed Album', 'V01Dサイン入りアルバム'), deliveryDeadlineDt: '2026-06-15', deliveryDeadlineTime: '23:59', deliveryFormUrl: 'https://forms.gle/v01d-202605' },
        ],
      },
      {
        id: 12, targetType: '등수범위', targetValue: '2-10',
        targetName: lang('TOP 10 팬', 'TOP 10 Fan', 'TOP 10 ファン'),
        iconSrc: 'duk-icon-top10.png',
        prizes: [
          { id: 202, type: '응모권', title: lang('TOP 10 응모권', 'TOP 10 Tickets', 'TOP10 応募券'), count: 3 },
        ],
      },
      {
        id: 13, targetType: '퍼센트', targetValue: '30',
        targetName: lang('상위 30% 팬', 'Top 30% Fan', '上位30%ファン'),
        iconSrc: 'duk-icon-top30.png',
        prizes: [
          { id: 203, type: '덕력', title: lang('상위 30% 보너스', 'Top 30% Bonus', '上位30%ボーナス'), amount: 200 },
        ],
      },
    ],
  },
  // 언더라이트 2026.06 시즌 (102) — 진행중·미정산
  {
    id: 3, seasonId: 102,
    tiers: [
      {
        id: 21, targetType: '등수', targetValue: '1',
        targetName: lang('최우수 팬', 'Best Fan', 'ベストファン'),
        iconSrc: 'duk-icon-1st.png',
        prizes: [
          { id: 301, type: 'BIVE NFT', title: lang('언더라이트 BIVE 에디션', 'UNDER:LIGHT BIVE Edition', 'アンダーライトBIVEエディション'), mintingEventId: 23 },
        ],
      },
      {
        id: 22, targetType: '퍼센트', targetValue: '20',
        targetName: lang('상위 20% 팬', 'Top 20% Fan', '上位20%ファン'),
        iconSrc: 'duk-icon-top20.png',
        prizes: [
          { id: 302, type: '응모권', title: lang('슈퍼팬 응모권', 'Super Fan Tickets', 'スーパーファン応募券'), count: 2 },
        ],
      },
    ],
  },
  // 언더라이트 2026.05 시즌 (101) — 종료·정산 완료
  {
    id: 4, seasonId: 101, settledAt: '2026.05.31 23:59',
    tiers: [
      {
        id: 31, targetType: '등수', targetValue: '1',
        targetName: lang('최우수 팬', 'Best Fan', 'ベストファン'),
        iconSrc: 'duk-icon-1st.png',
        prizes: [
          { id: 401, type: '현장 수령', title: lang('팬미팅 초대권', 'Fanmeeting Invite', 'ファンミ招待券'), pickupStartDt: '2026-06-10', pickupEndDt: '2026-06-20', openTime: '10:00', closeTime: '18:00', location: lang('서울 OO홀', 'Seoul OO Hall', 'ソウルOOホール'), items: lang('신분증 지참', 'Bring ID', '身分証持参') },
        ],
      },
      {
        id: 32, targetType: '등수범위', targetValue: '2-10',
        targetName: lang('TOP 10 팬', 'TOP 10 Fan', 'TOP 10 ファン'),
        iconSrc: 'duk-icon-top10.png',
        prizes: [
          { id: 402, type: '덕력', title: lang('TOP 10 보너스', 'TOP 10 Bonus', 'TOP10ボーナス'), amount: 300 },
        ],
      },
    ],
  },
  // iKON 2026.05 시즌 (501) — 강제 종료·미지급 (settledAt 없음 = 지급 내역 0건)
  {
    id: 5, seasonId: 501,
    // settledAt 의도적으로 없음 — 강제 종료 시즌은 정산 없이 종료 (buildPayouts에서 skip)
    tiers: [
      {
        id: 41, targetType: '등수', targetValue: '1',
        targetName: lang('최우수 팬', 'Best Fan', 'ベストファン'),
        iconSrc: 'duk-icon-1st.png',
        prizes: [
          { id: 501, type: '응모권', title: lang('iKON 사인회 응모권', 'iKON Fansign Tickets', 'iKONサイン会応募券'), count: 5 },
        ],
      },
    ],
  },
  // CELEBUS 2026.06 시즌 (301) — 진행중·미정산
  {
    id: 6, seasonId: 301,
    tiers: [
      {
        id: 51, targetType: '등수', targetValue: '1',
        targetName: lang('최우수 팬', 'Best Fan', 'ベストファン'),
        iconSrc: 'duk-icon-1st.png',
        prizes: [
          { id: 601, type: '덕력', title: lang('데뷔 시즌 1위 보너스', 'Debut Season 1st Bonus', 'デビューシーズン1位ボーナス'), amount: 500 },
        ],
      },
    ],
  },
  // 언더라이트 2025.12 시즌 (103) — 종료·정산 완료 (전년도 시즌)
  {
    id: 7, seasonId: 103, settledAt: '2025.12.31 23:59',
    tiers: [
      {
        id: 61, targetType: '등수', targetValue: '1',
        targetName: lang('최우수 팬', 'Best Fan', 'ベストファン'),
        iconSrc: 'duk-icon-1st.png',
        prizes: [
          { id: 701, type: '배송 수령', title: lang('연말 사인 굿즈', 'Year-end Signed Goods', '年末サイングッズ'), deliveryDeadlineDt: '2026-01-15', deliveryDeadlineTime: '23:59', deliveryFormUrl: 'https://forms.gle/ul-202512' },
        ],
      },
      {
        id: 62, targetType: '등수범위', targetValue: '2-10',
        targetName: lang('TOP 10 팬', 'TOP 10 Fan', 'TOP 10 ファン'),
        iconSrc: 'duk-icon-top10.png',
        prizes: [
          { id: 702, type: '응모권', title: lang('TOP 10 응모권', 'TOP 10 Tickets', 'TOP10 応募券'), count: 3 },
        ],
      },
    ],
  },
  // V01D 2025.12 시즌 (204) — 종료·정산 완료 (전년도 시즌)
  {
    id: 8, seasonId: 204, settledAt: '2025.12.31 23:59',
    tiers: [
      {
        id: 71, targetType: '등수', targetValue: '1',
        targetName: lang('최우수 팬', 'Best Fan', 'ベストファン'),
        iconSrc: 'duk-icon-1st.png',
        prizes: [
          { id: 801, type: '덕력', title: lang('연말 1위 보너스', 'Year-end 1st Bonus', '年末1位ボーナス'), amount: 1000 },
        ],
      },
    ],
  },
];

// 시즌 보상 조회 — 시즌 = 1개월, 시즌당 1건 (미팅 정합 2026-06-02). mock에 없으면 빈 tiers 반환.
export interface DukSeasonRewardView {
  tiers: DukRewardTier[];
  settledAt?: string;
  isLocked: boolean; // 정산 완료 여부
}

export function getSeasonReward(seasonId: number): DukSeasonRewardView {
  const found = dukSeasonRewards.find((r) => r.seasonId === seasonId);
  return {
    tiers: found?.tiers ?? [],
    settledAt: found?.settledAt,
    isLocked: !!found?.settledAt,
  };
}

// 시즌 정산 완료 여부
export function isSeasonSettled(seasonId: number): boolean {
  return getSeasonReward(seasonId).isLocked;
}

// 정산 완료 시각 (정보 카드 표시용)
export function getSeasonSettledAt(seasonId: number): string | undefined {
  return getSeasonReward(seasonId).settledAt;
}

// ─────────────────────────────────────────────
// 시즌 보상 지급 내역 (정산 결과 — 누가 어떤 등수로 어떤 상품을 받았는가)
// [CEB-BO-ART-401-DETAIL] §2.11~§2.13 — 보상 지급 내역 탭 (시즌 단위 1회 정산)
// ─────────────────────────────────────────────

export type DukPayoutStatus = '지급완료' | '지급대기' | '지급실패' | '재지급대기';

export interface DukRewardPayout {
  id: number;
  seasonId: number;
  memberId: string;
  memberNickname: string;           // snapshot — 정산 시점 닉네임
  rank: number;                     // 정산 시점 회원 순위 (시즌 획득 덕력 누적 랭킹)
  tierId: number;                   // 참조
  targetType: DukRewardTargetType;  // snapshot
  targetValue: string;              // snapshot
  targetName: DukLangText;          // snapshot v1.7 — 보상 구간 대상명
  targetIconSrc: string;            // snapshot v1.7 — 대상 아이콘 이미지
  prizeId: number;                  // 참조
  prizeType: DukPrizeType;          // snapshot
  prizeTitle: DukLangText;          // snapshot — 보상 설정 변경에도 보존
  paidStatus: DukPayoutStatus;
  paidAt?: string;                  // YYYY.MM.DD HH:mm
  paidBy?: string;                  // '시스템' (자동) 또는 운영자명 (수동)
  memo?: string;                    // 운영자 메모/사유
  createdAt: string;                // 정산 시각 (자동 생성)
}

// 자동 지급 상품 분류 — 정산 시점에 즉시 지급완료 처리
export function isAutoPaidPrize(type: DukPrizeType): boolean {
  return type === 'BIVE NFT' || type === '응모권' || type === '덕력';
}

// 한 회원이 특정 tier에 매칭되는지 판정 (해당 등수가 tier의 target 범위 안인가)
function isRankInTier(
  rank: number,
  targetType: DukRewardTargetType,
  targetValue: string,
  totalActiveMembers: number,
): boolean {
  if (targetType === '등수') {
    return rank === Number(targetValue);
  }
  if (targetType === '등수범위') {
    const m = targetValue.match(/^(\d+)-(\d+)$/);
    if (!m) return false;
    return rank >= Number(m[1]) && rank <= Number(m[2]);
  }
  if (targetType === '퍼센트') {
    const pct = Number(targetValue);
    const count = Math.max(1, Math.ceil((totalActiveMembers * pct) / 100));
    return rank >= 1 && rank <= count;
  }
  return false;
}

// 중복 지급 금지 — 한 회원에게 매칭되는 tier 중 가장 상위 1개만 선택
// 우선순위: ① 타입 (등수 > 등수범위 > 퍼센트) ② 같은 타입은 값 작은 것 우선
function selectTopTierForMember(
  rank: number,
  tiers: DukRewardTier[],
  totalActiveMembers: number,
): DukRewardTier | null {
  const candidates = tiers.filter((t) =>
    isRankInTier(rank, t.targetType, t.targetValue, totalActiveMembers),
  );
  if (candidates.length === 0) return null;

  const TYPE_RANK: Record<DukRewardTargetType, number> = {
    등수: 0,
    등수범위: 1,
    퍼센트: 2,
  };

  const tierValueKey = (t: DukRewardTier): number => {
    if (t.targetType === '등수') return Number(t.targetValue);
    if (t.targetType === '등수범위') {
      const m = t.targetValue.match(/^(\d+)-(\d+)$/);
      return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
    }
    if (t.targetType === '퍼센트') return Number(t.targetValue);
    return Number.MAX_SAFE_INTEGER;
  };

  candidates.sort((a, b) => {
    const typeDiff = TYPE_RANK[a.targetType] - TYPE_RANK[b.targetType];
    if (typeDiff !== 0) return typeDiff;
    return tierValueKey(a) - tierValueKey(b);
  });

  return candidates[0];
}

// 정산 시점 회원 순위 = 시즌 획득 덕력 누적 랭킹 (getDukRankingBySeason, 랭킹 탭과 동일 산식)
// 랭킹이 비어 있는(획득 활동 없는) 시즌은 mock 회원 풀로 fallback해 데모용 지급 내역을 보존
function buildPayouts(): DukRewardPayout[] {
  const payouts: DukRewardPayout[] = [];
  let nextId = 1;

  for (const sr of dukSeasonRewards) {
    if (!sr.settledAt) continue; // 강제 종료 시즌(settledAt 없음) 포함 미정산 시즌 skip

    // 정산 대상 = 시즌 획득 누적 랭킹. 랭킹이 비면 데모를 위해 회원 풀 인덱스 순으로 대체
    const ranking = getDukRankingBySeason(sr.seasonId);
    const ranked: { memberId: string; memberNickname: string; rank: number }[] =
      ranking.length > 0
        ? ranking.map((r) => ({ memberId: r.memberId, memberNickname: r.memberNickname, rank: r.rank }))
        : dukMembers.map((m, i) => ({ memberId: m.id, memberNickname: m.nickname, rank: i + 1 }));
    const totalMembers = ranked.length;

    for (const member of ranked) {
      const selectedTier = selectTopTierForMember(member.rank, sr.tiers, totalMembers);
      if (!selectedTier) continue;
      for (const prize of selectedTier.prizes) {
        const auto = isAutoPaidPrize(prize.type);
        payouts.push({
          id: nextId++,
          seasonId: sr.seasonId,
          memberId: member.memberId,
          memberNickname: member.memberNickname,
          rank: member.rank,
          tierId: selectedTier.id,
          targetType: selectedTier.targetType,
          targetValue: selectedTier.targetValue,
          targetName: selectedTier.targetName,       // v1.7 — snapshot
          targetIconSrc: selectedTier.iconSrc,       // v1.7 — snapshot
          prizeId: prize.id,
          prizeType: prize.type,
          prizeTitle: prize.title,
          paidStatus: auto ? '지급완료' : '지급대기',
          paidAt: auto ? sr.settledAt : undefined,
          paidBy: auto ? '시스템' : undefined,
          createdAt: sr.settledAt,
        });
      }
    }
  }

  // mock 다양성: 수동 지급 일부 행을 다른 상태로 변경 (운영자 액션 시뮬레이션)
  const manual = payouts.filter((p) => !isAutoPaidPrize(p.prizeType));
  if (manual[0]) {
    manual[0].paidStatus = '지급완료';
    manual[0].paidAt = `${manual[0].createdAt.slice(0, 10)} 14:30`;
    manual[0].paidBy = '운영자A';
    manual[0].memo = '배송 발송 완료';
  }
  if (manual[1]) {
    manual[1].paidStatus = '지급실패';
    manual[1].paidBy = '운영자A';
    manual[1].memo = '주소 불량으로 반송됨';
  }
  if (manual[2]) {
    manual[2].paidStatus = '재지급대기';
    manual[2].paidBy = '운영자B';
    manual[2].memo = '회원 요청으로 재발송 준비 중';
  }

  return payouts;
}

export const dukRewardPayouts: DukRewardPayout[] = buildPayouts();

// 헬퍼: 해당 시즌의 지급 내역 (순위 오름차순) — 시즌당 1회 정산이므로 시즌 단위로 조회
export function getSeasonPayouts(seasonId: number): DukRewardPayout[] {
  return dukRewardPayouts
    .filter((p) => p.seasonId === seasonId)
    .sort((a, b) => a.rank - b.rank || a.prizeId - b.prizeId);
}

// 헬퍼: 지급 상태별 카운트 (통계 카드용). 화면에서 변경된 현재 상태로 재계산할 수 있도록 rows를 인자로 받음
export interface DukPayoutStats {
  memberCount: number;
  totalPrizes: number;
  byStatus: Record<DukPayoutStatus, number>;
}

export function computePayoutStats(rows: DukRewardPayout[]): DukPayoutStats {
  const byStatus: Record<DukPayoutStatus, number> = {
    지급완료: 0,
    지급대기: 0,
    지급실패: 0,
    재지급대기: 0,
  };
  const memberSet = new Set<string>();
  for (const r of rows) {
    memberSet.add(r.memberId);
    byStatus[r.paidStatus] += 1;
  }
  return {
    memberCount: memberSet.size,
    totalPrizes: rows.length,
    byStatus,
  };
}
