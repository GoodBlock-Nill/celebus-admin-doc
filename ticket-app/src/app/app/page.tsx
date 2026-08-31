'use client';

import Link from 'next/link';
import { useCallback } from 'react';

import { Badge } from './_components/badge';
import { ConcertCard } from './_components/concert-card';
import { EmptyState, ErrorState, PageSkeleton } from './_components/feedback';
import { useMemberSession } from './_components/member-session';
import { MUTED } from './_components/ui';
import { useApiResource } from './_components/use-api-resource';
import { api } from '@/lib/api-client';

/** A1 공연 목록 — 회원 앱 홈 */
export default function MemberAppHomePage() {
  const { me } = useMemberSession();
  const loadConcerts = useCallback(() => api.concerts(), []);
  const { state, reload } = useApiResource(loadConcerts);

  return (
    <main>
      <header className="px-4 pb-3 pt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.28em] text-[#F0426E]">CELEBUS</p>
            <h1 className="mt-1 text-[26px] font-extrabold leading-none">TICKET</h1>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-[13.5px] font-semibold">{me.nickname || '회원'}</span>
          {me.verified ? (
            <Badge tone="success">본인확인 완료</Badge>
          ) : (
            <Link href="/app/verify">
              <Badge tone="muted">본인확인 필요</Badge>
            </Link>
          )}
        </div>
      </header>

      <section className="px-4 pb-6">
        <h2 className="mb-2.5 text-[14px] font-bold">예매 가능한 공연</h2>

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
