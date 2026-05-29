// 아티스트 서포트 이벤트 — 앱 [CEB-DUK-201] 서포트 이벤트 운영 mock
// 명세: [CEB-BO-SUP-000 v2.0] / [SUP-101 v2.0] / [SUP-101-CREATE v1.0] / [SUP-201 v2.0] / [SUP-401 v2.0]
// 응원 = 보유 덕력 차감(소비). 반환 = 미달성종료·집행취소·강제 종료 시 전액·서버 자동.

// 서포트 이벤트 라이프사이클 7상태 — [CEB-BO-SUP-000] §4.1
export type SupportStatus =
  | '임시저장'
  | '모집중'
  | '달성'
  | '집행중'
  | '완료'
  | '미달성종료'
  | '집행취소';

// 변동 유형 — [CEB-BO-SUP-000] §4.5 / [SUP-401]
export type CheerLedgerType = '응원' | '반환' | '결과물 알림';

export const SUPPORT_STATUSES: SupportStatus[] = [
  '임시저장', '모집중', '달성', '집행중', '완료', '미달성종료', '집행취소',
];

// 응원 대상 그룹(아티스트) — 팬덤레벨과 동일 활성 아티스트
export const SUPPORT_GROUPS = ['V01D', 'iKON', 'MADEIN', 'CELEBUS', '언더라이트 (UNDER:LIGHT)'];

// 개별 응원 건 — 동일 회원이 여러 번 응원 가능 ([CEB-DUK-201] §2.4 누적 응원)
export interface CheerRecord {
  amount: number; // 1회 응원 덕력
  at: string; // 응원 시점 (KST)
}

// 응원자 — [CEB-BO-SUP-201] §2.3 (회원당 다회 응원을 회차별로 보관)
export interface Cheerer {
  member: string;
  cheers: CheerRecord[]; // 개별 응원 건 (1건 이상)
  refunded: boolean; // 미달성종료·집행취소 시 전액 반환 완료
  refundedAt?: string;
}

// 결과물 — [CEB-BO-SUP-201] §2.4
export interface SupportResult {
  messageKo: string;
  messageEn: string;
  messageJp: string;
  mediaUrls: string[]; // 최대 10장 (사진·영상)
}

// 서포트 이벤트 — [CEB-BO-SUP-201]
export interface SupportEvent {
  id: number;
  status: SupportStatus;
  groupName: string;
  titleKo: string;
  titleEn: string;
  titleJp: string;
  descKo: string;
  descEn: string;
  descJp: string;
  targetDuk: number; // 목표 응원량 (덕력)
  accumulatedDuk: number; // 누적 응원
  startAt: string; // 시작일시 (KST)
  endAt: string; // 마감일시 (KST)
  imageUrl?: string;
  cheerers: Cheerer[];
  result?: SupportResult;
  createdAt: string;
  updatedAt: string;
}

// 응원·반환 변동 내역 — [CEB-BO-SUP-401]
export interface CheerLedger {
  id: number;
  type: CheerLedgerType;
  member: string;
  eventName: string;
  groupName: string;
  amount: number; // 응원 +N, 반환 -N, 결과물 알림 0
  at: string;
}

// 회원 누적 응원량 (개별 응원 건 합산)
export function cheerTotal(c: Cheerer): number {
  return c.cheers.reduce((sum, r) => sum + r.amount, 0);
}

// 회원 응원 횟수
export function cheerCount(c: Cheerer): number {
  return c.cheers.length;
}

// 최초 응원 시점
export function firstCheerAt(c: Cheerer): string {
  return [...c.cheers].map((r) => r.at).sort()[0] ?? '';
}

// 최근 응원 시점
export function lastCheerAt(c: Cheerer): string {
  return [...c.cheers].map((r) => r.at).sort().slice(-1)[0] ?? '';
}

// 응원자 수 (1 덕력 이상 응원한 회원)
export function cheererCount(e: SupportEvent): number {
  return e.cheerers.filter((c) => cheerTotal(c) > 0).length;
}

