// 홈 운영(HOM) MVP — [CEB-BO-HOM-*] SSOT
// ERD: event_banner / event_banner_translation (SQL 1, 2 테이블)
// 멀티아티스트: nullable artist_group_id (전역 배너 가능, 🟠 High)

export type BannerStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type BannerSourceType =
  | 'RAFFLE'
  | 'SUPPORT_EVENT'
  | 'QUEST'
  | 'BIVE_CAMPAIGN'
  | 'INF_NEWS'
  | 'PROMO';
export type ArtistGroup = 'V01D' | 'iKON' | 'CELEBUS' | null; // null = 전역
export type HomeCardType = 'BANNER_TOP' | 'NEW_NEWS' | 'FAN_QUEST' | 'BIVE_HIGHLIGHT' | 'SUPPORT_EVENT';

export interface HomeBanner {
  id: number;
  artistGroup: ArtistGroup;
  sourceType: BannerSourceType;
  sourceRefId: number | null;
  sourceRefName: string;
  titleKO: string;
  titleEN: string;
  titleJP: string;
  imageUrl: string;
  linkUrl: string;
  displayOrder: number;
  openDt: string;
  closeDt: string;
  status: BannerStatus;
  impressionCount: number;
  clickCount: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface HomeCard {
  id: number;
  cardType: HomeCardType;
  artistGroup: ArtistGroup;
  enabled: boolean;
  displayOrder: number;
  titleKO: string;
  description: string;
  sourceCount: number; // 카드가 표시하는 콘텐츠 수
}

const SOURCE_TYPE_BADGE: Record<BannerSourceType, { bg: string; text: string; label: string }> = {
  RAFFLE: { bg: 'bg-pink-100', text: 'text-pink-700', label: 'Raffle' },
  SUPPORT_EVENT: { bg: 'bg-rose-100', text: 'text-rose-700', label: '응원하기' },
  QUEST: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Quest' },
  BIVE_CAMPAIGN: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'BIVE' },
  INF_NEWS: { bg: 'bg-sky-100', text: 'text-sky-700', label: '소식' },
  PROMO: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '프로모션' },
};

export function getSourceTypeBadge(t: BannerSourceType) {
  return SOURCE_TYPE_BADGE[t];
}

