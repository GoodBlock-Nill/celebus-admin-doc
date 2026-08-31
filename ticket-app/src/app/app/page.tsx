'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { Badge } from './_components/badge';
import { ConcertCard } from './_components/concert-card';
import { EmptyState, PageSkeleton } from './_components/feedback';
import { MUTED } from './_components/ui';
import { useOrderExpiry } from './_components/use-app-clock';
import { selectCurrentUser, selectCurrentVerification, useTicketStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';

/** A1 공연 목록 — 회원 앱 홈 */
export default function MemberAppHomePage() {
  const isHydrated = useHydrated();
  useOrderExpiry();

  const concerts = useTicketStore((state) => state.concerts);
  const sessions = useTicketStore((state) => state.sessions);
  const currentUser = useTicketStore(selectCurrentUser);
  const verification = useTicketStore(selectCurrentVerification);

  const sessionsByConcert = useMemo(() => {
    const grouped = new Map<string, typeof sessions>();
    sessions.forEach((session) => {
      const list = grouped.get(session.concertId) ?? [];
      grouped.set(session.concertId, [...list, session]);
    });
    return grouped;
  }, [sessions]);

  return (
    <main>
      <header className="px-4 pb-3 pt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.28em] text-[#F0426E]">CELEBUS</p>
            <h1 className="mt-1 text-[26px] font-extrabold leading-none">TICKET</h1>
          </div>
          <Link href="/" className={`text-[11.5px] ${MUTED} underline underline-offset-2`}>
            데모 허브
          </Link>
        </div>

        {isHydrated ? (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[13.5px] font-semibold">{currentUser?.nickname ?? '게스트'}</span>
            {verification ? (
              <Badge tone="success">본인확인 완료</Badge>
            ) : (
              <Link href="/app/verify">
                <Badge tone="muted">본인확인 필요</Badge>
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-4 h-6 w-32 animate-pulse rounded-full bg-[#191A20]" />
        )}
      </header>

      <section className="px-4 pb-6">
        <h2 className="mb-2.5 text-[14px] font-bold">예매 가능한 공연</h2>

        {!isHydrated ? (
          <PageSkeleton rows={2} />
        ) : concerts.length === 0 ? (
          <EmptyState
            title="등록된 공연이 없습니다"
            description="공연이 오픈되면 이곳에서 안내해 드릴게요."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {concerts.map((concert) => (
              <li key={concert.id}>
                <ConcertCard
                  concert={concert}
                  sessions={sessionsByConcert.get(concert.id) ?? []}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
