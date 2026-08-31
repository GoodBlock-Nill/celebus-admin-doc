/** 회원 앱 공통 스타일 토큰 — 라이트 예매 서비스 팔레트 */

export const APP_COLOR = {
  /** 페이지 그라운드 */
  ground: '#F7F7FA',
  /** 카드 서피스 */
  surface: '#FFFFFF',
  line: '#E5E8EB',
  /** 입력 필드 배경 */
  inputBg: '#F2F4F6',
  ink: '#191F28',
  muted: '#6B7684',
  disabled: '#B0B8C1',
  /** 브랜드 액센트 — 주 실행 버튼·선택 상태·활성 탭에만 사용 */
  accent: '#D6336C',
  accentTint: '#FDF2F7',
  success: '#12B76A',
  successTint: '#ECFDF3',
  /** 경고 문구 색 (배경은 warningTint) */
  warning: '#B54708',
  warningTint: '#FFFAEB',
  danger: '#D92D20',
  dangerTint: '#FEF3F2',
} as const;

/** 카드 그림자 — 과하지 않은 한 겹만 사용한다. */
export const CARD_SHADOW = 'shadow-[0_1px_3px_rgba(25,31,40,0.06)]';

/** 기본 서피스 카드 (모서리 16px) */
export const CARD = `rounded-2xl border border-[#E5E8EB] bg-white ${CARD_SHADOW}`;

/** 보조 텍스트 */
export const MUTED = 'text-[#6B7684]';

/** 본문 좌우 여백 */
export const PAGE_PADDING = 'px-4';

/** 본문 기본 크기 */
export const BODY_TEXT = 'text-[15px] leading-[1.6]';

/** 화면 제목 */
export const PAGE_TITLE = 'text-[18px] font-bold text-[#191F28]';

/** 카드 제목 */
export const CARD_TITLE = 'text-[16px] font-bold text-[#191F28]';

/** 금액 대형 표기 */
export const AMOUNT_TEXT = 'text-[22px] font-extrabold tabular-nums text-[#191F28]';

/** 입력 필드 */
export const INPUT =
  'w-full min-h-[48px] rounded-xl border border-[#E5E8EB] bg-[#F2F4F6] px-3.5 py-3 text-[15px] text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:border-[#D6336C] focus:bg-white';

/** 주요 실행 버튼 (모서리 12px) */
export const PRIMARY_BUTTON =
  'flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#D6336C] px-4 text-[15px] font-bold text-white transition disabled:bg-[#E5E8EB] disabled:text-[#B0B8C1]';

/** 보조 버튼 */
export const GHOST_BUTTON =
  'flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#E5E8EB] bg-white px-4 text-[15px] font-semibold text-[#191F28] transition disabled:text-[#B0B8C1]';

/** 위험 액션 버튼 */
export const DANGER_BUTTON =
  'flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#FDA29B] bg-[#FEF3F2] px-4 text-[15px] font-semibold text-[#D92D20]';

/** 숫자 정렬용 */
export const NUMERIC = 'tabular-nums';
