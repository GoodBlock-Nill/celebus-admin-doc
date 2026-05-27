// [CEB-BO-ART-401] v1.1 정합
// 덕력(DUK) — 아티스트 그룹 단위 독립 관리. 그룹별 시즌(1년 고정)·획득/사용 ledger.

export type DukSeasonStatus = '예정' | '진행중' | '종료';
export type DukLedgerType = '획득' | '사용';

export interface DukSeason {
  id: number;
  artistGroupId: number;
  artistGroupName: string;
  name: string;
  startAt: string; // YYYY.MM.DD HH:mm
  endAt: string; // 시작일 + 1년 자동 산출
  status: DukSeasonStatus;
}

export interface DukLedger {
  id: number;
  occurredAt: string;
  artistGroupId: number;
  artistGroupName: string;
  memberId: string; // 회원 id (mock/members.ts와 정합 — string)
  memberNickname: string;
  type: DukLedgerType;
  source: string; // 한국어
  amount: number; // 양수
  balanceAfter: number;
  seasonId?: number;
}

// 활성 그룹 5종 (mock/artists.ts와 정합)
export const dukActiveGroups: { id: number; name: string }[] = [
  { id: 1, name: '언더라이트 (UNDER:LIGHT)' },
  { id: 2, name: 'V01D' },
  { id: 3, name: 'CELEBUS' },
  { id: 4, name: 'MADEIN' },
  { id: 5, name: 'iKON' },
];

// 출처 enum (오버스펙 회피 — 획득 4종 + 사용 2종)
export const dukSourcesEarn = ['퀘스트 보상', '래플 환급', '운영자 지급', '이벤트 보상'] as const;
export const dukSourcesSpend = ['응원하기', '래플 응모'] as const;

// ─────────────────────────────────────────────
// 시즌 mock (v1.1 — 1년 단위 고정)
// ─────────────────────────────────────────────
export const dukSeasons: DukSeason[] = [
  // 언더라이트
  { id: 101, artistGroupId: 1, artistGroupName: '언더라이트 (UNDER:LIGHT)', name: '언더라이트 2025 시즌', startAt: '2025.01.01 00:00', endAt: '2025.12.31 23:59', status: '종료' },
  { id: 102, artistGroupId: 1, artistGroupName: '언더라이트 (UNDER:LIGHT)', name: '언더라이트 2026 시즌', startAt: '2026.01.01 00:00', endAt: '2026.12.31 23:59', status: '진행중' },
  // V01D
  { id: 201, artistGroupId: 2, artistGroupName: 'V01D', name: 'V01D 2025 시즌', startAt: '2025.01.01 00:00', endAt: '2025.12.31 23:59', status: '종료' },
  { id: 202, artistGroupId: 2, artistGroupName: 'V01D', name: 'V01D 2026 시즌', startAt: '2026.01.01 00:00', endAt: '2026.12.31 23:59', status: '진행중' },
  { id: 203, artistGroupId: 2, artistGroupName: 'V01D', name: 'V01D 2027 시즌', startAt: '2027.01.01 00:00', endAt: '2027.12.31 23:59', status: '예정' },
  // CELEBUS
  { id: 301, artistGroupId: 3, artistGroupName: 'CELEBUS', name: 'CELEBUS 데뷔 시즌', startAt: '2026.05.01 00:00', endAt: '2027.04.30 23:59', status: '진행중' },
  // MADEIN
  { id: 401, artistGroupId: 4, artistGroupName: 'MADEIN', name: 'MADEIN 2026 시즌', startAt: '2026.01.01 00:00', endAt: '2026.12.31 23:59', status: '진행중' },
  // iKON
  { id: 501, artistGroupId: 5, artistGroupName: 'iKON', name: 'iKON 2025 시즌', startAt: '2025.01.01 00:00', endAt: '2025.12.31 23:59', status: '종료' },
  { id: 502, artistGroupId: 5, artistGroupName: 'iKON', name: 'iKON 2026 시즌', startAt: '2026.01.01 00:00', endAt: '2026.12.31 23:59', status: '진행중' },
];

