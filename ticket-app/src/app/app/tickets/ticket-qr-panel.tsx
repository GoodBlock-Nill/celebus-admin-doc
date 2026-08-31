'use client';

import { Countdown } from '../_components/countdown';
import { LockIcon } from '../_components/icons';
import { MockQr } from '../_components/mock-qr';
import { MUTED, NUMERIC } from '../_components/ui';
import { useAppClock } from '../_components/use-app-clock';
import { MS_PER_HOUR, MS_PER_MINUTE } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import type { ConcertSession, Ticket } from '@/lib/types';

/** 공연 시작 이후 입장 코드가 유지되는 시간 */
const ENTRY_WINDOW_AFTER_HOURS = 3;
const QR_SIZE = 196;

interface TicketQrPanelProps {
  ticket: Ticket;
  session: ConcertSession;
}

/** 잠금 상태 안내 박스 */
function LockedPanel({ title, children }: { title: string; children?: React.ReactNode }) {
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

/** 티켓 상세 하단 — 입장 코드(모의 QR) 영역 */
export function TicketQrPanel({ ticket, session }: TicketQrPanelProps) {
  const now = useAppClock();

  const startMs = new Date(session.startAt).getTime();
  const openAt = new Date(startMs - session.entryOpenMinutesBefore * MS_PER_MINUTE).toISOString();
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
      <LockedPanel title={`입장 ${session.entryOpenMinutesBefore}분 전에 활성화됩니다`}>
        <p className={`text-[12.5px] ${MUTED}`}>
          활성화까지 <Countdown targetAt={openAt} className="font-bold text-[#F5B341]" />
        </p>
      </LockedPanel>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-7">
      <MockQr code={ticket.code} size={QR_SIZE} />
      <p className={`text-[18px] font-extrabold tracking-[0.18em] ${NUMERIC}`}>{ticket.code}</p>
      <p className="text-[12.5px] font-semibold text-[#3DC98A]">입장 시 스태프에게 제시해 주세요</p>
    </div>
  );
}
