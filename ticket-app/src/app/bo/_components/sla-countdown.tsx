import { MS_PER_HOUR, MS_PER_MINUTE } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { Badge } from './ui';
import type { Tone } from './labels';

/** 밀리초를 "N시간 M분" 형태로 표기한다. */
export function formatDurationText(ms: number): string {
  const total = Math.max(0, ms);
  const hours = Math.floor(total / MS_PER_HOUR);
  const minutes = Math.floor((total % MS_PER_HOUR) / MS_PER_MINUTE);
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  if (minutes > 0) return `${minutes}분`;
  return '1분 미만';
}

export interface SlaView {
  tone: Tone;
  text: string;
  remainMs: number;
}

/** 기한까지 남은 시간을 톤·문구로 환산한다. */
export function resolveSla(deadlineAt: string, now: Date, warningMs: number): SlaView {
  const remainMs = new Date(deadlineAt).getTime() - now.getTime();
  if (Number.isNaN(remainMs)) return { tone: 'neutral', text: '-', remainMs: 0 };
  if (remainMs <= 0) {
    return { tone: 'danger', text: `기한 초과 ${formatDurationText(-remainMs)}`, remainMs };
  }
  if (remainMs < warningMs) {
    return { tone: 'warning', text: `${formatDurationText(remainMs)} 남음`, remainMs };
  }
  return { tone: 'success', text: `${formatDurationText(remainMs)} 남음`, remainMs };
}

export function SlaCountdown({
  deadlineAt,
  now,
  warningMs,
  showDeadline = true,
}: {
  deadlineAt: string;
  now: Date;
  warningMs: number;
  showDeadline?: boolean;
}) {
  const sla = resolveSla(deadlineAt, now, warningMs);
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge tone={sla.tone}>{sla.text}</Badge>
      {showDeadline ? (
        <span className="whitespace-nowrap text-[11px] tabular-nums text-[#6B7080]">
          기한 {formatDateTime(deadlineAt)}
        </span>
      ) : null}
    </div>
  );
}
