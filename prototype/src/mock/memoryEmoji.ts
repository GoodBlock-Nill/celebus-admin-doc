// 기억저장소 감정 이모지 — 전역 라이브러리 + 아티스트 연결 구조
// 규격: [CEB-000] §7.5 — 이미지 업로드 전용, 전역 라이브러리 1회 등록 후 아티스트 연결
// 프로토타입 100% mock. 새로고침 시 초기값 복귀.

export interface LibraryEmoji {
  id: number;
  imageSrc: string;     // 이미지 파일명 (이미지 업로드 전용)
  labelKO: string;
  labelEN: string;
  labelJA: string;
  isPreset: boolean;    // 기본 제공 6종 여부
  memberUsed: boolean;  // 회원 사용 이력 — true면 전역 삭제 차단
}

export interface EmojiLink {
  id: number;           // 연결 id
  artistGroupId: number;
  emojiId: number;      // → LibraryEmoji.id
  order: number;        // 아티스트 내 표시 순서 (1부터)
  active: boolean;      // 사용여부 (미사용 시 앱 숨김)
}

export const MAX_LINK_PER_ARTIST = 40;
export const MAX_ACTIVE_EMOJI = 6;

// ─── 라이브러리 시드 ───────────────────────────────────────────────────────────
// 기본 제공 6종 (isPreset: true)
export const libraryEmojis: LibraryEmoji[] = [
  {
    id: 1,
    imageSrc: 'preset-seollem.png',
    labelKO: '설렘',
    labelEN: 'Flutter',
    labelJA: 'ときめき',
    isPreset: true,
    memberUsed: true,
  },
  {
    id: 2,
    imageSrc: 'preset-gamdong.png',
    labelKO: '감동',
    labelEN: 'Moved',
    labelJA: '感動',
    isPreset: true,
    memberUsed: true,
  },
  {
    id: 3,
    imageSrc: 'preset-sinnam.png',
    labelKO: '신남',
    labelEN: 'Excited',
    labelJA: 'ワクワク',
    isPreset: true,
    memberUsed: false,
  },
  {
    id: 4,
    imageSrc: 'preset-sarang.png',
    labelKO: '사랑',
    labelEN: 'Love',
    labelJA: '愛',
    isPreset: true,
    memberUsed: true,
  },
  {
    id: 5,
    imageSrc: 'preset-uwa.png',
    labelKO: '우와',
    labelEN: 'Amazed',
    labelJA: 'びっくり',
    isPreset: true,
    memberUsed: false,
  },
  {
    id: 6,
    imageSrc: 'preset-haengbok.png',
    labelKO: '행복',
    labelEN: 'Happy',
    labelJA: '幸せ',
    isPreset: true,
    memberUsed: false,
  },
  // 커스텀 예시 2종 (isPreset: false)
  {
    id: 7,
    imageSrc: 'custom-passion.png',
    labelKO: '열정',
    labelEN: 'Passion',
    labelJA: '情熱',
    isPreset: false,
    memberUsed: false,
  },
  {
    id: 8,
    imageSrc: 'custom-lightstick.png',
    labelKO: '응원봉',
    labelEN: 'Lightstick',
    labelJA: 'ペンライト',
    isPreset: false,
    memberUsed: false,
  },
];

// ─── 연결 시드 ────────────────────────────────────────────────────────────────
// 그룹 1: 기본 6종 전부 연결, 모두 active (사용 6/6)
// 그룹 2: 기본 6종 + 커스텀 2종 연결 (커스텀은 active:false — 사용 상한 6 보호)
// 그룹 3+: 빈 연결(미연결 상태 시연)
export const emojiLinks: EmojiLink[] = [
  // 그룹 1
  { id: 101, artistGroupId: 1, emojiId: 1, order: 1, active: true },
  { id: 102, artistGroupId: 1, emojiId: 2, order: 2, active: true },
  { id: 103, artistGroupId: 1, emojiId: 3, order: 3, active: true },
  { id: 104, artistGroupId: 1, emojiId: 4, order: 4, active: true },
  { id: 105, artistGroupId: 1, emojiId: 5, order: 5, active: true },
  { id: 106, artistGroupId: 1, emojiId: 6, order: 6, active: true },
  // 그룹 2
  { id: 201, artistGroupId: 2, emojiId: 1, order: 1, active: true },
  { id: 202, artistGroupId: 2, emojiId: 2, order: 2, active: true },
  { id: 203, artistGroupId: 2, emojiId: 3, order: 3, active: true },
  { id: 204, artistGroupId: 2, emojiId: 4, order: 4, active: true },
  { id: 205, artistGroupId: 2, emojiId: 5, order: 5, active: true },
  { id: 206, artistGroupId: 2, emojiId: 6, order: 6, active: true },
  { id: 207, artistGroupId: 2, emojiId: 7, order: 7, active: false },
  { id: 208, artistGroupId: 2, emojiId: 8, order: 8, active: false },
];
