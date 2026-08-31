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
      className={`flex min-h-[76px] w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
        isSoldOut
          ? 'border-[#E5E8EB] bg-[#F7F7FA] text-[#B0B8C1]'
          : selected
            ? 'border-[#D6336C] bg-[#FDF2F7]'
            : 'border-[#E5E8EB] bg-white'
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className={`block text-[15px] font-bold ${isSoldOut ? '' : 'text-[#191F28]'}`}>
          {session.name}
        </span>
        <span className={`mt-1 block text-[13px] ${isSoldOut ? '' : MUTED} ${NUMERIC}`}>
          {formatDateTime(session.startAt)}
        </span>
      </span>

      {isSoldOut ? (
        <Badge tone="muted">매진</Badge>
      ) : (
        <span className="shrink-0 text-right">
          <span className={`block text-[12px] ${MUTED}`}>잔여</span>
          <span className={`block text-[16px] font-bold text-[#191F28] ${NUMERIC}`}>
            {session.remaining}석
          </span>
        </span>
      )}
    </button>
  );
}
