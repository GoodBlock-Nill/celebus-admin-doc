import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE } from './constants';
import { KST_WEEKDAY_LABELS, kstParts } from './time';

const MASK_CHARACTER = '*';
const PHONE_MIDDLE_MASK = '****';
const MIN_MASKABLE_NAME_LENGTH = 2;
/** 계좌번호에서 그대로 노출하는 앞자리 수 */
const ACCOUNT_VISIBLE_LENGTH = 3;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** 금액 표시 — 1,234원 */
export function formatKrw(amount: number): string {
  return `${Math.round(amount).toLocaleString('ko-KR')}원`;
}

/** 일시 표시 — 2026.10.15 19:00 (한국 시각 기준) */
export function formatDateTime(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '-';
  const { year, month, day, hour, minute } = kstParts(parsed);
  return `${year}.${pad2(month)}.${pad2(day)} ${pad2(hour)}:${pad2(minute)}`;
}

/** 날짜만 표시 — 2026.10.15(수) */
export function formatDateWithWeekday(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '-';
  const { year, month, day, weekdayIndex } = kstParts(parsed);
  return `${year}.${pad2(month)}.${pad2(day)}(${KST_WEEKDAY_LABELS[weekdayIndex]})`;
}

/** 날짜 + 시각 표시 — 2026.10.14(수) 23:59 */
export function formatDateTimeWithWeekday(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '-';
  const { hour, minute } = kstParts(parsed);
  return `${formatDateWithWeekday(iso)} ${pad2(hour)}:${pad2(minute)}`;
}

/** 남은 시간 표시 — "3시간 20분 남음" / "마감 지남" */
export function formatRemaining(deadlineIso: string, now: Date): string {
  const parsed = new Date(deadlineIso);
  if (Number.isNaN(parsed.getTime())) return '-';

  const remainMs = parsed.getTime() - now.getTime();
  if (remainMs <= 0) return '마감 지남';

  if (remainMs >= MS_PER_DAY) {
    const days = Math.floor(remainMs / MS_PER_DAY);
    const hours = Math.floor((remainMs % MS_PER_DAY) / MS_PER_HOUR);
    return `${days}일 ${hours}시간 남음`;
  }

  if (remainMs >= MS_PER_HOUR) {
    const hours = Math.floor(remainMs / MS_PER_HOUR);
    const minutes = Math.floor((remainMs % MS_PER_HOUR) / MS_PER_MINUTE);
    return `${hours}시간 ${minutes}분 남음`;
  }

  const minutes = Math.floor(remainMs / MS_PER_MINUTE);
  if (minutes < 1) return '1분 미만 남음';
  return `${minutes}분 남음`;
}

/** 경과 시간 표시 — "2일 3시간 경과" / "12분 경과" */
export function formatElapsed(startIso: string, now: Date): string {
  const parsed = new Date(startIso);
  if (Number.isNaN(parsed.getTime())) return '-';

  const elapsedMs = now.getTime() - parsed.getTime();
  if (elapsedMs < MS_PER_MINUTE) return '방금';

  if (elapsedMs >= MS_PER_DAY) {
    const days = Math.floor(elapsedMs / MS_PER_DAY);
    const hours = Math.floor((elapsedMs % MS_PER_DAY) / MS_PER_HOUR);
    return `${days}일 ${hours}시간 경과`;
  }

  if (elapsedMs >= MS_PER_HOUR) {
    const hours = Math.floor(elapsedMs / MS_PER_HOUR);
    const minutes = Math.floor((elapsedMs % MS_PER_HOUR) / MS_PER_MINUTE);
    return `${hours}시간 ${minutes}분 경과`;
  }

  return `${Math.floor(elapsedMs / MS_PER_MINUTE)}분 경과`;
}

/** 이름 마스킹 — 홍길동 → 홍*동 */
export function maskName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return '';
  if (trimmed.length < MIN_MASKABLE_NAME_LENGTH) return MASK_CHARACTER;
  if (trimmed.length === MIN_MASKABLE_NAME_LENGTH) return `${trimmed[0]}${MASK_CHARACTER}`;
  const middle = MASK_CHARACTER.repeat(trimmed.length - 2);
  return `${trimmed[0]}${middle}${trimmed[trimmed.length - 1]}`;
}

/** 계좌번호 마스킹 — 110123456789 → 110********* (앞 3자리만 노출) */
export function maskAccountNumber(account: string): string {
  const trimmed = account.trim();
  if (trimmed.length === 0) return '';
  if (trimmed.length <= ACCOUNT_VISIBLE_LENGTH) return MASK_CHARACTER.repeat(trimmed.length);
  const head = trimmed.slice(0, ACCOUNT_VISIBLE_LENGTH);
  return `${head}${MASK_CHARACTER.repeat(trimmed.length - ACCOUNT_VISIBLE_LENGTH)}`;
}

/** 휴대폰번호 마스킹 — 01012345678 → 010-****-5678 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return phone;
  const head = digits.slice(0, 3);
  const tail = digits.slice(-4);
  return `${head}-${PHONE_MIDDLE_MASK}-${tail}`;
}
