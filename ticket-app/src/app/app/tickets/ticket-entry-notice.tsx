'use client';

import type { ReactNode } from 'react';

import { LockIcon, TicketIcon } from '../_components/icons';
import { MUTED, NUMERIC } from '../_components/ui';
import type { TicketDetailView } from '@/lib/api-types';
import { formatDateTime } from '@/lib/format';

const APP_GUIDE = '입장 QR과 발권은 CELEBUS 앱에서 확인할 수 있습니다. 이 화면은 티켓 지급 상태 확인용입니다.';

/** 아이콘 + 제목 + 보조 문구로 구성된 안내 박스 */
function NoticePanel({
  icon,
  title,
  titleClassName = 'text-[#C9C8CE]',
  children,
}: {
  icon: ReactNode;
  title: string;
  titleClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-5 py-9 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#20222A] text-[#6B6C77]">
        {icon}
      </span>
      <p className={`text-[14px] font-bold ${titleClassName}`}>{title}</p>
      {children}
    </div>
  );
}

/**
 * 티켓 상세 하단 — 지급 상태 안내 영역.
 * 발권·입장 확인은 CELEBUS 앱이 담당하므로 이 화면에서는 QR과 티켓 코드를 노출하지 않는다.
 */
export function TicketEntryNotice({ ticket }: { ticket: TicketDetailView }) {
  if (ticket.status === 'REVOKED') {
    return (
      <NoticePanel icon={<LockIcon className="h-7 w-7" />} title="환불로 회수된 티켓입니다">
        <p className={`text-[12px] leading-relaxed ${MUTED}`}>
          이 티켓으로는 입장할 수 없습니다. 다시 관람을 원하시면 새로 예매해 주세요.
        </p>
      </NoticePanel>
    );
  }

  if (ticket.status === 'USED') {
    return (
      <NoticePanel
        icon={<TicketIcon className="h-7 w-7" />}
        title="입장이 완료된 티켓입니다"
        titleClassName="text-[#3DC98A]"
      >
        <p className={`text-[12.5px] ${MUTED} ${NUMERIC}`}>
          입장 시각 {ticket.usedAt ? formatDateTime(ticket.usedAt) : '-'}
        </p>
        <p className={`text-[12px] leading-relaxed ${MUTED}`}>{APP_GUIDE}</p>
      </NoticePanel>
    );
  }

  return (
    <NoticePanel icon={<TicketIcon className="h-7 w-7" />} title="티켓이 지급되었습니다">
      <p className={`text-[12.5px] leading-relaxed ${MUTED}`}>{APP_GUIDE}</p>
    </NoticePanel>
  );
}
