'use client';

import type { ReactNode } from 'react';

import { Countdown } from '../_components/countdown';
import { LockIcon } from '../_components/icons';
import { MockQr } from '../_components/mock-qr';
import { MUTED, NUMERIC } from '../_components/ui';
import { useAppClock } from '../_components/use-app-clock';
import { useQrToken } from './use-qr-token';
import type { TicketDetailView } from '@/lib/api-types';
import { ENTRY_WINDOW_AFTER_HOURS, MS_PER_HOUR, MS_PER_MINUTE, MS_PER_SECOND } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';

const QR_SIZE = 196;

/** 잠금 상태 안내 박스 */
function LockedPanel({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-4 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#20222A] text-[#6B6C77]">
        <LockIcon className="h-7 w-7" />
      </span>
      <p className="text-[14px] font-bold text-[#C9C8CE]">{title}</p>
      {children}
    </div>
  );
}

/** 서명 토큰을 QR로 그리고 잔여 유효시간을 표시한다. */
function ActiveQrPanel({ ticket }: { ticket: TicketDetailView }) {
  const now = useAppClock();
  const state = useQrToken(ticket.id, true);

  if (state.status === 'LOADING') {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-7">
        <div className="h-[196px] w-[196px] animate-pulse rounded-xl bg-[#20222A]" />
        <p className={`text-[12.5px] ${MUTED}`}>입장 코드를 준비하고 있습니다…</p>
      </div>
    );
  }

  if (state.status === 'ERROR') {
    return (
      <LockedPanel title="입장 코드를 표시할 수 없습니다">
        <p className={`text-[12px] leading-relaxed ${MUTED}`}>{state.reason}</p>
      </LockedPanel>
    );
  }

  const remainSeconds = Math.max(
    0,
    Math.ceil((new Date(state.expiresAt).getTime() - now.getTime()) / MS_PER_SECOND),
  );

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-7">
      <MockQr code={state.token} size={QR_SIZE} />
      <p className={`text-[12px] ${MUTED} ${NUMERIC}`}>
        이 코드는 <span className="font-bold text-[#F5B341]">{remainSeconds}초</span> 뒤 자동으로 갱신됩니다
      </p>
      <p className={`text-[18px] font-extrabold tracking-[0.18em] ${NUMERIC}`}>{ticket.code}</p>
      <p className="text-[12.5px] font-semibold text-[#3DC98A]">입장 시 스태프에게 제시해 주세요</p>
    </div>
  );
}

/** 티켓 상세 하단 — 입장 코드 영역 (활성화 기준은 서버가 내려준 공연 시작 시각) */
export function TicketQrPanel({ ticket }: { ticket: TicketDetailView }) {
  const now = useAppClock();

  const startMs = new Date(ticket.sessionStartAt).getTime();
  const openAt = new Date(startMs - ticket.entryOpenMinutesBefore * MS_PER_MINUTE).toISOString();
  const closeMs = startMs + ENTRY_WINDOW_AFTER_HOURS * MS_PER_HOUR;
  const nowMs = now.getTime();

  if (ticket.status === 'REVOKED') {
    return (
      <LockedPanel title="환불로 회수된 티켓입니다">
        <p className={`text-[12px] leading-relaxed ${MUTED}`}>
          이 티켓으로는 입장할 수 없습니다. 다시 관람을 원하시면 새로 예매해 주세요.
        </p>
      </LockedPanel>
    );
  }

  if (ticket.status === 'USED') {
    return (
      <div className="relative">
        <div className="flex flex-col items-center gap-3 px-4 py-7 opacity-25">
          <MockQr code={ticket.code} size={QR_SIZE} />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center">
          <p className="text-[17px] font-extrabold text-[#3DC98A]">입장 완료</p>
          <p className={`text-[12.5px] ${MUTED} ${NUMERIC}`}>
            {ticket.usedAt ? formatDateTime(ticket.usedAt) : '-'}
          </p>
        </div>
      </div>
    );
  }

  if (nowMs > closeMs) {
    return (
      <LockedPanel title="입장 시간이 종료되었습니다">
        <p className={`text-[12px] leading-relaxed ${MUTED}`}>
          공연 시작 후 {ENTRY_WINDOW_AFTER_HOURS}시간이 지나 입장 코드가 만료되었습니다.
        </p>
      </LockedPanel>
    );
  }

  if (nowMs < new Date(openAt).getTime()) {
    return (
      <LockedPanel title={`입장 ${ticket.entryOpenMinutesBefore}분 전에 활성화됩니다`}>
        <p className={`text-[12.5px] ${MUTED}`}>
          활성화까지 <Countdown targetAt={openAt} className="font-bold text-[#F5B341]" />
        </p>
      </LockedPanel>
    );
  }

  return <ActiveQrPanel ticket={ticket} />;
}
