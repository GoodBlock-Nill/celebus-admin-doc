'use client';

import { Badge } from './badge';
import { MUTED, NUMERIC } from './ui';
import type { SessionView } from '@/lib/api-types';
import { formatDateTime } from '@/lib/format';

interface SessionOptionProps {
  session: SessionView;
  selected: boolean;
  onSelect: (sessionId: string) => void;
}

/** 회차 선택 카드 — 잔여 수량 0이면 매진 처리 */
export function SessionOption({ session, selected, onSelect }: SessionOptionProps) {
  const isSoldOut = session.remaining <= 0;

  return (
    <button
      type="button"
      disabled={isSoldOut}
      aria-pressed={selected}
      onClick={() => onSelect(session.id)}
      className={`flex min-h-[76px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
        isSoldOut
          ? 'border-[#2A2C34] bg-[#15161B] opacity-55'
          : selected
            ? 'border-[#F0426E] bg-[#F0426E14]'
            : 'border-[#2A2C34] bg-[#191A20]'
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold">{session.name}</span>
        <span className={`mt-1 block text-[12.5px] ${MUTED} ${NUMERIC}`}>
          {formatDateTime(session.startAt)}
        </span>
      </span>

      {isSoldOut ? (
        <Badge tone="muted">매진</Badge>
      ) : (
        <span className="shrink-0 text-right">
          <span className={`block text-[11px] ${MUTED}`}>잔여</span>
          <span className={`block text-[15px] font-bold ${NUMERIC}`}>{session.remaining}석</span>
        </span>
      )}
    </button>
  );
}