// ─────────────────────────────────────────────
// 회원 풀 (덕력 활동 회원 8명) — mock/members.ts 운영 실회원 정합
// ─────────────────────────────────────────────
const dukMembers: { id: string; nickname: string }[] = [
  { id: '578', nickname: 'in.mycosmos' },
  { id: '577', nickname: 'qqqaas' },
  { id: '576', nickname: 'luna_jiyun_lee' },
  { id: '575', nickname: 'dhyem' },
  { id: '574', nickname: 'jaea306122' },
  { id: '573', nickname: 'manju' },
  { id: '572', nickname: 'sally410504' },
  { id: '571', nickname: 'sohyun0105' },
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

  const push = (
    occurredAt: string,
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
    const next = type === '획득' ? prev + amount : prev - amount;
    balance[key] = next;
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
  push('2026.04.05 10:12', 102, 1, '언더라이트 (UNDER:LIGHT)', 0, '획득', '퀘스트 보상', 120);
  push('2026.04.08 14:30', 102, 1, '언더라이트 (UNDER:LIGHT)', 1, '획득', '퀘스트 보상', 90);
  push('2026.04.12 21:05', 102, 1, '언더라이트 (UNDER:LIGHT)', 0, '획득', '이벤트 보상', 200);
  push('2026.04.20 09:00', 102, 1, '언더라이트 (UNDER:LIGHT)', 2, '획득', '래플 환급', 30);
  push('2026.04.25 18:45', 102, 1, '언더라이트 (UNDER:LIGHT)', 0, '사용', '응원하기', 100);
  push('2026.05.02 12:20', 102, 1, '언더라이트 (UNDER:LIGHT)', 3, '획득', '운영자 지급', 500);
  push('2026.05.10 16:30', 102, 1, '언더라이트 (UNDER:LIGHT)', 1, '사용', '래플 응모', 50);
  push('2026.05.15 22:10', 102, 1, '언더라이트 (UNDER:LIGHT)', 0, '획득', '퀘스트 보상', 150);
  push('2026.05.20 09:55', 102, 1, '언더라이트 (UNDER:LIGHT)', 2, '획득', '퀘스트 보상', 80);
  push('2026.05.25 19:00', 102, 1, '언더라이트 (UNDER:LIGHT)', 0, '사용', '응원하기', 200);

  // ─ V01D 2026 시즌 (202)
  push('2026.04.02 11:00', 202, 2, 'V01D', 0, '획득', '퀘스트 보상', 100);
  push('2026.04.05 13:20', 202, 2, 'V01D', 4, '획득', '퀘스트 보상', 80);
  push('2026.04.10 19:40', 202, 2, 'V01D', 4, '획득', '이벤트 보상', 350);
  push('2026.04.18 22:15', 202, 2, 'V01D', 5, '획득', '래플 환급', 40);
  push('2026.04.22 10:30', 202, 2, 'V01D', 0, '사용', '응원하기', 150);
  push('2026.05.01 15:00', 202, 2, 'V01D', 6, '획득', '운영자 지급', 800);
  push('2026.05.05 18:25', 202, 2, 'V01D', 4, '사용', '래플 응모', 70);
  push('2026.05.12 21:50', 202, 2, 'V01D', 5, '획득', '퀘스트 보상', 130);
  push('2026.05.18 09:10', 202, 2, 'V01D', 6, '획득', '이벤트 보상', 250);
  push('2026.05.22 14:05', 202, 2, 'V01D', 4, '사용', '응원하기', 300);
  push('2026.05.26 17:30', 202, 2, 'V01D', 0, '획득', '퀘스트 보상', 90);

  // ─ CELEBUS 데뷔 시즌 (301)
  push('2026.05.02 09:00', 301, 3, 'CELEBUS', 7, '획득', '이벤트 보상', 500);
  push('2026.05.06 12:00', 301, 3, 'CELEBUS', 0, '획득', '퀘스트 보상', 60);
  push('2026.05.10 14:30', 301, 3, 'CELEBUS', 1, '획득', '퀘스트 보상', 70);
  push('2026.05.14 16:00', 301, 3, 'CELEBUS', 7, '사용', '응원하기', 200);
  push('2026.05.18 18:30', 301, 3, 'CELEBUS', 2, '획득', '래플 환급', 25);
  push('2026.05.22 20:00', 301, 3, 'CELEBUS', 0, '획득', '운영자 지급', 300);
  push('2026.05.25 21:30', 301, 3, 'CELEBUS', 7, '사용', '래플 응모', 50);

  // ─ MADEIN 2026 시즌 (401)
  push('2026.02.05 10:00', 401, 4, 'MADEIN', 3, '획득', '퀘스트 보상', 100);
  push('2026.02.20 14:00', 401, 4, 'MADEIN', 3, '획득', '이벤트 보상', 400);
  push('2026.03.10 16:00', 401, 4, 'MADEIN', 5, '획득', '퀘스트 보상', 80);
  push('2026.03.25 18:00', 401, 4, 'MADEIN', 3, '사용', '응원하기', 250);
  push('2026.04.15 20:00', 401, 4, 'MADEIN', 6, '획득', '운영자 지급', 600);
  push('2026.04.30 22:00', 401, 4, 'MADEIN', 5, '획득', '퀘스트 보상', 90);
  push('2026.05.08 09:30', 401, 4, 'MADEIN', 3, '획득', '래플 환급', 30);
  push('2026.05.15 11:00', 401, 4, 'MADEIN', 6, '사용', '응원하기', 200);
  push('2026.05.22 13:30', 401, 4, 'MADEIN', 5, '사용', '래플 응모', 60);

  // ─ iKON 2026 시즌 (502) — 2026.04~05 활동
  push('2026.04.03 10:00', 502, 5, 'iKON', 4, '획득', '퀘스트 보상', 110);
  push('2026.04.08 13:00', 502, 5, 'iKON', 6, '획득', '퀘스트 보상', 85);
  push('2026.04.15 16:00', 502, 5, 'iKON', 4, '획득', '이벤트 보상', 300);
  push('2026.04.22 19:00', 502, 5, 'iKON', 7, '획득', '래플 환급', 45);
  push('2026.04.28 21:00', 502, 5, 'iKON', 4, '사용', '응원하기', 180);
  push('2026.05.05 10:30', 502, 5, 'iKON', 6, '획득', '운영자 지급', 700);
  push('2026.05.12 13:00', 502, 5, 'iKON', 7, '사용', '래플 응모', 65);
  push('2026.05.18 15:30', 502, 5, 'iKON', 4, '획득', '퀘스트 보상', 120);
  push('2026.05.25 18:00', 502, 5, 'iKON', 6, '획득', '이벤트 보상', 280);

  // ─ V01D 2025 시즌 (201, 종료)
  push('2025.10.10 10:00', 201, 2, 'V01D', 0, '획득', '퀘스트 보상', 100);
  push('2025.10.20 14:00', 201, 2, 'V01D', 4, '획득', '이벤트 보상', 250);
  push('2025.11.05 16:00', 201, 2, 'V01D', 5, '획득', '운영자 지급', 400);
  push('2025.11.20 18:00', 201, 2, 'V01D', 4, '사용', '응원하기', 200);
  push('2025.12.10 10:00', 201, 2, 'V01D', 0, '획득', '래플 환급', 60);

  // ─ 언더라이트 2025 시즌 (101, 종료)
  push('2025.10.15 10:00', 101, 1, '언더라이트 (UNDER:LIGHT)', 0, '획득', '퀘스트 보상', 90);
  push('2025.11.10 14:00', 101, 1, '언더라이트 (UNDER:LIGHT)', 2, '획득', '이벤트 보상', 300);
  push('2025.12.05 16:00', 101, 1, '언더라이트 (UNDER:LIGHT)', 3, '획득', '운영자 지급', 500);
  push('2025.12.20 18:00', 101, 1, '언더라이트 (UNDER:LIGHT)', 0, '사용', '응원하기', 150);

  // ─ iKON 2025 시즌 (501, 종료)
  push('2025.10.20 10:00', 501, 5, 'iKON', 4, '획득', '퀘스트 보상', 95);
  push('2025.11.15 14:00', 501, 5, 'iKON', 6, '획득', '이벤트 보상', 280);
  push('2025.12.10 16:00', 501, 5, 'iKON', 7, '획득', '운영자 지급', 450);
  push('2025.12.28 18:00', 501, 5, 'iKON', 4, '사용', '응원하기', 220);

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
  totalAmount: number; // 획득 - 사용
  lastChangedAt: string;
}

// v1.1 — 년/월 단위 ledger 누적 랭킹
export function getDukRankingByPeriod(
  groupId: number,
  period: { unit: 'year' | 'month'; year: number; month?: number },
): DukRankingRow[] {
  const yearStr = String(period.year);
  const monthStr = period.month ? String(period.month).padStart(2, '0') : null;
  const prefix = period.unit === 'year' ? `${yearStr}.` : `${yearStr}.${monthStr}.`;

  const filtered = dukLedger.filter(
    (l) => l.artistGroupId === groupId && l.occurredAt.startsWith(prefix),
  );
  const acc: Record<string, { nickname: string; total: number; last: string }> = {};
  for (const l of filtered) {
    const cur = acc[l.memberId] ?? { nickname: l.memberNickname, total: 0, last: l.occurredAt };
    cur.total += l.type === '획득' ? l.amount : -l.amount;
    if (l.occurredAt > cur.last) cur.last = l.occurredAt;
    acc[l.memberId] = cur;
  }
  return Object.entries(acc)
    .map(([mid, v]) => ({
      memberId: mid,
      memberNickname: v.nickname,
      totalAmount: v.total,
      lastChangedAt: v.last,
    }))
    .filter((r) => r.totalAmount > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount)
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
