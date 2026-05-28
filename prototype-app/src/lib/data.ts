// CELEBUS App — static dummy data modeled on Figma v.3 screens.

export interface Artist {
  id: string;
  name: string;
  logo: string;
  followed: boolean;
}

export const ARTISTS: Artist[] = [
  { id: 'v01d', name: 'V01D', logo: '/v01d/logo.png', followed: true },
  { id: 'ikon', name: 'iKON', logo: '/v01d/group.jpg', followed: true },
  { id: 'aespa', name: 'aespa', logo: '/v01d/avatar.jpg', followed: true },
  { id: 'madin', name: 'Madin', logo: '/v01d/kevin.jpg', followed: false },
];

export const ME = {
  nickname: 'v01d_lover',
  duk: 1200, // 보유 덕력
  dukEarned: 12000, // 획득 덕력 (랭킹 기준)
  tickets: 12, // 응모권
  growLevel: 3, // 키우기 레벨
  rank: 5,
  rankPercent: 9.4,
};

export const ARTIST = ARTISTS[0]; // V01D selected

// ── 캐러셀 배너 ──────────────────────────────
export interface Banner {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  image: string;
}
export const BANNERS: Banner[] = [
  { id: 'b1', tag: 'NOTICE', title: 'V01D 친필 싸인 앨범 래플', subtitle: '선착순 100명에게 주어지는 영상통화 & 싸인 앨범의 기회', image: '/v01d/group.jpg' },
  { id: 'b2', tag: 'NOTICE', title: '새로운 래플이 시작되었어요!', subtitle: '지금 응모하고 특별한 보상을 받아보세요', image: '/v01d/yuchan.jpg' },
];

// ── 래플 ──────────────────────────────
export type RaffleStatus = 'active' | 'tallying' | 'won' | 'lost' | 'closed';
export interface Raffle {
  id: string;
  artist: string;
  title: string;
  image: string;
  entries: number;
  winners: number;
  dday: number;
  period: string;
  status: RaffleStatus;
  myEntries: number;
}
export const RAFFLES: Raffle[] = [
  { id: 'r1', artist: 'iKON', title: '겨울 시즌 콘서트', image: '/v01d/group.jpg', entries: 1230, winners: 20, dday: 2, period: '2025.12.1 ~ 12.15', status: 'active', myEntries: 0 },
  { id: 'r2', artist: 'V01D', title: 'V01D 친필 싸인 앨범', image: '/v01d/yuchan.jpg', entries: 1230, winners: 20, dday: 2, period: '2025.12.1 ~ 12.15', status: 'active', myEntries: 3 },
  { id: 'r3', artist: 'iKON', title: '겨울 시즌 콘서트', image: '/v01d/jisub.jpg', entries: 1230, winners: 20, dday: 0, period: '2025.12.1 ~ 12.15', status: 'tallying', myEntries: 1 },
  { id: 'r4', artist: 'iKON', title: '겨울 시즌 콘서트', image: '/v01d/shinnosuke.jpg', entries: 1230, winners: 20, dday: -1, period: '2025.12.1 ~ 12.15', status: 'closed', myEntries: 0 },
];

// ── 서포트 ──────────────────────────────
export type SupportStatus = 'active' | 'achieved' | 'closed-success' | 'closed-fail' | 'cancelled';
export interface Support {
  id: string;
  artist: string;
  title: string;
  image: string;
  goal: number;
  current: number;
  percent: number;
  dday: number;
  period: string;
  status: SupportStatus;
  myDuk: number;
  participants: number;
  desc: string;
}
export const SUPPORTS: Support[] = [
  { id: 's1', artist: 'V01D', title: '보이드에 커피차 보내기', image: '/v01d/juyeon.jpg', goal: 15000, current: 13500, percent: 85, dday: 3, period: '2025.12.1 ~ 12.15', status: 'active', myDuk: 1900, participants: 128, desc: 'V01D 생일 기념 커피차를 보내주세요! 팬들의 마음을 모아 특별한 선물을 전달합니다.' },
  { id: 's2', artist: 'V01D', title: '아이콘 지하철 2호선 전광판', image: '/v01d/group.jpg', goal: 15000, current: 15000, percent: 100, dday: 0, period: '2025.12.1 ~ 12.15', status: 'achieved', myDuk: 500, participants: 210, desc: '지하철 전광판 광고로 V01D를 응원합니다.' },
  { id: 's3', artist: 'V01D', title: '아이콘 지하철 2호선 전광판', image: '/v01d/kevin.jpg', goal: 15000, current: 12750, percent: 85, dday: -1, period: '2025.12.1 ~ 12.15', status: 'closed-fail', myDuk: 300, participants: 90, desc: '목표 미달성으로 종료되었습니다.' },
];

