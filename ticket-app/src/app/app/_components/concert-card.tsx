import Link from 'next/link';

import { Badge } from './badge';
import { ChevronRightIcon } from './icons';
import { CONCERT_STATUS_META } from './status-meta';
import { CARD, MUTED, NUMERIC } from './ui';
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

/** 공연 목록 카드 */
export function ConcertCard({ concert, sessions }: ConcertCardProps) {
  const statusMeta = CONCERT_STATUS_META[concert.status];

  return (
    <Link href={`/app/concert/${concert.id}`} className={`${CARD} block overflow-hidden`}>
      {/* 포스터가 있으면 3:4 썸네일을 왼쪽에 두고, 없으면 기존 그라디언트만 보여 준다. */}
      <div className="flex h-24 items-stretch bg-linear-to-br from-[#F0426E] via-[#8B4BD6] to-[#2A2C34]">
        {concert.posterUrl ? (
          <img
            src={concert.posterUrl}
            alt={`${concert.title} 포스터`}
            className="aspect-[3/4] h-24 shrink-0 object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <div className="min-w-0 px-4 py-3">
          <p className="text-[11px] font-bold tracking-wider text-white/80">{concert.artist}</p>
          <p className="mt-1 line-clamp-2 text-[15px] font-extrabold leading-snug text-white">
            {concert.title}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
            <span className={`truncate text-[12.5px] ${MUTED}`}>{concert.venue}</span>
          </div>
          <p className={`mt-1.5 text-[12.5px] ${MUTED} ${NUMERIC}`}>
            {formatSessionPeriod(sessions)}
          </p>
          <p className={`mt-0.5 text-[14px] font-bold ${NUMERIC}`}>{formatKrw(concert.priceKrw)}</p>
        </div>
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-[#5F606B]" />
      </div>
    </Link>
  );
}