// 총 응원 횟수 (이벤트 전체 응원 건수)
export function totalCheerCount(e: SupportEvent): number {
  return e.cheerers.reduce((sum, c) => sum + cheerCount(c), 0);
}

// 평균 응원량 (회원 1인당, 내림)
export function avgCheer(e: SupportEvent): number {
  const n = cheererCount(e);
  return n > 0 ? Math.floor(e.accumulatedDuk / n) : 0;
}

// 달성률 (%) — 누적 / 목표, 최대 100
export function achieveRate(e: SupportEvent): number {
  if (e.targetDuk <= 0) return 0;
  return Math.min(100, Math.round((e.accumulatedDuk / e.targetDuk) * 100));
}

// 반환 종료 상태 여부 (미달성종료·집행취소)
export function isRefundedStatus(s: SupportStatus): boolean {
  return s === '미달성종료' || s === '집행취소';
}

// 응원자 빌더 — 회차별 [응원량, 시점] 목록으로 구성
const ch = (
  member: string,
  records: [number, string][],
  refunded = false,
  refundedAt?: string,
): Cheerer => ({
  member,
  cheers: records.map(([amount, at]) => ({ amount, at })),
  refunded,
  refundedAt,
});

export const supportEvents: SupportEvent[] = [
  {
    id: 1, status: '모집중', groupName: 'V01D',
    titleKo: 'V01D 데뷔 200일 지하철 광고 서포트', titleEn: 'V01D 200th Day Subway Ad Support', titleJp: 'V01D デビュー200日 地下鉄広告サポート',
    descKo: '데뷔 200일을 기념해 강남역 지하철 광고를 함께 만들어요!', descEn: 'Celebrate V01D 200 days with a Gangnam subway ad!', descJp: 'デビュー200日記念、江南駅の地下鉄広告を一緒に！',
    targetDuk: 2000000, accumulatedDuk: 1240000,
    startAt: '2026.05.20 10:00', endAt: '2026.06.10 23:59', imageUrl: undefined,
    cheerers: [
      ch('voidlover', [[200000, '2026.05.20 10:12'], [120000, '2026.05.23 08:00']]),
      ch('신노스케fan', [[250000, '2026.05.21 21:30'], [150000, '2026.05.26 22:10']]),
      ch('kebin_p', [[100000, '2026.05.22 09:05'], [80000, '2026.05.25 19:00']]),
      ch('only_void', [[150000, '2026.05.24 14:40']]),
      ch('void_forever', [[100000, '2026.05.25 12:00'], [50000, '2026.05.26 09:30'], [40000, '2026.05.27 21:00']]),
    ],
    createdAt: '2026.05.18 16:00', updatedAt: '2026.05.27 21:00',
  },
  {
    id: 2, status: '달성', groupName: 'iKON',
    titleKo: 'iKON 콘서트 응원 트럭 서포트', titleEn: 'iKON Concert Support Truck', titleJp: 'iKON コンサート応援トラック サポート',
    descKo: '콘서트 현장에 응원 트럭을 보내요. 함께 응원해요!', descEn: 'Send a support truck to the concert venue!', descJp: 'コンサート会場へ応援トラックを送ろう！',
    targetDuk: 1500000, accumulatedDuk: 1500000,
    startAt: '2026.05.01 10:00', endAt: '2026.05.25 23:59',
    cheerers: [
      ch('ikonic_99', [[350000, '2026.05.02 11:00'], [250000, '2026.05.12 20:30']]),
      ch('bobby_fan', [[500000, '2026.05.05 19:20']]),
      ch('konbae', [[250000, '2026.05.10 08:15'], [150000, '2026.05.18 13:40']]),
    ],
    createdAt: '2026.04.28 13:00', updatedAt: '2026.05.20 22:00',
  },
  {
    id: 3, status: '집행중', groupName: 'MADEIN',
    titleKo: 'MADEIN 데뷔 축하 카페 서포트', titleEn: 'MADEIN Debut Cafe Support', titleJp: 'MADEIN デビュー祝いカフェ サポート',
    descKo: '데뷔 축하 생일 카페를 운영합니다.', descEn: 'Hosting a debut celebration cafe.', descJp: 'デビュー祝いカフェを開催します。',
    targetDuk: 800000, accumulatedDuk: 800000,
    startAt: '2026.04.10 10:00', endAt: '2026.04.30 23:59',
    cheerers: [
      ch('gunwook_p', [[180000, '2026.04.11 10:30'], [120000, '2026.04.18 09:00']]),
      ch('madein_lv', [[280000, '2026.04.15 17:00']]),
      ch('made_in', [[120000, '2026.04.20 12:10'], [100000, '2026.04.28 21:30']]),
    ],
    createdAt: '2026.04.05 09:00', updatedAt: '2026.05.02 09:00',
  },
  {
    id: 4, status: '완료', groupName: 'V01D',
    titleKo: 'V01D 첫 단독 콘서트 화환 서포트', titleEn: 'V01D First Solo Concert Wreath', titleJp: 'V01D 初単独コンサート 花輪サポート',
    descKo: '첫 단독 콘서트를 축하하는 쌀 화환을 보냈어요.', descEn: 'Sent a rice wreath for the first solo concert.', descJp: '初単独コンサートを祝うお米の花輪を送りました。',
    targetDuk: 600000, accumulatedDuk: 600000,
    startAt: '2026.03.01 10:00', endAt: '2026.03.20 23:59',
    cheerers: [
      ch('voidlover', [[150000, '2026.03.02 09:00'], [100000, '2026.03.12 18:20']]),
      ch('first_fan', [[200000, '2026.03.05 20:00']]),
      ch('void_day1', [[90000, '2026.03.10 11:30'], [60000, '2026.03.15 22:00']]),
    ],
    result: {
      messageKo: '여러분의 응원 덕분에 멋진 쌀 화환을 전달했어요. 감사합니다!',
      messageEn: 'Thanks to your support, we delivered a wonderful rice wreath!',
      messageJp: '皆さんの応援のおかげで素敵なお米の花輪を届けました！',
      mediaUrls: ['result-1.jpg', 'result-2.jpg', 'result-3.jpg'],
    },
    createdAt: '2026.02.25 15:00', updatedAt: '2026.03.22 18:00',
  },
  {
    id: 5, status: '미달성종료', groupName: 'CELEBUS',
    titleKo: 'CELEBUS 1주년 옥외 전광판 서포트', titleEn: 'CELEBUS 1st Anniversary Billboard', titleJp: 'CELEBUS 1周年 屋外ビジョン サポート',
    descKo: '1주년 기념 옥외 전광판 광고를 준비했어요.', descEn: 'Planned a billboard ad for the 1st anniversary.', descJp: '1周年記念の屋外ビジョン広告を準備しました。',
    targetDuk: 3000000, accumulatedDuk: 1100000,
    startAt: '2026.04.01 10:00', endAt: '2026.04.21 23:59',
    cheerers: [
      ch('celebus_one', [[350000, '2026.04.02 10:00'], [250000, '2026.04.10 19:00']], true, '2026.04.22 00:01'),
      ch('day1_celeb', [[500000, '2026.04.08 21:00']], true, '2026.04.22 00:01'),
    ],
    createdAt: '2026.03.28 11:00', updatedAt: '2026.04.22 00:01',
  },
  {
    id: 6, status: '집행취소', groupName: 'iKON',
    titleKo: 'iKON 음악방송 응원 도시락 서포트', titleEn: 'iKON Music Show Lunchbox Support', titleJp: 'iKON 音楽番組 応援弁当 サポート',
    descKo: '음악방송 스태프 응원 도시락을 준비하려 했어요.', descEn: 'Planned support lunchboxes for music show staff.', descJp: '音楽番組スタッフ応援弁当を準備予定でした。',
    targetDuk: 500000, accumulatedDuk: 500000,
    startAt: '2026.03.10 10:00', endAt: '2026.03.25 23:59',
    cheerers: [
      ch('ikonic_og', [[200000, '2026.03.11 09:00'], [100000, '2026.03.20 12:00']], true, '2026.03.28 10:00'),
      ch('konic_love', [[200000, '2026.03.15 18:00']], true, '2026.03.28 10:00'),
    ],
    createdAt: '2026.03.05 14:00', updatedAt: '2026.03.28 10:00',
  },
  {
    id: 7, status: '임시저장', groupName: 'MADEIN',
    titleKo: 'MADEIN 첫 팬미팅 서포트 (작성 중)', titleEn: '', titleJp: '',
    descKo: '첫 팬미팅 서포트 기획안입니다.', descEn: '', descJp: '',
    targetDuk: 1000000, accumulatedDuk: 0,
    startAt: '2026.06.01 10:00', endAt: '2026.06.20 23:59',
    cheerers: [],
    createdAt: '2026.05.27 17:00', updatedAt: '2026.05.27 17:00',
  },
];

