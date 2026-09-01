'use client';

import { useCallback } from 'react';

import { AppHeader } from './_components/app-header';
import { Badge } from './_components/badge';
import { ConcertCard } from './_components/concert-card';
import { ChevronLeftIcon } from './_components/icons';
import { VerifyBanner } from './_components/verify-banner';
import { CELEBUS_APP_URL } from '@/lib/constants';
import { EmptyState, ErrorState, PageSkeleton } from './_components/feedback';
import { useMemberSession } from './_components/member-session';
import { CARD_TITLE } from './_components/ui';
import { useApiResource } from './_components/use-api-resource';
import { api } from '@/lib/api-client';

/** CELEBUS 본앱으로 돌아가는 상단 바 우측 버튼 */
function CelebusAppLink() {
  return (
    <a
      href={CELEBUS_APP_URL}
      className="flex min-h-[34px] items-center gap-1 rounded-full border border-[#E5E8EB] bg-white px-3 text-[12.5px] font-semibold text-[#4E5968]"
    >
      <ChevronLeftIcon className="h-3.5 w-3.5" />
      CELEBUS
    </a>
  );
}

/** A1 공연 목록 — 회원 앱 홈 */
export default function MemberAppHomePage() {
  const { me } = useMemberSession();
  const loadConcerts = useCallback(() => api.concerts(), []);
  const { state, reload } = useApiResource(loadConcerts);

  return (
    <main>
      <AppHeader title="공연 예매" right={<CelebusAppLink />}>
        {me.verified ? (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[14px] font-semibold text-[#191F28]">{me.nickname || '회원'}</span>
            <Badge tone="success">본인확인 완료</Badge>
          </div>
        ) : (
          <div className="mt-3">
            <VerifyBanner />
          </div>
        )}
      </AppHeader>

      <section className="px-4 pb-2">
        <h2 className={`mb-2.5 ${CARD_TITLE}`}>예매 가능한 공연</h2>

        {state.status === 'LOADING' ? (
          <PageSkeleton rows={2} />
        ) : state.status === 'ERROR' ? (
          <ErrorState message={state.reason} onRetry={() => void reload()} />
        ) : state.data.items.length === 0 ? (
          <EmptyState
            title="등록된 공연이 없습니다"
            description="공연이 오픈되면 이곳에서 안내해 드릴게요."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {state.data.items.map(({ concert, sessions }) => (
              <li key={concert.id}>
                <ConcertCard concert={concert} sessions={sessions} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
