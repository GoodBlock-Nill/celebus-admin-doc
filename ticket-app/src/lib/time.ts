import { KST_OFFSET_MS, MS_PER_DAY } from './constants';

/** UTC 기준 Date를 한국 시각(KST) 벽시계로 읽기 위해 오프셋을 더한 Date로 변환 */
function toKstClock(date: Date): Date {
  return new Date(date.getTime() + KST_OFFSET_MS);
}

export interface KstParts {
  year: number; month: number; day: number;
  hour: number; minute: number; weekdayIndex: number;
}

/** KST 벽시계 기준 연/월/일/시/분 */
export function kstParts(date: Date): KstParts {
  const clock = toKstClock(date);
  return {
    year: clock.getUTCFullYear(),
    month: clock.getUTCMonth() + 1,
    day: clock.getUTCDate(),
    hour: clock.getUTCHours(),
    minute: clock.getUTCMinutes(),
    weekdayIndex: clock.getUTCDay(),
  };
}

export const KST_WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** KST 기준 해당 일자(+addDays)의 23:59:59 시각을 ISO 문자열로 반환 */
export function endOfKstDayIso(base: Date, addDays = 0): string {
  const { year, month, day } = kstParts(base);
  const endOfDayUtcMs = Date.UTC(year, month - 1, day, 23, 59, 59);
  return new Date(endOfDayUtcMs + addDays * MS_PER_DAY - KST_OFFSET_MS).toISOString();
}

/** KST 기준 해당 일자의 00:00:00 시각을 ISO 문자열로 반환 */
export function startOfKstDayIso(base: Date): string {
  const { year, month, day } = kstParts(base);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - KST_OFFSET_MS).toISOString();
}

/** KST 기준 yyMMdd (주문번호 생성용) */
export function kstYymmdd(date: Date): string {
  const { year, month, day } = kstParts(date);
  const yy = String(year % 100).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/** ISO 문자열이 기준 시각보다 과거인지 여부 */
export function isPast(iso: string, now: Date): boolean {
  return new Date(iso).getTime() < now.getTime();
}