// ── 퀘스트 (스토리 / 에피소드) ──────────────────────────────
export type EpisodeStatus = 'locked' | 'provisional' | 'active' | 'reviewing' | 'cleared';
export interface QuestMission {
  id: string;
  title: string;
  dukReward: number;
  ticketReward: number;
  status: 'incomplete' | 'submitted' | 'approved' | 'rejected';
}
export interface Episode {
  id: string;
  no: number;
  title: string;
  image: string;
  status: EpisodeStatus;
  total: number;
  done: number;
  missions: QuestMission[];
}
export const EPISODES: Episode[] = [
  {
    id: 'ep1', no: 1, title: 'V01D를 만나다', image: '/v01d/yuchan.jpg', status: 'active', total: 3, done: 0,
    missions: [
      { id: 'm1', title: '공식 X 팔로우', dukReward: 10, ticketReward: 1, status: 'incomplete' },
      { id: 'm2', title: '텍스트 다국어포함 최대 2줄까지 노출 가능! 어드민 입력시 참고해주세요!', dukReward: 10, ticketReward: 1, status: 'incomplete' },
      { id: 'm3', title: '공식 X 팔로우', dukReward: 10, ticketReward: 1, status: 'incomplete' },
    ],
  },
  { id: 'ep2', no: 2, title: 'V01D의 음악', image: '/v01d/jisub.jpg', status: 'locked', total: 3, done: 0, missions: [] },
  { id: 'ep3', no: 3, title: 'V01D 퀴즈 챌린지', image: '/v01d/shinnosuke.jpg', status: 'locked', total: 4, done: 0, missions: [] },
  { id: 'ep4', no: 4, title: 'V01D 예측', image: '/v01d/juyeon.jpg', status: 'locked', total: 3, done: 0, missions: [] },
  { id: 'ep5', no: 5, title: 'V01D를 알리다', image: '/v01d/group.jpg', status: 'locked', total: 3, done: 0, missions: [] },
];

// ── 오늘의 할 일 (일일 미션) ──────────────────────────────
export const ATTENDANCE = { streak: 3, doneToday: false, reward: 5, bonusDday: 4 };
export interface DailyMission {
  id: string;
  title: string;
  done: boolean;
}
export const DAILY_MISSIONS: DailyMission[] = [
  { id: 'd1', title: '게임존 방문', done: false },
  { id: 'd2', title: '기억저장소 방문', done: false },
];
export const WEEK = [
  { day: '월', date: 12, done: true }, { day: '화', date: 13, done: true }, { day: '수', date: 14, done: true, today: true },
  { day: '목', date: 15, done: false }, { day: '금', date: 16, done: false }, { day: '토', date: 17, done: false }, { day: '일', date: 18, done: false },
];

// ── 덕력 랭킹 ──────────────────────────────
export interface RankRow { rank: number; nickname: string; duk: number; me?: boolean; }
export const RANKING: RankRow[] = [
  { rank: 1, nickname: 'v01d_lover', duk: 12000 },
  { rank: 2, nickname: 'v01d_lover', duk: 11000 },
  { rank: 3, nickname: 'v01d_lover', duk: 10200 },
  { rank: 4, nickname: 'v01d_lover', duk: 10100 },
  { rank: 5, nickname: 'v01d_lover', duk: 10000, me: true },
  { rank: 6, nickname: 'v01d_lover', duk: 1200 },
  { rank: 7, nickname: 'v01d_lover', duk: 1100 },
  { rank: 8, nickname: 'v01d_lover', duk: 1050 },
  { rank: 9, nickname: 'v01d_lover', duk: 1000 },
  { rank: 10, nickname: 'v01d_lover', duk: 980 },
];
export const SEASON = { name: '4월 시즌', endDday: 17 };

