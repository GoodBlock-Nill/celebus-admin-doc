// [CEB-BO-ART-401] v1.6 정합
// 덕력(DUK) — 아티스트 그룹 단위 독립 관리. 그룹별 시즌(1년 고정)·획득/사용 ledger.
// 출처 enum은 [CEB-000] §5.2 v5.6 보상 매트릭스 활동 8종 + §3.2 사용처 2종 SSOT 정합.
// v1.6 — 1구간 = 복수 상품 nested + 상품 5종 분기 (배송·현장·BIVE·응모권·덕력) + 다국어 KO/EN/JP

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

// v1.5 — 월별 보상 매트릭스 / v1.6 — 1구간 = 복수 상품 nested
export type DukRewardTargetType = '등수' | '퍼센트' | '등수범위';

// 다국어 라벨 (LangField 패턴 정합 — KO/EN/JA)
export interface DukLangText {
  ko: string;
  en: string;
  ja: string;
}

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
  prizes: DukRewardPrize[]; // v1.6 — 1구간 = 복수 상품. 최소 1개 필수
}

export interface DukMonthlyReward {
  id: number;
  seasonId: number;
  yearMonth: string; // YYYY.MM
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

  // ─ iKON 2025 시즌 (501, 종료)
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
        // 2026.01~05 또는 2025.10~12 분포
        let year: number;
        let month: number;
        if (r() < 0.85) {
          year = 2026;
          month = 1 + Math.floor(r() * 5);
        } else {
          year = 2025;
          month = 10 + Math.floor(r() * 3);
        }
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

// ─────────────────────────────────────────────
// v1.5 — 월별 보상 매트릭스
// ─────────────────────────────────────────────

// 다국어 헬퍼
const lang = (ko: string, en: string, ja: string): DukLangText => ({ ko, en, ja });

// 시즌별 월별 보상 mock — v1.6 1구간 = 복수 상품 nested 구조
// settledAt 채워진 entry = 정산 완료(잠금)
// 신규 상품 5종 모두 1회 이상 등장하도록 분포
export const dukMonthlyRewards: DukMonthlyReward[] = [
  // V01D 2026 시즌 (202) — 1~4월 정산 완료 + 5월 진행중 + 나머지 예정
  {
    id: 1,
    seasonId: 202,
    yearMonth: '2026.01',
    settledAt: '2026.01.31 23:59',
    tiers: [
      {
        id: 1,
        targetType: '등수',
        targetValue: '1',
        prizes: [
          {
            id: 101,
            type: '배송 수령',
            title: lang('V01D 사인 앨범', 'V01D Signed Album', 'V01Dサイン入りアルバム'),
            deliveryDeadlineDt: '2026-02-15',
            deliveryDeadlineTime: '23:59',
            deliveryFormUrl: 'https://forms.gle/v01d-signed-album-202601',
          },
          {
            id: 102,
            type: '덕력',
            title: lang('보너스 덕력', 'Bonus Fan Power', 'ボーナス推し力'),
            amount: 500,
          },
        ],
      },
      {
        id: 2,
        targetType: '등수범위',
        targetValue: '2-10',
        prizes: [
          {
            id: 103,
            type: '배송 수령',
            title: lang('V01D 사인 포카', 'V01D Signed Photocard', 'V01Dサイン入りフォトカード'),
            deliveryDeadlineDt: '2026-02-15',
            deliveryDeadlineTime: '23:59',
            deliveryFormUrl: 'https://forms.gle/v01d-photocard-202601',
          },
        ],
      },
      {
        id: 3,
        targetType: '퍼센트',
        targetValue: '10',
        prizes: [
          {
            id: 104,
            type: '응모권',
            title: lang('슈퍼팬 응모권', 'Super Fan Tickets', 'スーパーファン応募券'),
            count: 5,
          },
        ],
      },
    ],
  },
  {
    id: 2,
    seasonId: 202,
    yearMonth: '2026.02',
    settledAt: '2026.02.28 23:59',
    tiers: [
      {
        id: 4,
        targetType: '등수',
        targetValue: '1',
        prizes: [
          {
            id: 105,
            type: '배송 수령',
            title: lang('V01D 사인 앨범', 'V01D Signed Album', 'V01Dサイン入りアルバム'),
            deliveryDeadlineDt: '2026-03-15',
            deliveryDeadlineTime: '23:59',
            deliveryFormUrl: 'https://forms.gle/v01d-signed-album-202602',
          },
        ],
      },
      {
        id: 5,
        targetType: '등수범위',
        targetValue: '2-10',
        prizes: [
          {
            id: 106,
            type: '현장 수령',
            title: lang('V01D 팬 사인회 초대권', 'V01D Fan Sign Pass', 'V01Dファンサイン招待券'),
            pickupStartDt: '2026-03-20',
            pickupEndDt: '2026-03-20',
            openTime: '14:00',
            closeTime: '18:00',
            location: lang('서울시 강남구 도산대로 123 V01D HQ', 'V01D HQ, 123 Dosan-daero, Gangnam-gu, Seoul', 'V01D HQ ソウル江南区島山大路123'),
            items: lang('신분증·티켓 QR', 'ID + Ticket QR', '身分証・チケットQR'),
          },
        ],
      },
    ],
  },
  {
    id: 3,
    seasonId: 202,
    yearMonth: '2026.03',
    settledAt: '2026.03.31 23:59',
    tiers: [
      {
        id: 6,
        targetType: '등수',
        targetValue: '1',
        prizes: [
          {
            id: 107,
            type: 'BIVE NFT',
            title: lang('V01D 프로핏 BIVE', 'V01D Prophet BIVE', 'V01Dプロフェットビーブ'),
            mintingEventId: 26,
          },
          {
            id: 108,
            type: '덕력',
            title: lang('TOP 1 덕력 보너스', 'TOP 1 Bonus', 'TOP1 ボーナス'),
            amount: 1000,
          },
        ],
      },
      {
        id: 7,
        targetType: '퍼센트',
        targetValue: '10',
        prizes: [
          {
            id: 109,
            type: '응모권',
            title: lang('슈퍼팬 응모권', 'Super Fan Tickets', 'スーパーファン応募券'),
            count: 3,
          },
        ],
      },
    ],
  },
  {
    id: 4,
    seasonId: 202,
    yearMonth: '2026.04',
    settledAt: '2026.04.30 23:59',
    tiers: [
      {
        id: 8,
        targetType: '등수',
        targetValue: '1',
        prizes: [
          {
            id: 110,
            type: '배송 수령',
            title: lang('V01D 한정판 앨범', 'V01D Limited Album', 'V01D限定版アルバム'),
            deliveryDeadlineDt: '2026-05-15',
            deliveryDeadlineTime: '23:59',
            deliveryFormUrl: 'https://forms.gle/v01d-limited-202604',
          },
        ],
      },
      {
        id: 9,
        targetType: '퍼센트',
        targetValue: '10',
        prizes: [
          {
            id: 111,
            type: '덕력',
            title: lang('TOP 10% 덕력 보너스', 'TOP 10% Bonus', 'TOP10% ボーナス'),
            amount: 200,
          },
        ],
      },
    ],
  },
  {
    id: 5,
    seasonId: 202,
    yearMonth: '2026.05',
    tiers: [
      {
        id: 10,
        targetType: '등수',
        targetValue: '1',
        prizes: [
          {
            id: 112,
            type: '배송 수령',
            title: lang('V01D 시즌 앨범', 'V01D Season Album', 'V01Dシーズンアルバム'),
            deliveryDeadlineDt: '2026-06-15',
            deliveryDeadlineTime: '23:59',
            deliveryFormUrl: 'https://forms.gle/v01d-season-202605',
          },
          {
            id: 113,
            type: 'BIVE NFT',
            title: lang('V01D 100일 기념 BIVE', 'V01D 100 Days BIVE', 'V01D100日記念ビーブ'),
            mintingEventId: 27,
          },
        ],
      },
      {
        id: 11,
        targetType: '등수범위',
        targetValue: '2-10',
        prizes: [
          {
            id: 114,
            type: '응모권',
            title: lang('TOP 10 응모권', 'TOP 10 Tickets', 'TOP10 応募券'),
            count: 3,
          },
        ],
      },
      {
        id: 12,
        targetType: '퍼센트',
        targetValue: '10',
        prizes: [
          {
            id: 115,
            type: '덕력',
            title: lang('TOP 10% 덕력', 'TOP 10% Fan Power', 'TOP10% 推し力'),
            amount: 300,
          },
        ],
      },
    ],
  },
  // 언더라이트 2026 시즌 (102) — 1·2월 정산 완료
  {
    id: 6,
    seasonId: 102,
    yearMonth: '2026.01',
    settledAt: '2026.01.31 23:59',
    tiers: [
      {
        id: 13,
        targetType: '등수',
        targetValue: '1',
        prizes: [
          {
            id: 116,
            type: '배송 수령',
            title: lang('언더라이트 사인 앨범', 'UNDER:LIGHT Signed Album', 'アンダーライトサイン入りアルバム'),
            deliveryDeadlineDt: '2026-02-15',
            deliveryDeadlineTime: '23:59',
            deliveryFormUrl: 'https://forms.gle/underlight-album-202601',
          },
        ],
      },
      {
        id: 14,
        targetType: '등수범위',
        targetValue: '2-10',
        prizes: [
          {
            id: 117,
            type: '응모권',
            title: lang('TOP 10 응모권', 'TOP 10 Tickets', 'TOP10 応募券'),
            count: 2,
          },
        ],
      },
    ],
  },
  {
    id: 7,
    seasonId: 102,
    yearMonth: '2026.02',
    settledAt: '2026.02.28 23:59',
    tiers: [
      {
        id: 15,
        targetType: '등수',
        targetValue: '1',
        prizes: [
          {
            id: 118,
            type: '현장 수령',
            title: lang('언더라이트 팬미팅 초대권', 'UNDER:LIGHT Fan Meeting Pass', 'アンダーライトファンミーティング招待券'),
            pickupStartDt: '2026-03-20',
            pickupEndDt: '2026-03-21',
            openTime: '10:00',
            closeTime: '20:00',
            location: lang('서울시 마포구 어울마당로 88 언더라이트홀', '88 Eoulmadang-ro, Mapo-gu, Seoul, UNDER:LIGHT Hall', 'ソウル麻浦区オウルマダン路88 アンダーライトホール'),
            items: lang('신분증·예매 QR', 'ID + Booking QR', '身分証・予約QR'),
          },
        ],
      },
      {
        id: 16,
        targetType: '퍼센트',
        targetValue: '5',
        prizes: [
          {
            id: 119,
            type: '덕력',
            title: lang('TOP 5% 덕력', 'TOP 5% Fan Power', 'TOP5% 推し力'),
            amount: 500,
          },
        ],
      },
    ],
  },
  {
    id: 8,
    seasonId: 102,
    yearMonth: '2026.05',
    tiers: [
      {
        id: 17,
        targetType: '등수',
        targetValue: '1',
        prizes: [
          {
            id: 120,
            type: 'BIVE NFT',
            title: lang('언더라이트 BIVE 에디션', 'UNDER:LIGHT BIVE Edition', 'アンダーライトビーブエディション'),
            mintingEventId: 23,
          },
        ],
      },
    ],
  },
];

// 시즌 시작일시("YYYY.MM.DD HH:mm")로부터 12개월 yearMonth 시퀀스 생성
function buildMonthsFromStart(startAt: string): string[] {
  const m = startAt.match(/^(\d{4})\.(\d{2})\./);
  if (!m) return [];
  const startYear = Number(m[1]);
  const startMonth = Number(m[2]);
  const result: string[] = [];
  for (let i = 0; i < 12; i++) {
    const monthIdx = (startMonth - 1 + i) % 12;
    const yearOffset = Math.floor((startMonth - 1 + i) / 12);
    const y = startYear + yearOffset;
    const mm = String(monthIdx + 1).padStart(2, '0');
    result.push(`${y}.${mm}`);
  }
  return result;
}

// 시즌별 월별 보상 12개 조회 (mock에 없으면 빈 tiers entry 생성)
export interface DukMonthlyRewardView {
  yearMonth: string;
  tiers: DukRewardTier[];
  settledAt?: string;
  isLocked: boolean; // 정산 완료 여부
}

export function getMonthlyRewards(seasonId: number): DukMonthlyRewardView[] {
  const season = dukSeasons.find((s) => s.id === seasonId);
  if (!season) return [];
  const months = buildMonthsFromStart(season.startAt);
  return months.map((ym) => {
    const found = dukMonthlyRewards.find((r) => r.seasonId === seasonId && r.yearMonth === ym);
    return {
      yearMonth: ym,
      tiers: found?.tiers ?? [],
      settledAt: found?.settledAt,
      isLocked: !!found?.settledAt,
    };
  });
}

// 정산 완료 월 카운트 (시즌 정보 카드용)
export function getSettledMonthCount(seasonId: number): number {
  return getMonthlyRewards(seasonId).filter((m) => m.isLocked).length;
}
