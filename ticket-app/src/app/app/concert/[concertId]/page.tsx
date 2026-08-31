'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { AppHeader } from '../../_components/app-header';
import { Badge } from '../../_components/badge';
import { formatSessionPeriod } from '../../_components/concert-card';
import { ErrorState, PageSkeleton } from '../../_components/feedback';
import { useMemberSession } from '../../_components/member-session';
import { CARD, GHOST_BUTTON, MUTED, PRIMARY_BUTTON } from '../../_components/ui';
import { PosterPlaceholder } from '../../_components/wordmark';
import { AppModal } from '../../_components/modal';
import { CollapsibleSection, InfoRow, SectionCard } from '../../_components/section';
import { SessionOption } from '../../_components/session-option';
import { CONCERT_STATUS_META } from '../../_components/status-meta';
import { useApiResource } from '../../_components/use-api-resource';
import { VenueValue } from './venue-value';
import { api } from '@/lib/api-client';
import { formatDateTimeWithWeekday, formatKrw } from '@/lib/format';

/** A2 공연 상세 — 회차 선택 후 예매 진입 */
export default function ConcertDetailPage() {
  const params = useParams();
  const concertId = typeof params.concertId === 'string' ? params.concertId : '';
  const router = useRouter();
  const { me } = useMemberSession();

  const loadConcert = useCallback(() => api.concert(concertId), [concertId]);
  const { state, reload } = useApiResource(loadConcert);

  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [isVerifyGuideOpen, setVerifyGuideOpen] = useState(false);

  if (state.status === 'LOADING') {
    return (
      <main>
        <AppHeader title="공연 상세" backHref="/app" />
        <PageSkeleton rows={3} />
      </main>
    );
  }

  if (state.status === 'ERROR') {
    return (
      <main>
        <AppHeader title="공연 상세" backHref="/app" />
        <div className="flex flex-col gap-4 px-4 py-5">
          <ErrorState message={state.reason} onRetry={() => void reload()} />
        </div>
      </main>
    );
  }

  const { concert, sessions } = state.data;
  const statusMeta = CONCERT_STATUS_META[concert.status];
  const isOnSale = concert.status === 'ON_SALE';
  const canSubmit = isOnSale && selectedSessionId !== '';

  const handleReserve = () => {
    if (!canSubmit) return;
    if (!me.verified) {
      setVerifyGuideOpen(true);
      return;
    }
    router.push(`/app/checkout/${selectedSessionId}`);
  };

  return (
    <main>
      <AppHeader title="공연 상세" backHref="/app" />

      {/* 하단 고정 예매 바가 마지막 카드를 가리지 않도록 바 높이 + 여유만큼 아래 여백을 둔다. */}
      <div className="flex flex-col gap-3 px-4 pb-28">
        {/* 포스터가 있으면 3:4 비율로 함께 보여 주고, 없으면 제목 영역만 보여 준다. */}
        <section className={`${CARD} flex gap-4 p-4`}>
          {concert.posterUrl ? (
            <img
              src={concert.posterUrl}
              alt={`${concert.title} 포스터`}
              className="aspect-[3/4] w-[96px] shrink-0 rounded-lg object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <PosterPlaceholder className="aspect-[3/4] w-[96px] shrink-0 rounded-lg" />
          )}
          <div className="min-w-0 flex-1">
            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
            <p className={`mt-2.5 text-[13px] font-semibold ${MUTED}`}>{concert.artist}</p>
            <h2 className="mt-1 text-[19px] font-bold leading-snug text-[#191F28]">{concert.title}</h2>
          </div>
        </section>

        <SectionCard title="공연 정보">
          <InfoRow label="일시" value={formatSessionPeriod(sessions)} />
          <InfoRow
            label="장소"
            value={
              <VenueValue
                venue={concert.venue}
                address={concert.venueAddress}
                mapUrl={concert.venueMapUrl}
              />
            }
          />
          <InfoRow label="좌석" value={concert.seatType} />
          <InfoRow label="가격" value={formatKrw(concert.priceKrw)} emphasis />
          <InfoRow label="1인 구매 한도" value={`${concert.maxPerUser}매`} />
          <InfoRow label="판매 기간" value={`~ ${formatDateTimeWithWeekday(concert.salesEndAt)}까지`} />
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
          <p className={`mt-2.5 text-[12.5px] leading-relaxed ${MUTED}`}>
            잔여석은 실시간으로 반영됩니다. 입금 확인 중인 좌석도 예약된 것으로 계산됩니다.
          </p>
        </SectionCard>

        {concert.description ? (
          <SectionCard title="공연 소개">
            <p className="whitespace-pre-line text-[14px] leading-[1.7] text-[#4E5968]">
              {concert.description}
            </p>
          </SectionCard>
        ) : null}

        {concert.detailImageUrls.length > 0 ? (
          <SectionCard title="상세 안내">
            <div className="flex flex-col gap-2">
              {concert.detailImageUrls.map((url, index) => (
                <img
                  key={url}
                  src={url}
                  alt={`${concert.title} 상세 안내 ${index + 1}`}
                  className="h-auto w-full rounded-lg"
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
          </SectionCard>
        ) : null}

        <CollapsibleSection title="환불 정책">{concert.refundPolicy}</CollapsibleSection>
        <CollapsibleSection title="유의사항">{concert.notice}</CollapsibleSection>
      </div>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[420px] -translate-x-1/2 border-t border-[#E5E8EB] bg-white px-4 pb-5 pt-3">
        {/* 버튼이 왜 눌리지 않는지 바로 알 수 있도록 비활성 사유를 버튼 위에 표시한다. */}
        {isOnSale && selectedSessionId === '' ? (
          <p className={`mb-2 text-center text-[13px] ${MUTED}`}>회차를 선택해 주세요</p>
        ) : null}
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
