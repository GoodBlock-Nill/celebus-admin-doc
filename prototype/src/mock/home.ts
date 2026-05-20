// 홈 운영(HOM) v4.0 — [CEB-BO-HOM-*] SSOT
// 슬롯(slot) 단위 재설계:
//  - 슬롯 = (slotKind × artistGroup) 자동 조합. 배너는 슬롯 안에 등록
//  - 위치(slotKind):
//    · MAIN (홈 메인 캐러셀, 최대 동시 8개)
//    · TODAY_TODO (홈 오늘의 할일, 1개 고정)
//    · TOGETHER (아티스트 메인 다함께, 최대 동시 8개)
//    · MISSION (아티스트 메인 미션, 1개 고정)
//  - 아티스트: 전역(null, MAIN·TODAY_TODO만) 또는 단일 아티스트

export type SlotKind = 'MAIN' | 'TODAY_TODO' | 'TOGETHER' | 'MISSION';
export type SlotTab = 'home' | 'artist';
export type SlotTargetMode = 'GLOBAL_ONLY' | 'ARTIST_ONLY';
export type BannerStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type ArtistGroup = 'V01D' | 'iKON' | 'CELEBUS' | 'MADEIN' | 'UNDER:LIGHT';

export type BannerPeriod =
  | { type: 'UNLIMITED' }
  | { type: 'CUSTOM'; openDt: string; closeDt: string };

export const ACTIVE_ARTISTS: ArtistGroup[] = [
  'V01D',
  'iKON',
  'CELEBUS',
  'MADEIN',
  'UNDER:LIGHT',
];

interface ImageSpec {
  ratio: string;       // 표시용 (예: '3:4', '3:1')
  recommended: string; // 권장 사이즈 (예: '900×1200')
}

interface SlotKindMeta {
  label: string;
  tab: SlotTab;
  capacity: 'MULTI' | 'SINGLE';
  capacityLimit: number | null;     // MULTI일 때 한도
  targetMode: SlotTargetMode;       // 전역 전용 / 아티스트 전용
  imageSpec: ImageSpec;             // 위치별 권장 이미지 비율·사이즈
}

export const SLOT_KIND_META: Record<SlotKind, SlotKindMeta> = {
  MAIN: {
    label: '메인',
    tab: 'home',
    capacity: 'MULTI',
    capacityLimit: 8,
    targetMode: 'GLOBAL_ONLY',
    imageSpec: { ratio: '1:1', recommended: '1080×1080' },
  },
  TODAY_TODO: {
    label: '오늘의 할일',
    tab: 'home',
    capacity: 'SINGLE',
    capacityLimit: 1,
    targetMode: 'ARTIST_ONLY',
    imageSpec: { ratio: '16:9', recommended: '1920×1080' },
  },
  TOGETHER: {
    label: '다함께',
    tab: 'artist',
    capacity: 'MULTI',
    capacityLimit: 8,
    targetMode: 'ARTIST_ONLY',
    imageSpec: { ratio: '16:9', recommended: '1920×1080' },
  },
  MISSION: {
    label: '미션',
    tab: 'artist',
    capacity: 'SINGLE',
    capacityLimit: 1,
    targetMode: 'ARTIST_ONLY',
    imageSpec: { ratio: '16:9', recommended: '1920×1080' },
  },
};

const SLOT_KINDS_BY_TAB: Record<SlotTab, SlotKind[]> = {
  home: ['MAIN', 'TODAY_TODO'],
  artist: ['TOGETHER', 'MISSION'],
};

const STATUS_LABEL: Record<BannerStatus, string> = {
  DRAFT: '임시저장',
  ACTIVE: '노출중',
  CLOSED: '노출 종료',
};

const STATUS_BADGE: Record<BannerStatus, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700' },
  ACTIVE: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  CLOSED: { bg: 'bg-slate-200', text: 'text-slate-600' },
};