// ── 덕력 내역 ──────────────────────────────
export interface DukHistoryItem { id: string; title: string; sub?: string; amount: number; link?: boolean; }
export interface DukHistoryGroup { date: string; items: DukHistoryItem[]; }
export const DUK_HISTORY: DukHistoryGroup[] = [
  { date: '2026. 04. 06', items: [
    { id: 'h1', title: '서포트 이벤트', sub: '커피차 서포트·반환', amount: 10, link: true },
    { id: 'h2', title: '독점 콘텐츠 해제', sub: '비하인드 사진', amount: -100, link: true },
    { id: 'h3', title: '서포트 이벤트', sub: '커피차 서포트', amount: -500, link: true },
    { id: 'h4', title: '출석 체크', amount: 10 },
  ]},
  { date: '2026. 01. 02', items: [
    { id: 'h5', title: '출석 체크', amount: 10 },
    { id: 'h6', title: '일일 미션 완료', amount: 20 },
    { id: 'h7', title: '출석 체크', sub: 'EP.01 · V01D 공식 X 팔로우', amount: 10 },
    { id: 'h8', title: '기억 저장', amount: 30 },
    { id: 'h9', title: '일일 미션 완료', amount: 20 },
    { id: 'h10', title: '시즌 보상', amount: 500 },
  ]},
];

// ── 키우기 (팬덤 레벨) ──────────────────────────────
export const GROW = {
  level: 3, remain: 2000, percent: 60, current: 3000, goal: 5000,
  participants: 324, totalDuk: 12000, myDuk: 150, myPercent: 0.4,
  levels: [
    { lv: 1, done: true }, { lv: 2, done: true }, { lv: 3, current: true }, { lv: 4 }, { lv: 5 },
  ],
  selectedReward: { lv: 3, items: [
    { name: '디지털 포카세트', status: '지급 완료', image: '/v01d/avatar.jpg' },
    { name: '사인앨범 래플', status: '참여 가능 · 100명 추첨', cta: true, image: '/v01d/group.jpg' },
  ]},
  earnCtas: [
    { label: '출석체크', reward: 10 }, { label: '도전게임', reward: 10 }, { label: '컬렉션 확인', reward: 10 },
  ],
};

// ── 정보 (소식·일정) ──────────────────────────────
export const NOTICE = { title: 'V01D 팬미팅 좌석 배치 변경 안내', date: '2026.04.20 KST' };
export interface InfoItem { id: string; type: 'schedule' | 'news'; official: boolean; title: string; sub?: string; time: string; artist: string; image?: string; }
export const INFO_TODAY: InfoItem[] = [
  { id: 'i1', type: 'schedule', official: false, title: 'MBC 음악중심 출연', sub: '잠실 MBC 방송센터', time: '2026.05.18 12:00', artist: 'V01D' },
  { id: 'i2', type: 'schedule', official: true, title: 'MBC 음악중심 출연 line2', sub: '잠실 MBC 방송센터', time: '2026.05.18 12:00', artist: 'V01D' },
  { id: 'i3', type: 'news', official: false, title: 'V01D 새 앨범 프리뷰 공개', time: '2026.05.18', artist: 'V01D' },
  { id: 'i4', type: 'news', official: true, title: 'V01D 일본 데뷔 확정 line2', time: '2026.05.18', artist: 'V01D', image: '/v01d/group.jpg' },
];
export const INFO_UPCOMING: InfoItem[] = [
  { id: 'u1', type: 'schedule', official: false, title: 'MBC 음악중심 출연', sub: '잠실 MBC 방송센터', time: '2026.05.19 12:00', artist: 'V01D' },
  { id: 'u2', type: 'schedule', official: true, title: '뮤직뱅크 출연', sub: 'KBS', time: '2026.05.21 12:00', artist: 'V01D' },
  { id: 'u3', type: 'schedule', official: true, title: '런닝맨 출연', sub: 'SBS', time: '2026.08.18 12:00', artist: 'V01D' },
];
export const WEEK_STRIP = [
  { day: '일', date: 17, count: 1 }, { day: '월', date: 18, count: 4, today: true }, { day: '화', date: 19, count: 0 },
  { day: '수', date: 20, count: 4 }, { day: '목', date: 21, count: 2 }, { day: '금', date: 22, count: 3 }, { day: '토', date: 23, count: 12 },
];

