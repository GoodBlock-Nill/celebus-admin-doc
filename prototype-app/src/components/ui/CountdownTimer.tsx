'use client';

import { useState, useEffect } from 'react';
import { getRemainingTime } from '@/lib/utils';

interface CountdownTimerProps {
  targetDate: string;
  onComplete?: () => void;
  size?: 'sm' | 'lg';
}

export default function CountdownTimer({
  targetDate,
  onComplete,
  size = 'lg',
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(getRemainingTime(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      const next = getRemainingTime(targetDate);
      setRemaining(next);

      const isComplete =
        next.days === 0 &&
        next.hours === 0 &&
        next.minutes === 0 &&
        next.seconds === 0;

      if (isComplete) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  const pad = (n: number) => String(n).padStart(2, '0');

  if (size === 'sm') {
    const { days, hours, minutes, seconds } = remaining;
    if (days > 0) {
      return (
        <span className="text-sm font-mono text-gray-700">
          {days}일 {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </span>
      );
    }
    return (
      <span className="text-sm font-mono text-gray-700">
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    );
  }

  const units = [
    { label: '일', value: remaining.days },
    { label: '시', value: remaining.hours },
    { label: '분', value: remaining.minutes },
    { label: '초', value: remaining.seconds },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {units.map(({ label, value }, idx) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center">
            <div className="bg-gray-900 text-white rounded-lg px-2.5 py-1.5 min-w-[40px] text-center">
              <span className="text-lg font-bold font-mono tabular-nums">{pad(value)}</span>
            </div>
            <span className="text-[10px] text-gray-500 mt-1">{label}</span>
          </div>
          {idx < units.length - 1 && (
            <span className="text-gray-400 font-bold text-lg mb-4">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
