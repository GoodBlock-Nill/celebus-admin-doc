import Link from 'next/link';

import { Badge } from './badge';
import { ChevronRightIcon } from './icons';
import { TicketPerforation } from './perforation';
import { CONCERT_STATUS_META } from './status-meta';
import { CARD, MUTED, NUMERIC } from './ui';
import { PosterPlaceholder } from './wordmark';
import type { ConcertView, SessionView } from '@/lib/api-types';
import { formatDateWithWeekday, formatKrw } from '@/lib/format';

/** 회차 목록에서 공연 기간 문구를 만든다. */
export function formatSessionPeriod(sessions: SessionView[]): string {
  if (sessions.length === 0) return '일정 준비중';

  const sorted = sessions
    .map((session) => session.startAt)
    .slice()
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const first = formatDateWithWeekday(sorted[0]);
  const last = formatDateWithWeekday(sorted[sorted.length - 1]);
  return first === last ? first : `${first} ~ ${last}`;
}

interface ConcertCardProps {
  concert: ConcertView;
  sessions: SessionView[];
}

/** 공연 목록 카드 — 포스터 썸네일 + 절취선 스텁 */
export function ConcertCard({ concert, sessions }: ConcertCardProps) {
  const statusMeta = CONCERT_STATUS_META[concert.status];

  return (
    <Link href={`/app/concert/${concert.id}`} className={`${CARD} block px-4 pb-3 pt-4`}>
      <div className="flex gap-3.5">
        {concert.posterUrl ? (
          <img
            src={concert.posterUrl}
            alt={`${concert.title} 포스터`}
            className="aspect-[3/4] w-[72px] shrink-0 rounded-lg object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <PosterPlaceholder className="aspect-[3/4] w-[72px] shrink-0 rounded-lg" />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
            <span className={`truncate text-[12.5px] ${MUTED}`}>{concert.artist}</span>
          </div>

          <p className="mt-1.5 line-clamp-2 text-[16px] font-bold leading-snug text-[#191F28]">
            {concert.title}
          </p>

          <p className={`mt-auto pt-2 text-[13px] ${MUTED} ${NUMERIC}`}>
            {formatSessionPeriod(sessions)}
          </p>
          <p className={`truncate text-[13px] ${MUTED}`}>{concert.venue}</p>
        </div>
      </div>

      {/* 카드 좌우 끝까지 닿아야 노치가 절취 자국으로 보이므로 좌우 여백을 상쇄한다. */}
      <TicketPerforation className="-mx-4 mt-3" />

      <div className="flex items-center justify-between gap-2 pt-2.5">
        <span className={`text-[13px] ${MUTED}`}>예매가</span>
        <span className="flex items-center gap-1">
          <span className={`text-[17px] font-extrabold text-[#191F28] ${NUMERIC}`}>
            {formatKrw(concert.priceKrw)}
          </span>
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-[#B0B8C1]" />
        </span>
      </div>
    </Link>
  );
}