// ── 기억저장소 ──────────────────────────────
export const EMOTIONS = [
  { key: 'flutter', emoji: '😍', label: '설렘' }, { key: 'moved', emoji: '😭', label: '감동' },
  { key: 'excited', emoji: '🎉', label: '신남' }, { key: 'love', emoji: '💜', label: '사랑' },
  { key: 'wow', emoji: '🤩', label: '우와' }, { key: 'happy', emoji: '✨', label: '행복' },
];
export interface Memory { id: string; date: number; emotion: string; image?: string; text: string; place?: string; likes: number; views: number; author: string; isPublic: boolean; }
export const MY_MEMORIES: Memory[] = [
  { id: 'mem1', date: 18, emotion: '😍', image: '/v01d/yuchan.jpg', text: 'V01D 콘서트 D-1!!! 너무 설레에에에', place: '강남구 역삼동', likes: 0, views: 0, author: 'dases', isPublic: false },
  { id: 'mem2', date: 4, emotion: '🎉', image: '/v01d/jisub.jpg', text: '음방 직관 다녀왔어요', place: '잠실', likes: 12, views: 340, author: 'dases', isPublic: true },
  { id: 'mem3', date: 27, emotion: '💜', image: '/v01d/group.jpg', text: '데뷔 1주년 축하해', likes: 8, views: 210, author: 'dases', isPublic: true },
];
export const MEMORY_DATES = [4, 18, 27];
export const ALL_MEMORIES: Memory[] = [
  { id: 'a1', date: 18, emotion: '😍', image: '/v01d/yuchan.jpg', text: '오늘 음방 미쳤다', likes: 124, views: 2300, author: 'v01d_fan1', isPublic: true },
  { id: 'a2', date: 18, emotion: '💜', image: '/v01d/group.jpg', text: '단체샷 너무 좋아', likes: 98, views: 1800, author: 'v01d_fan2', isPublic: true },
  { id: 'a3', date: 17, emotion: '🎉', image: '/v01d/jisub.jpg', text: '지섭 무대 최고', likes: 76, views: 1500, author: 'v01d_lover', isPublic: true },
  { id: 'a4', date: 17, emotion: '✨', image: '/v01d/shinnosuke.jpg', text: '신노 셀카', likes: 64, views: 1200, author: 'kara_v', isPublic: true },
  { id: 'a5', date: 16, emotion: '😭', image: '/v01d/juyeon.jpg', text: '주연 직캠 감동', likes: 52, views: 980, author: 'fan_kr', isPublic: true },
  { id: 'a6', date: 16, emotion: '😍', image: '/v01d/kevin.jpg', text: '케빈 비주얼', likes: 41, views: 870, author: 'fan_jp', isPublic: true },
];

// ── 컬렉션 (BIVE 도감) ──────────────────────────────
export interface Bive { id: string; name: string; grade: number; image: string; owned: boolean; category: 'artist' | 'event' | 'special'; }
export const BIVES: Bive[] = [
  { id: 'b1', name: 'V01D Grade 1', grade: 1, image: '/v01d/yuchan.jpg', owned: true, category: 'artist' },
  { id: 'b2', name: 'V01D Grade 2', grade: 2, image: '/v01d/jisub.jpg', owned: true, category: 'artist' },
  { id: 'b3', name: 'V01D Grade 3', grade: 3, image: '/v01d/shinnosuke.jpg', owned: true, category: 'artist' },
  { id: 'b4', name: 'V01D Grade 4', grade: 4, image: '/v01d/juyeon.jpg', owned: false, category: 'artist' },
  { id: 'b5', name: 'V01D Grade 5', grade: 5, image: '/v01d/kevin.jpg', owned: false, category: 'artist' },
  { id: 'b6', name: 'Winter Special', grade: 5, image: '/v01d/group.jpg', owned: false, category: 'event' },
  { id: 'b7', name: 'Debut Edition', grade: 4, image: '/v01d/avatar.jpg', owned: true, category: 'event' },
  { id: 'b8', name: 'Fusion Special', grade: 5, image: '/v01d/group.jpg', owned: false, category: 'special' },
];

// ── 알림 ──────────────────────────────
export interface Notification { id: string; icon: string; title: string; desc: string; time: string; artist: string; unread: boolean; group: string; category: string; }
export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', icon: '🏆', title: '덕력 랭킹 새로운 시즌이 시작되었어요!', desc: '덕력을 쌓고 시즌 보상을 획득해보세요.', time: '55분 전', artist: 'V01D', unread: true, group: '오늘', category: 'artist' },
  { id: 'n2', icon: '🎁', title: '덕력 랭킹 시즌이 종료되었어요!', desc: '이번 시즌 {N}위 달성! 보상을 확인해보세요.', time: '55분 전', artist: 'V01D', unread: true, group: '오늘', category: 'artist' },
  { id: 'n3', icon: '✅', title: '퀘스트를 완료했어요!', desc: '[퀘스트명] 한정판 BIVE 에디션이 지급 되었어요.', time: '3시간 전', artist: 'V01D', unread: true, group: '오늘', category: 'artist' },
  { id: 'n4', icon: '🎁', title: '덕력 랭킹 시즌이 종료되었어요!', desc: '이번 시즌 {N}위 달성! 보상을 확인해보세요.', time: '1일 전', artist: 'V01D', unread: false, group: '어제', category: 'artist' },
  { id: 'n5', icon: '✅', title: '퀘스트를 완료했어요!', desc: '[퀘스트명] 한정판 BIVE 에디션이 지급 되었어요.', time: '1일 전', artist: 'V01D', unread: false, group: '어제', category: 'artist' },
  { id: 'n6', icon: '🏆', title: '덕력 랭킹 시즌이 종료되었어요!', desc: '이번 시즌 나의 순위를 확인해보세요', time: '2일 전', artist: 'V01D', unread: false, group: '지난 주', category: 'artist' },
  { id: 'n7', icon: '🎯', title: '아직 참여하지 않은 퀘스트가 있어요', desc: '지금 참여하고 보상을 받아보세요.', time: '오전 11:33', artist: 'V01D', unread: false, group: '지난 주', category: 'artist' },
];