export const banners: HomeBanner[] = [
  {
    id: 1,
    artistGroup: 'V01D',
    sourceType: 'RAFFLE',
    sourceRefId: 12,
    sourceRefName: 'V01D 콘서트 티켓 래플',
    titleKO: 'V01D journey #01 콘서트 초대',
    titleEN: 'V01D journey #01 Concert Invitation',
    titleJP: 'V01D journey #01 コンサートご招待',
    imageUrl: '/home/banner-1.jpg',
    linkUrl: '/raffle/12',
    displayOrder: 1,
    openDt: '2026.05.07 10:00',
    closeDt: '2026.05.14 23:59',
    status: 'ACTIVE',
    impressionCount: 12450,
    clickCount: 1832,
    createdBy: 'nill',
    createdAt: '2026.05.06 16:30',
    updatedBy: 'nill',
    updatedAt: '2026.05.07 09:55',
  },
  {
    id: 2,
    artistGroup: null,
    sourceType: 'PROMO',
    sourceRefId: null,
    sourceRefName: 'CELEBUS 1주년 캠페인',
    titleKO: 'CELEBUS 1주년 — 함께한 시간',
    titleEN: 'CELEBUS 1st Anniversary',
    titleJP: 'CELEBUS 1周年',
    imageUrl: '/home/banner-2.jpg',
    linkUrl: '/event/anniversary-2026',
    displayOrder: 2,
    openDt: '2026.05.01 00:00',
    closeDt: '2026.05.31 23:59',
    status: 'ACTIVE',
    impressionCount: 38201,
    clickCount: 4012,
    createdBy: 'admin',
    createdAt: '2026.04.25 14:00',
    updatedBy: 'admin',
    updatedAt: '2026.05.01 00:00',
  },
  {
    id: 3,
    artistGroup: 'iKON',
    sourceType: 'BIVE_CAMPAIGN',
    sourceRefId: 23,
    sourceRefName: 'iKON 컴백 BIVE 한정 에디션',
    titleKO: 'iKON 컴백 기념 BIVE 한정',
    titleEN: 'iKON Comeback Limited BIVE',
    titleJP: 'iKON カムバック限定BIVE',
    imageUrl: '/home/banner-3.jpg',
    linkUrl: '/bive/edition/23',
    displayOrder: 3,
    openDt: '2026.04.15 18:00',
    closeDt: '2026.05.15 23:59',
    status: 'ACTIVE',
    impressionCount: 8721,
    clickCount: 1240,
    createdBy: 'carl',
    createdAt: '2026.04.10 11:30',
    updatedBy: 'carl',
    updatedAt: '2026.04.15 17:55',
  },
  {
    id: 4,
    artistGroup: 'V01D',
    sourceType: 'QUEST',
    sourceRefId: 8,
    sourceRefName: 'V01D 데뷔 100일 퀘스트',
    titleKO: 'V01D 데뷔 100일 — 함께 축하해요',
    titleEN: '',
    titleJP: '',
    imageUrl: '/home/banner-4.jpg',
    linkUrl: '/quest/8',
    displayOrder: 4,
    openDt: '2026.05.20 00:00',
    closeDt: '2026.06.20 23:59',
    status: 'DRAFT',
    impressionCount: 0,
    clickCount: 0,
    createdBy: 'nill',
    createdAt: '2026.05.08 17:20',
    updatedBy: 'nill',
    updatedAt: '2026.05.09 10:15',
  },
  {
    id: 5,
    artistGroup: 'V01D',
    sourceType: 'SUPPORT_EVENT',
    sourceRefId: 4,
    sourceRefName: 'V01D 데뷔 100일 서포트 광고',
    titleKO: 'V01D 데뷔 100일 — 강남역 광고 응원',
    titleEN: 'V01D 100 Days Debut Cheer Ad',
    titleJP: 'V01D デビュー100日',
    imageUrl: '/home/banner-5.jpg',
    linkUrl: '/support/4',
    displayOrder: 5,
    openDt: '2026.04.01 00:00',
    closeDt: '2026.04.30 23:59',
    status: 'CLOSED',
    impressionCount: 24521,
    clickCount: 3201,
    createdBy: 'nill',
    createdAt: '2026.03.20 13:00',
    updatedBy: 'nill',
    updatedAt: '2026.05.01 00:30',
  },
  {
    id: 6,
    artistGroup: null,
    sourceType: 'INF_NEWS',
    sourceRefId: 102,
    sourceRefName: '5월 운영 점검 안내',
    titleKO: '5월 정기 점검 안내 (5/15 02:00~04:00)',
    titleEN: 'May Maintenance Notice',
    titleJP: '5月メンテナンスのお知らせ',
    imageUrl: '/home/banner-6.jpg',
    linkUrl: '/info/102',
    displayOrder: 6,
    openDt: '2026.05.10 09:00',
    closeDt: '2026.05.15 04:00',
    status: 'ACTIVE',
    impressionCount: 5210,
    clickCount: 412,
    createdBy: 'admin',
    createdAt: '2026.05.09 18:00',
    updatedBy: 'admin',
    updatedAt: '2026.05.09 18:00',
  },
];

export const homeCards: HomeCard[] = [
  { id: 1, cardType: 'BANNER_TOP', artistGroup: null, enabled: true, displayOrder: 1, titleKO: '상단 배너 슬라이드', description: '홈 최상단 배너 캐러셀 (자동 슬라이드 5초)', sourceCount: 6 },
  { id: 2, cardType: 'NEW_NEWS', artistGroup: 'V01D', enabled: true, displayOrder: 2, titleKO: 'V01D 최신 소식', description: 'V01D 카테고리 최근 5건 노출', sourceCount: 5 },
  { id: 3, cardType: 'FAN_QUEST', artistGroup: 'V01D', enabled: true, displayOrder: 3, titleKO: '진행 중 팬퀘스트', description: '활성 Quest 3건 + 응모 가능 Raffle 2건', sourceCount: 5 },
  { id: 4, cardType: 'BIVE_HIGHLIGHT', artistGroup: 'iKON', enabled: true, displayOrder: 4, titleKO: '이번 주 BIVE', description: 'iKON 한정 에디션 + 다음 민팅 이벤트', sourceCount: 3 },
  { id: 5, cardType: 'SUPPORT_EVENT', artistGroup: null, enabled: false, displayOrder: 5, titleKO: '진행 중 응원하기', description: '활성 응원 이벤트 노출 (현재 비활성화)', sourceCount: 0 },
];

export const bannerStats = {
  total: banners.length,
  active: banners.filter((b) => b.status === 'ACTIVE').length,
  draft: banners.filter((b) => b.status === 'DRAFT').length,
  closed: banners.filter((b) => b.status === 'CLOSED').length,
  globalCount: banners.filter((b) => b.artistGroup === null).length,
  totalImpression: banners.reduce((s, b) => s + b.impressionCount, 0),
  totalClick: banners.reduce((s, b) => s + b.clickCount, 0),
};

export function getBannerById(id: number): HomeBanner | undefined {
  return banners.find((b) => b.id === id);
}
