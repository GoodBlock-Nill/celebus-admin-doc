// 아티스트 소식/일정/공지 — 앱 [CEB-INF-101] 정보 피드 디자인 정합 mock

export type FeedType = '소식' | '일정' | '공지';
export type FeedStatus = '게시' | '임시저장' | '보관';
export type ContentPlatform = '유튜브' | '틱톡' | '스포티파이' | '스레드' | '인스타그램' | 'X' | '웹';

export const CONTENT_PLATFORMS: ContentPlatform[] = ['유튜브', '틱톡', '스포티파이', '스레드', '인스타그램', 'X', '웹'];

// 다국어 (LangField 키 정합: KO/EN/JA)
export interface ML {
  KO: string;
  EN: string;
  JA: string;
}

export interface RelatedContent {
  platform: ContentPlatform;
  name: string;
  url: string;
}

export interface FeedItem {
  id: number;
  type: FeedType;
  status: FeedStatus;
  groupName: string;
  official: boolean; // 공식 출처 (소식·일정)
  title: ML; // 제목 / 일정명
  date: string; // 소식·공지=게시일 / 일정=일자 (YYYY.MM.DD)
  views?: number;
  likes?: number;
  // 일정
  time?: string; // HH:mm
  location?: string;
  // 소식
  body?: ML;
  images?: string[]; // 첨부 이미지 파일명 (최대 10)
  relatedContents?: RelatedContent[]; // 최대 3
  // 공지
  coverImage?: string; // 대표 이미지 (파일명)
  ctaLabel?: string;
  ctaUrl?: string;
}

const ml = (KO: string, EN = '', JA = ''): ML => ({ KO, EN, JA });

const TUG_BODY = ml(
  'V01D가 신곡 "Tug of War"의 뮤직비디오를 공개했습니다.\n\n이번 뮤직비디오는 서울 도심 곳곳에서 촬영되었으며, V01D 멤버들의 강렬한 퍼포먼스와 감각적인 영상미가 돋보입니다.\n\n"Tug of War"는 데뷔 이후 첫 번째 타이틀곡으로, 발매 24시간 만에 스트리밍 100만 회를 돌파하며 글로벌 차트에서도 좋은 성적을 거두고 있습니다.',
  'V01D has released the music video for their new single "Tug of War".\n\nFilmed across downtown Seoul, the video highlights the members\' powerful performance and refined visuals.\n\nAs their first title track since debut, it surpassed 1 million streams within 24 hours and is performing well on global charts.',
  'V01Dが新曲「Tug of War」のミュージックビデオを公開しました。\n\n今回のMVはソウル都心の各所で撮影され、メンバーの力強いパフォーマンスと感覚的な映像美が際立ちます。\n\nデビュー以来初のタイトル曲として、公開24時間でストリーミング100万回を突破し、グローバルチャートでも好成績を収めています。',
);

