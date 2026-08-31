/** 회원 앱 공통 스타일 토큰 — 다크 팬 플랫폼 팔레트 */

export const APP_COLOR = {
  bg: '#0F1014',
  surface: '#191A20',
  border: '#2A2C34',
  text: '#F1F0EC',
  muted: '#9A9AA4',
  accent: '#F0426E',
  success: '#3DC98A',
  warning: '#F5B341',
  danger: '#F06548',
} as const;

/** 기본 서피스 카드 */
export const CARD = 'rounded-2xl border border-[#2A2C34] bg-[#191A20]';

/** 보조 텍스트 */
export const MUTED = 'text-[#9A9AA4]';

/** 본문 좌우 여백 */
export const PAGE_PADDING = 'px-4';

/** 입력 필드 */
export const INPUT =
  'w-full min-h-[48px] rounded-xl border border-[#2A2C34] bg-[#0F1014] px-3.5 py-3 text-[15px] text-[#F1F0EC] outline-none placeholder:text-[#5F606B] focus:border-[#F0426E]';

/** 주요 실행 버튼 */
export const PRIMARY_BUTTON =
  'flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#F0426E] px-4 text-[15px] font-bold text-white transition disabled:bg-[#24262E] disabled:text-[#6B6C77]';

/** 보조 버튼 */
export const GHOST_BUTTON =
  'flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#2A2C34] bg-[#191A20] px-4 text-[15px] font-semibold text-[#F1F0EC] transition disabled:text-[#6B6C77]';

/** 위험 액션 버튼 */
export const DANGER_BUTTON =
  'flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#F0654855] bg-[#F065481A] px-4 text-[15px] font-semibold text-[#F06548]';

/** 숫자 정렬용 */
export const NUMERIC = 'tabular-nums';
