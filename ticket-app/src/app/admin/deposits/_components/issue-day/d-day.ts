import type { Tone } from '../../../_components/labels';
import { kstDayDiff } from '@/lib/time';

/** 공연일이 임박했다고 보는 기준 — 하루 전부터 */
export const IMMINENT_DAY_DIFF = 1;

export interface DdayView {
  label: string;
  tone: Tone;
  /** 오늘부터 공연일까지 남은 일수 (0이면 당일, 음수면 지난 공연) */
  diff: number | null;
}

/** 공연일 표시 — 당일·임박 여부를 색으로 함께 알린다 */
export function ddayView(startAt: string, now: Date): DdayView {
  const diff = kstDayDiff(startAt, now);
  if (diff === null) return { label: '일정 미정', tone: 'neutral', diff: null };
  if (diff === 0) return { label: '오늘 공연', tone: 'danger', diff };
  if (diff < 0) return { label: `공연 후 ${-diff}일`, tone: 'neutral', diff };
  return { label: `D-${diff}`, tone: diff <= IMMINENT_DAY_DIFF ? 'warning' : 'neutral', diff };
}
