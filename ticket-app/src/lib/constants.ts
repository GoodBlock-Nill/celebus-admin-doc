/** 데모 전역 상수 — 매직넘버 금지 규칙에 따라 여기에 모아둔다. */

/** 밀리초 단위 시간 상수 */
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

/** 한국 표준시(UTC+9) 오프셋 */
export const KST_OFFSET_MS = 9 * MS_PER_HOUR;

/** 체크인 코드 길이 */
export const TICKET_CODE_LENGTH = 8;
/** 체크인 코드에 사용하는 문자 집합 (혼동 문자 0/O/1/I 제외) */
export const TICKET_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** 주문번호 접두 문자 */
export const ORDER_NO_PREFIX = 'T';
/** 주문번호 일련번호 자리수 */
export const ORDER_SEQ_DIGITS = 4;
/** 입금자명 보조 규칙에 사용하는 주문번호 뒷자리 수 */
export const ORDER_NO_TAIL_LENGTH = 4;

/** 신고 처리 기한(시간) — 접수 후 10시간 */
export const REPORT_SLA_HOURS = 10;

/** 회차 입장(QR 활성화) 기본 기준 — 시작 60분 전 */
export const DEFAULT_ENTRY_OPEN_MINUTES = 60;

/** 활동 로그 보관 최대 건수 */
export const MAX_ACTIVITY_LOGS = 300;

/** 데모 시연용 신고 접수 시각 오프셋 — 현재 기준 3시간 전 */
export const DEMO_REPORT_ELAPSED_HOURS = 3;

/** 로그 주체 표기 */
export const ACTOR_OPERATOR = '운영자';
export const ACTOR_SYSTEM = '시스템';