export function getSupportById(id: number): SupportEvent | undefined {
  return supportEvents.find((e) => e.id === id);
}

// 응원·반환 변동 내역 시드 — [CEB-BO-SUP-401]
// 개별 응원 건 단위로 기록 (동일 회원의 다회 응원이 각각 1행) — [CEB-DUK-201] §2.4
export const supportLedger: CheerLedger[] = [
  { id: 1, type: '응원', member: 'voidlover', eventName: 'V01D 데뷔 200일 지하철 광고 서포트', groupName: 'V01D', amount: 200000, at: '2026.05.20 10:12' },
  { id: 2, type: '응원', member: '신노스케fan', eventName: 'V01D 데뷔 200일 지하철 광고 서포트', groupName: 'V01D', amount: 250000, at: '2026.05.21 21:30' },
  { id: 3, type: '응원', member: 'voidlover', eventName: 'V01D 데뷔 200일 지하철 광고 서포트', groupName: 'V01D', amount: 120000, at: '2026.05.23 08:00' },
  { id: 4, type: '응원', member: '신노스케fan', eventName: 'V01D 데뷔 200일 지하철 광고 서포트', groupName: 'V01D', amount: 150000, at: '2026.05.26 22:10' },
  { id: 5, type: '응원', member: 'ikonic_99', eventName: 'iKON 콘서트 응원 트럭 서포트', groupName: 'iKON', amount: 350000, at: '2026.05.02 11:00' },
  { id: 6, type: '응원', member: 'ikonic_99', eventName: 'iKON 콘서트 응원 트럭 서포트', groupName: 'iKON', amount: 250000, at: '2026.05.12 20:30' },
  { id: 7, type: '응원', member: 'gunwook_p', eventName: 'MADEIN 데뷔 축하 카페 서포트', groupName: 'MADEIN', amount: 180000, at: '2026.04.11 10:30' },
  { id: 8, type: '응원', member: 'gunwook_p', eventName: 'MADEIN 데뷔 축하 카페 서포트', groupName: 'MADEIN', amount: 120000, at: '2026.04.18 09:00' },
  { id: 9, type: '반환', member: 'celebus_one', eventName: 'CELEBUS 1주년 옥외 전광판 서포트', groupName: 'CELEBUS', amount: -600000, at: '2026.04.22 00:01' },
  { id: 10, type: '반환', member: 'day1_celeb', eventName: 'CELEBUS 1주년 옥외 전광판 서포트', groupName: 'CELEBUS', amount: -500000, at: '2026.04.22 00:01' },
  { id: 11, type: '반환', member: 'ikonic_og', eventName: 'iKON 음악방송 응원 도시락 서포트', groupName: 'iKON', amount: -300000, at: '2026.03.28 10:00' },
  { id: 12, type: '결과물 알림', member: 'voidlover', eventName: 'V01D 첫 단독 콘서트 화환 서포트', groupName: 'V01D', amount: 0, at: '2026.03.22 18:00' },
  { id: 13, type: '결과물 알림', member: 'first_fan', eventName: 'V01D 첫 단독 콘서트 화환 서포트', groupName: 'V01D', amount: 0, at: '2026.03.22 18:00' },
];

export const LEDGER_TYPES: CheerLedgerType[] = ['응원', '반환', '결과물 알림'];
export const SUPPORT_EVENT_NAMES = Array.from(new Set(supportEvents.map((e) => e.titleKo)));