const SLOT_KIND_BADGE: Record<SlotKind, { bg: string; text: string }> = {
  MAIN: { bg: 'bg-violet-100', text: 'text-violet-700' },
  TODAY_TODO: { bg: 'bg-amber-100', text: 'text-amber-700' },
  TOGETHER: { bg: 'bg-pink-100', text: 'text-pink-700' },
  MISSION: { bg: 'bg-sky-100', text: 'text-sky-700' },
};

export interface HomeBanner {
  id: number;
  slotKind: SlotKind;
  artistGroup: ArtistGroup | null;
  titleKO: string;
  titleEN: string;
  titleJP: string;
  subtitleKO: string;
  subtitleEN: string;
  subtitleJP: string;
  imageUrl: string;
  linkUrl: string;
  displayOrder: number; // MULTI 슬롯만 의미
  period: BannerPeriod;
  status: BannerStatus;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface Slot {
  slotKind: SlotKind;
  artistGroup: ArtistGroup | null;
  banners: HomeBanner[];
  meta: SlotKindMeta;
  activeCount: number;
  draftCount: number;
  closedCount: number;
  lastUpdatedAt: string | null;
  lastUpdatedBy: string | null;
}

export function getStatusLabel(s: BannerStatus): string {
  return STATUS_LABEL[s];
}
export function getStatusBadge(s: BannerStatus) {
  return STATUS_BADGE[s];
}
export function getSlotKindLabel(s: SlotKind): string {
  return SLOT_KIND_META[s].label;
}
export function getSlotKindBadge(s: SlotKind) {
  return SLOT_KIND_BADGE[s];
}
export function formatPeriod(period: BannerPeriod): string {
  if (period.type === 'UNLIMITED') return '무기한';
  return `${period.openDt} ~ ${period.closeDt}`;
}
export function getArtistDisplay(a: ArtistGroup | null): string {
  return a ?? '전역';
}

export const banners: HomeBanner[] = [
  // === MAIN — 전역 (홈 메인 캐러셀) ===
  {
    id: 1,
    slotKind: 'MAIN',
    artistGroup: null,
    titleKO: 'V01D journey #01 콘서트 초대',
    titleEN: 'V01D journey #01 Concert Invitation',
    titleJP: 'V01D journey #01 コンサートご招待',
    subtitleKO: '응모하고 단독 무대에 함께해요',
    subtitleEN: 'Enter the raffle and join us live',
    subtitleJP: '応募して特別ステージへ',
    imageUrl: '/home/banner-1.jpg',
    linkUrl: '/raffle/12',
    displayOrder: 1,
    period: { type: 'CUSTOM', openDt: '2026.05.07 10:00', closeDt: '2026.05.14 23:59' },
    status: 'ACTIVE',
    createdBy: 'nill',
    createdAt: '2026.05.06 16:30',
    updatedBy: 'nill',
    updatedAt: '2026.05.07 09:55',
  },
  {
    id: 2,
    slotKind: 'MAIN',
    artistGroup: null,
    titleKO: 'CELEBUS 1주년 — 함께한 시간',
    titleEN: 'CELEBUS 1st Anniversary',
    titleJP: 'CELEBUS 1周年',
    subtitleKO: '1년의 여정에 감사를 담아',
    subtitleEN: 'Thank you for the year',
    subtitleJP: '1年間ありがとう',
    imageUrl: '/home/banner-2.jpg',
    linkUrl: 'https://celebus.xyz/event/anniversary-2026',
    displayOrder: 2,
    period: { type: 'UNLIMITED' },
    status: 'ACTIVE',
    createdBy: 'admin',
    createdAt: '2026.04.25 14:00',
    updatedBy: 'admin',
    updatedAt: '2026.05.01 00:00',
  },
  {
    id: 3,
    slotKind: 'MAIN',
    artistGroup: null,
    titleKO: '5월 정기 점검 안내',
    titleEN: 'May Maintenance Notice',
    titleJP: '5月メンテナンスのお知らせ',
    subtitleKO: '5/15 02:00~04:00 서비스 일시 중지',
    subtitleEN: 'Service paused May 15, 02:00~04:00',
    subtitleJP: '5/15 02:00〜04:00 サービス一時停止',
    imageUrl: '/home/banner-3.jpg',
    linkUrl: '/info/102',
    displayOrder: 3,
    period: { type: 'CUSTOM', openDt: '2026.05.10 09:00', closeDt: '2026.05.15 04:00' },
    status: 'CLOSED',
    createdBy: 'admin',
    createdAt: '2026.05.09 18:00',
    updatedBy: 'admin',
    updatedAt: '2026.05.15 04:00',
  },

  // === TODAY_TODO — V01D ===
  {
    id: 201,
    slotKind: 'TODAY_TODO',
    artistGroup: 'V01D',
    titleKO: 'V01D 데뷔 100일 — 함께 축하해요',
    titleEN: 'V01D 100 Days — Celebrate Together',
    titleJP: 'V01Dデビュー100日',
    subtitleKO: '100일 챌린지 미션 참여',
    subtitleEN: 'Join the 100-day challenge',
    subtitleJP: '100日チャレンジに参加',
    imageUrl: '/home/todo-v01d.jpg',
    linkUrl: '/quest/15',
    displayOrder: 1,
    period: { type: 'CUSTOM', openDt: '2026.05.20 00:00', closeDt: '2026.06.20 23:59' },
    status: 'DRAFT',
    createdBy: 'nill',
    createdAt: '2026.05.08 17:20',
    updatedBy: 'nill',
    updatedAt: '2026.05.09 10:15',
  },

  // === TOGETHER — V01D (아티스트 메인 다함께 캐러셀) ===
  {
    id: 300,
    slotKind: 'TOGETHER',
    artistGroup: 'V01D',
    titleKO: 'V01D 트리비아 참가 안내',
    titleEN: 'Join V01D Trivia',
    titleJP: 'V01D トリビアに参加',
    subtitleKO: '오늘 잘 알고 있는지 확인해보세요',
    subtitleEN: 'See how well you know V01D today',
    subtitleJP: '今日のV01Dクイズ',
    imageUrl: '/home/together-v01d-1.jpg',
    linkUrl: '/quest/12',
    displayOrder: 1,
    period: { type: 'CUSTOM', openDt: '2026.04.10 00:00', closeDt: '2026.04.30 23:59' },
    status: 'CLOSED',
    createdBy: 'nill',
    createdAt: '2026.04.09 11:00',
    updatedBy: 'nill',
    updatedAt: '2026.04.30 23:59',
  },
  {
    id: 301,
    slotKind: 'TOGETHER',
    artistGroup: 'V01D',
    titleKO: 'V01D 5월의 소식',
    titleEN: "V01D's May News",
    titleJP: 'V01D 5月のニュース',
    subtitleKO: '이번 달 V01D 활동을 한눈에',
    subtitleEN: 'May activities at a glance',
    subtitleJP: '今月のV01D活動',
    imageUrl: '/home/together-v01d-2.jpg',
    linkUrl: '/info/110',
    displayOrder: 2,
    period: { type: 'UNLIMITED' },
    status: 'ACTIVE',
    createdBy: 'nill',
    createdAt: '2026.05.01 10:00',
    updatedBy: 'nill',
    updatedAt: '2026.05.01 10:00',
  },

  // === TOGETHER — iKON ===
  {
    id: 310,
    slotKind: 'TOGETHER',
    artistGroup: 'iKON',
    titleKO: 'iKON FOUREVER 투어 시작',
    titleEN: 'iKON FOUREVER Tour',
    titleJP: 'iKON FOUREVER ツアー',
    subtitleKO: '서울 공연 안내와 굿즈 정보',
    subtitleEN: 'Seoul shows and merch',
    subtitleJP: 'ソウル公演とグッズ',
    imageUrl: '/home/together-ikon.jpg',
    linkUrl: '/artists/ikon',
    displayOrder: 1,
    period: { type: 'UNLIMITED' },
    status: 'ACTIVE',
    createdBy: 'nill',
    createdAt: '2026.04.28 09:30',
    updatedBy: 'nill',
    updatedAt: '2026.05.01 00:00',
  },

  // === MISSION — V01D ===
  {
    id: 400,
    slotKind: 'MISSION',
    artistGroup: 'V01D',
    titleKO: 'V01D 데일리 미션 — 오늘의 한 곡 듣기',
    titleEN: 'V01D Daily — Today’s Song',
    titleJP: 'V01D デイリー 今日の1曲',
    subtitleKO: '하루 1곡 듣고 응모권 받기',
    subtitleEN: 'Listen daily for tickets',
    subtitleJP: '毎日1曲で応募券',
    imageUrl: '/home/mission-v01d.jpg',
    linkUrl: '/quest/16',
    displayOrder: 1,
    period: { type: 'UNLIMITED' },
    status: 'ACTIVE',
    createdBy: 'nill',
    createdAt: '2026.05.05 09:00',
    updatedBy: 'nill',
    updatedAt: '2026.05.05 09:00',
  },

  // === MISSION — MADEIN ===
  {
    id: 401,
    slotKind: 'MISSION',
    artistGroup: 'MADEIN',
    titleKO: 'MADEIN 새 미니앨범 사전 신청',
    titleEN: 'MADEIN New Mini Album Pre-Order',
    titleJP: 'MADEIN 新ミニアルバム予約',
    subtitleKO: '한정 굿즈 패키지 안내',
    subtitleEN: 'Limited goods package',
    subtitleJP: '限定グッズパッケージ',
    imageUrl: '/home/mission-madein.jpg',
    linkUrl: 'https://celebus.xyz/event/madein-preorder',
    displayOrder: 1,
    period: { type: 'CUSTOM', openDt: '2026.05.18 00:00', closeDt: '2026.06.10 23:59' },
    status: 'DRAFT',
    createdBy: 'admin',
    createdAt: '2026.05.17 14:20',
    updatedBy: 'admin',
    updatedAt: '2026.05.17 14:20',
  },
];

export function getBannerById(id: number): HomeBanner | undefined {
  return banners.find((b) => b.id === id);
}

// 슬롯 1개 — 빈 슬롯도 derived 가능
export function getSlot(slotKind: SlotKind, artistGroup: ArtistGroup | null): Slot {
  const list = banners.filter(
    (b) => b.slotKind === slotKind && b.artistGroup === artistGroup
  );
  const lastBanner = [...list].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];
  return {
    slotKind,
    artistGroup,
    banners: list.sort((a, b) => a.displayOrder - b.displayOrder),
    meta: SLOT_KIND_META[slotKind],
    activeCount: list.filter((b) => b.status === 'ACTIVE').length,
    draftCount: list.filter((b) => b.status === 'DRAFT').length,
    closedCount: list.filter((b) => b.status === 'CLOSED').length,
    lastUpdatedAt: lastBanner?.updatedAt ?? null,
    lastUpdatedBy: lastBanner?.updatedBy ?? null,
  };
}

// 탭별 자동 생성 슬롯 인벤토리
export function getSlotsForTab(tab: SlotTab): Slot[] {
  const kinds = SLOT_KINDS_BY_TAB[tab];
  const slots: Slot[] = [];
  for (const kind of kinds) {
    const meta = SLOT_KIND_META[kind];
    const targets: (ArtistGroup | null)[] =
      meta.targetMode === 'GLOBAL_ONLY' ? [null] : [...ACTIVE_ARTISTS];
    for (const artist of targets) {
      slots.push(getSlot(kind, artist));
    }
  }
  return slots;
}

// 탭별 합산 상태 카운트 (슬롯 내 배너 기준)
export function getTabStatusCounts(tab: SlotTab) {
  const slots = getSlotsForTab(tab);
  let total = 0;
  let active = 0;
  let draft = 0;
  let closed = 0;
  for (const s of slots) {
    total += s.banners.length;
    active += s.activeCount;
    draft += s.draftCount;
    closed += s.closedCount;
  }
  return { total, active, draft, closed };
}