// ── 시즌 보상 안내 (DUK-102) ──────────────────────────────
export const SEASON_REWARDS = [
  { tier: '1위 달성 시', items: ['사인 앨범'] },
  { tier: 'TOP 10 진입 시', items: ['사인 포토카드'] },
  { tier: 'TOP 10% 진입 시', items: ['사인 포토카드', '디지털 포토카드', '수퍼팬 뱃지'] },
];

// ── 내 보상 (DUK-105) ──────────────────────────────
export const MY_REWARDS = {
  selectedSeason: '3월 시즌',
  achievement: 'TOP 10 달성',
  rewards: [
    { name: '사인 포토카드', physical: true, status: '배송지 정보를 입력해주세요', image: '/v01d/group.jpg' },
    { name: '디지털 포토카드', physical: false, status: '보상이 지급되었어요', image: '/v01d/avatar.jpg' },
  ],
  deadline: '2026.06.30',
  seasons: [
    { name: '5월 시즌', badge: '1위 달성', period: '2026.05.01 ~ 2026.05.31', selected: false },
    { name: '3월 시즌', badge: 'TOP10% 달성', period: '2026.03.01 ~ 2026.03.31', selected: true },
  ],
};

// ── 장소 검색 (MEM 주소 등록) ──────────────────────────────
export const PLACES = [
  { name: '고척스카이돔', addr: '서울특별시 구로구 경인로' },
  { name: '구로구 고척동', addr: '서울특별시' },
  { name: '구로구 고척로21길', addr: '서울특별시' },
  { name: '고척고등학교', addr: '서울특별시 구로구 중앙로15길' },
];

// ── Quest 제출 (FQ-205) ──────────────────────────────
export const QUEST_SUBMIT = {
  badges: ['응모권 5장', '카드 랜덤 보상'],
  title: 'New Album [TAKE OFF] 구매 인증',
  desc: '앨범 구매 영수증을 찍어 올리면 응모권 5장과 한정판 뱃지를 드려요',
  links: ['앨범 구매하기', '공식 사이트'],
  guide: ['흐리거나 어두운 사진은 반려될 수 있어요', '같은 사진을 두번 올릴 수 없어요', '퀘스트와 다른 대상을 찍으면 안되요', '정면으로 찍어주세요'],
};

// ── 당첨 상세 (EVT-103) ──────────────────────────────
export const WIN_DETAIL = {
  title: '[래플 타이틀명]',
  pickup: '현장에서 수령해주세요',
  prize: 'V01D 1st Mini Album [01] 싸인 앨범',
  date: '2025. 12. 30 까지',
  hours: '08:00 - 17:00',
  place: '서울 ○○아트홀 로비',
  bring: '신분증',
};

// ── 설정 (MY-103) ──────────────────────────────
export const LANGUAGES = [
  { code: 'ko', label: '🇰🇷 한국어' }, { code: 'en', label: '🇺🇸 English' }, { code: 'ja', label: '🇯🇵 日本語' },
];
export const NOTI_SETTINGS = [
  { key: 'artist', title: '아티스트', desc: '팔로우한 아티스트 소식', kind: 'link' as const },
  { key: 'event', title: '이벤트', desc: '이벤트, 프로모션 알림', kind: 'toggle' as const, on: false },
  { key: 'game', title: '게임존', desc: '게임존 알림', kind: 'toggle' as const, on: false },
  { key: 'notice', title: '공지', desc: '보안 알림 및 중요한 업데이트', kind: 'toggle' as const, on: false },
];