export const feedItems: FeedItem[] = [
  // 일정 (장소 / 부제·썸네일 없음)
  { id: 1, type: '일정', status: '게시', groupName: 'V01D', official: true, title: ml('MBC 음악중심 출연', 'MBC Music Core Appearance', 'MBC 音楽中心 出演'), date: '2026.05.18', time: '12:00', location: '잠실 MBC 방송센터', views: 1240 },
  { id: 2, type: '일정', status: '게시', groupName: 'V01D', official: true, title: ml('뮤직뱅크 출연', 'Music Bank Appearance', 'ミュージックバンク 出演'), date: '2026.05.20', time: '12:00', location: 'KBS 본관', views: 980 },
  { id: 3, type: '일정', status: '게시', groupName: 'V01D', official: true, title: ml('런닝맨 출연', 'Running Man Appearance', 'ランニングマン 出演'), date: '2026.08.18', time: '12:00', location: 'SBS 목동 방송센터', views: 312 },
  { id: 4, type: '일정', status: '게시', groupName: 'V01D', official: false, title: ml('V01D 팬미팅', 'V01D Fan Meeting', 'V01D ファンミーティング'), date: '2026.04.30', time: '14:00', location: '여의도 IFC몰', views: 2050 },
  { id: 5, type: '일정', status: '임시저장', groupName: 'iKON', official: true, title: ml('iKON 콘서트 추가 공연', '', ''), date: '2026.06.15', time: '18:00', location: '고척 스카이돔', views: 0 },

  // 소식 (다국어 본문 + 이미지 배열 + 연관 콘텐츠)
  { id: 6, type: '소식', status: '게시', groupName: 'V01D', official: true, title: ml('V01D 신곡 "Tug of War" 뮤직비디오 공개', 'V01D Drops "Tug of War" Music Video', 'V01D 新曲「Tug of War」MV公開'), date: '2026.05.18', body: TUG_BODY, images: ['tugofwar-mv-1.jpg', 'tugofwar-mv-2.jpg', 'tugofwar-bts.jpg'], views: 5210, likes: 2000, relatedContents: [
    { platform: '유튜브', name: 'V01D(보이드) Tug of War MV', url: 'https://youtube.com/watch?v=void-tug' },
    { platform: 'X', name: 'V01D(보이드) Tug of War', url: 'https://x.com/void/status/123' },
    { platform: '스포티파이', name: 'V01D(보이드) Tug of War', url: 'https://open.spotify.com/track/void-tug' },
  ]},
  { id: 7, type: '소식', status: '게시', groupName: 'V01D', official: true, title: ml('V01D 일본 데뷔 확정', 'V01D Confirms Japan Debut', 'V01D 日本デビュー決定'), date: '2026.04.30', body: ml('V01D의 일본 데뷔가 확정되었습니다. 자세한 일정은 추후 공개됩니다.', 'V01D\'s Japan debut is confirmed. Details will be announced soon.', 'V01Dの日本デビューが決定しました。詳細は後日公開されます。'), images: ['japan-debut.jpg'], views: 4120, likes: 1340, relatedContents: [] },
  { id: 8, type: '소식', status: '게시', groupName: 'V01D', official: false, title: ml('V01D 새 앨범 프리뷰 공개', 'V01D New Album Preview', 'V01D 新アルバム プレビュー公開'), date: '2026.05.18', body: ml('새 앨범의 프리뷰 영상이 공개되었습니다.', 'A preview video for the new album has been released.', '新アルバムのプレビュー映像が公開されました。'), images: [], views: 2890, likes: 720, relatedContents: [
    { platform: '인스타그램', name: 'V01D 앨범 프리뷰', url: 'https://instagram.com/p/void-preview' },
  ]},
  { id: 9, type: '소식', status: '보관', groupName: 'MADEIN', official: true, title: ml('MADEIN 데뷔 1주년 기념 화보 공개', 'MADEIN 1st Anniversary Photobook', 'MADEIN デビュー1周年 グラビア公開'), date: '2026.03.02', body: ml('데뷔 1주년을 기념한 화보가 공개되었습니다.', 'A photobook celebrating the 1st debut anniversary has been released.', 'デビュー1周年を記念したグラビアが公開されました。'), images: ['madein-1y-1.jpg', 'madein-1y-2.jpg'], views: 7400, likes: 3100, relatedContents: [] },

  // 공지 (다국어 본문 + 대표 이미지 + CTA)
  { id: 10, type: '공지', status: '게시', groupName: 'V01D', official: false, title: ml('V01D 팬미팅 좌석 배치 변경 안내', 'V01D Fan Meeting Seating Change Notice', 'V01D ファンミーティング 座席変更のお知らせ'), date: '2026.04.20', body: ml('V01D 팬미팅의 좌석 배치가 일부 변경되어 안내드립니다.\n\n변경된 좌석은 CELEBUS 앱 Event 탭에서 확인하세요. 문의사항은 고객센터로 연락해주세요.', 'The seating arrangement for the V01D fan meeting has been partially changed.\n\nPlease check the updated seats in the CELEBUS app Event tab. Contact customer service for inquiries.', 'V01Dファンミーティングの座席配置が一部変更されました。\n\n変更後の座席はCELEBUSアプリのEventタブでご確認ください。お問い合わせはカスタマーセンターまで。'), coverImage: 'fanmeeting-seat.png', ctaLabel: '좌석 배치도 확인하기', ctaUrl: 'https://celebus.app/event/seat', views: 3300 },
  { id: 11, type: '공지', status: '게시', groupName: 'V01D', official: false, title: ml('V01D 콘서트 MD 사전예약 안내', 'V01D Concert MD Pre-order Notice', 'V01D コンサートMD 事前予約のお知らせ'), date: '2026.04.20', body: ml('콘서트 MD 사전예약 안내입니다.\n\n2026.04.20 오후 12시에 오픈됩니다. 문의사항은 고객센터로 연락해주세요.', 'Concert MD pre-order notice.\n\nOpens at 12:00 PM on 2026.04.20. Contact customer service for inquiries.', 'コンサートMD事前予約のお知らせです。\n\n2026.04.20 12時にオープンします。お問い合わせはカスタマーセンターまで。'), coverImage: '', ctaLabel: '사전예약 링크', ctaUrl: 'https://celebus.app/md/preorder', views: 2110 },
  { id: 12, type: '공지', status: '임시저장', groupName: 'iKON', official: false, title: ml('iKON 공식 굿즈 입고 지연 안내', '', ''), date: '2026.05.25', body: ml('굿즈 입고가 지연되어 안내드립니다.', '', ''), coverImage: '', ctaLabel: '', ctaUrl: '', views: 0 },

  // 상태 보강 — 각 타입 탭에 게시/임시저장/보관 3상태 모두 존재 (프로토타입 참고용)
  // 소식 임시저장
  { id: 13, type: '소식', status: '임시저장', groupName: 'V01D', official: false, title: ml('V01D 컴백 D-7 스페셜 영상 공개 예정', 'V01D Comeback D-7 Special Video Coming Soon', 'V01D カムバックD-7 スペシャル映像 公開予定'), date: '2026.05.26', body: ml('컴백을 일주일 앞두고 스페셜 영상이 공개될 예정입니다. (작성 중)', 'A special video will be released one week ahead of the comeback. (Draft)', 'カムバックを一週間後に控え、スペシャル映像が公開される予定です。(作成中)'), images: ['comeback-teaser.jpg'], views: 0, likes: 0, relatedContents: [] },

  // 일정 보관
  { id: 14, type: '일정', status: '보관', groupName: 'V01D', official: true, title: ml('V01D 데뷔 쇼케이스', 'V01D Debut Showcase', 'V01D デビューショーケース'), date: '2026.02.03', time: '19:00', location: '예스24 라이브홀', views: 5600 },

  // 공지 보관
  { id: 15, type: '공지', status: '보관', groupName: 'V01D', official: false, title: ml('V01D 1st 미니앨범 예약판매 종료 안내', 'V01D 1st Mini Album Pre-order Closed', 'V01D 1stミニアルバム 予約販売終了のお知らせ'), date: '2026.03.15', body: ml('1st 미니앨범 예약판매가 종료되었습니다. 많은 관심에 감사드립니다.', 'Pre-orders for the 1st mini album have closed. Thank you for your interest.', '1stミニアルバムの予約販売は終了しました。たくさんのご関心ありがとうございました。'), coverImage: 'minialbum-preorder.png', ctaLabel: '', ctaUrl: '', views: 4800 },
];

export const FEED_GROUPS = ['V01D', 'iKON', 'MADEIN', 'CELEBUS', '언더라이트 (UNDER:LIGHT)'];

// 장소 자동완성 목업 — 구글 장소 검색 UX 시뮬레이션용 샘플
export const SAMPLE_PLACES = [
  '잠실 MBC 방송센터',
  '잠실 종합운동장',
  '고척 스카이돔',
  'KBS 본관',
  'SBS 목동 방송센터',
  '여의도 IFC몰',
  '올림픽공원 체조경기장 (KSPO DOME)',
  '인스파이어 아레나',
  '고양종합운동장',
  '부산 BEXCO',
  '도쿄돔',
  '사이타마 슈퍼아레나',
];

export function getFeedById(id: number): FeedItem | undefined {
  return feedItems.find((f) => f.id === id);
}
