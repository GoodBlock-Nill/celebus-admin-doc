import { KST_OFFSET_MS, MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE, MS_PER_SECOND } from '@/lib/constants';
import { kstParts } from '@/lib/time';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** 남은 시간을 초 단위까지 표시 — "2시간 05분 09초" */
export function formatCountdown(remainMs: number): string {
  if (remainMs <= 0) return '';

  const days = Math.floor(remainMs / MS_PER_DAY);
  const hours = Math.floor((remainMs % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((remainMs % MS_PER_HOUR) / MS_PER_MINUTE);
  const seconds = Math.floor((remainMs % MS_PER_MINUTE) / MS_PER_SECOND);

  if (days > 0) return `${days}일 ${pad2(hours)}시간 ${pad2(minutes)}분`;
  if (hours > 0) return `${hours}시간 ${pad2(minutes)}분 ${pad2(seconds)}초`;
  return `${minutes}분 ${pad2(seconds)}초`;
}

/** 한국 시각 기준 시:분:초 — "23:59:59" */
export function formatKstClock(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '-';
  const kst = new Date(parsed.getTime() + KST_OFFSET_MS);
  return `${pad2(kst.getUTCHours())}:${pad2(kst.getUTCMinutes())}:${pad2(kst.getUTCSeconds())}`;
}

/** 마감 시각 안내 문구 — "오늘 23:59:59까지" / "2026.10.16 23:59:59까지" */
export function formatDeadlineLabel(iso: string, now: Date): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '-';

  const target = kstParts(parsed);
  const base = kstParts(now);
  const clock = formatKstClock(iso);

  const dayDiff =
    Date.UTC(target.year, target.month - 1, target.day) - Date.UTC(base.year, base.month - 1, base.day);

  if (dayDiff === 0) return `오늘 ${clock}까지`;
  if (dayDiff === MS_PER_DAY) return `내일 ${clock}까지`;
  return `${target.year}.${pad2(target.month)}.${pad2(target.day)} ${clock}까지`;
}
