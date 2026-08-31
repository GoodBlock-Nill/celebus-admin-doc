'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { AppHeader } from '../../_components/app-header';
import { Badge } from '../../_components/badge';
import { formatSessionPeriod } from '../../_components/concert-card';
import { NotFoundNotice, PageSkeleton } from '../../_components/feedback';
import { GHOST_BUTTON, MUTED, PRIMARY_BUTTON } from '../../_components/ui';
import { AppModal } from '../../_components/modal';
import { CollapsibleSection, InfoRow, SectionCard } from '../../_components/section';
import { SessionOption } from '../../_components/session-option';
import { CONCERT_STATUS_META } from '../../_components/status-meta';
import { useOrderExpiry } from '../../_components/use-app-clock';
import { formatKrw } from '@/lib/format';
import { selectCurrentVerification, useTicketStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';

/** A2 공연 상세 — 회차 선택 후 예매 진입 */
export default function ConcertDetailPage() {
  const params = useParams();
  const concertId = typeof params.concertId === 'string' ? params.concertId : '';
  const router = useRouter();
  const isHydrated = useHydrated();
  useOrderExpiry();

  const concerts = useTicketStore((state) => state.concerts);
  const allSessions = useTicketStore((state) => state.sessions);
  const verification = useTicketStore(selectCurrentVerification);

  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [isVerifyGuideOpen, setVerifyGuideOpen] = useState(false);

  const concert = concerts.find((item) => item.id === concertId);
  const sessions = useMemo(
    () => allSessions.filter((session) => session.concertId === concertId),
    [allSessions, concertId],
  );

  if (!isHydrated) {
    return (
      <main>
        <AppHeader title="공연 상세" backHref="/app" />
        <PageSkeleton rows={3} />
      </main>
    );
  }

  if (!concert) {
    return (
      <main>
        <AppHeader title="공연 상세" backHref="/app" />
        <NotFoundNotice message="공연 정보를 찾을 수 없습니다." backHref="/app" />
      </main>
    );
  }

  const statusMeta = CONCERT_STATUS_META[concert.status];
  const isOnSale = concert.status === 'ON_SALE';
  const canSubmit = isOnSale && selectedSessionId !== '';

  const handleReserve = () => {
    if (!canSubmit) return;
    if (!verification) {
      setVerifyGuideOpen(true);
      return;
    }
    router.push(`/app/checkout/${selectedSessionId}`);
  };

  return (
    <main className="pb-[92px]">
      <AppHeader title="공연 상세" backHref="/app" />

      <section className="bg-linear-to-br from-[#F0426E] via-[#8B4BD6] to-[#191A20] px-5 pb-7 pt-6">
        <Badge tone={statusMeta.tone} className="bg-black/30 text-white">
          {statusMeta.label}
        </Badge>
        <p className="mt-3 text-[12px] font-bold tracking-[0.2em] text-white/85">{concert.artist}</p>
        <h2 className="mt-1.5 text-[22px] font-extrabold leading-snug text-white">{concert.title}</h2>
      </section>

      <div className="flex flex-col gap-3 px-4 pt-4">
        <SectionCard title="공연 정보">
          <InfoRow label="일시" value={formatSessionPeriod(sessions)} />
          <InfoRow label="장소" value={concert.venue} />
          <InfoRow label="좌석" value={concert.seatType} />
          <InfoRow label="가격" value={formatKrw(concert.priceKrw)} emphasis />
          <InfoRow label="1인 구매 한도" value={`${concert.maxPerUser}매`} />
        </SectionCard>

        <SectionCard title="회차 선택" description="원하는 회차를 선택하면 예매를 진행할 수 있습니다.">
          <div className="flex flex-col gap-2.5">
            {sessions.map((session) => (
              <SessionOption
                key={session.id}
                session={session}
                selected={session.id === selectedSessionId}
                onSelect={setSelectedSessionId}
              />
            ))}
          </div>
          <p className={`mt-2.5 text-[11.5px] ${MUTED}`}>
            잔여 수량은 유료 판매분 기준이며, 입금 대기 중인 좌석도 차감되어 표시됩니다.
          </p>
        </SectionCard>

        <CollapsibleSection title="환불 정책">{concert.refundPolicy}</CollapsibleSection>
        <CollapsibleSection title="유의사항">{concert.notice}</CollapsibleSection>
      </div>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[420px] -translate-x-1/2 border-t border-[#2A2C34] bg-[#0F1014F5] px-4 pb-5 pt-3 backdrop-blur">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleReserve}
          className={PRIMARY_BUTTON}
        >
          {isOnSale ? '예매하기' : statusMeta.label}
        </button>
      </div>

      <AppModal
        open={isVerifyGuideOpen}
        title="본인확인이 필요합니다"
        description="티켓 예매에는 최초 1회 간편인증 본인확인이 필요합니다. 실명 확인 후 예매를 이어서 진행할 수 있습니다."
        onClose={() => setVerifyGuideOpen(false)}
        footer={
          <>
            <Link
              href={`/app/verify?next=/app/checkout/${selectedSessionId}`}
              className={PRIMARY_BUTTON}
            >
              본인확인 하러가기
            </Link>
            <button
              type="button"
              onClick={() => setVerifyGuideOpen(false)}
              className={GHOST_BUTTON}
            >
              다음에 하기
            </button>
          </>
        }
      />
    </main>
  );
}
