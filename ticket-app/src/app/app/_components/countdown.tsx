'use client';

import { formatCountdown } from './datetime';
import { NUMERIC } from './ui';
import { useAppClock } from './use-app-clock';

interface CountdownProps {
  /** 기준 시각(ISO) — 이 시각까지 남은 시간을 실시간으로 표시한다. */
  targetAt: string;
  /** 기준 시각을 지났을 때 문구 */
  expiredLabel?: string;
  /** 남은 시간 뒤에 붙는 문구 */
  suffix?: string;
  className?: string;
}

/** 1초 주기로 갱신되는 카운트다운 표시 */
export function Countdown({
  targetAt,
  expiredLabel = '마감 지남',
  suffix = '남음',
  className = '',
}: CountdownProps) {
  const now = useAppClock();
  const remainMs = new Date(targetAt).getTime() - now.getTime();

  if (Number.isNaN(remainMs)) return <span className={className}>-</span>;
  if (remainMs <= 0) return <span className={className}>{expiredLabel}</span>;

  return (
    <span className={`${NUMERIC} ${className}`}>
      {formatCountdown(remainMs)} {suffix}
    </span>
  );
}
