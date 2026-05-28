'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, Sparkles, Ticket, ChevronRight } from 'lucide-react';
import SubHeader from '@/components/layout/SubHeader';
import { EPISODES, ME, ARTIST } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function QuestPage() {
  const [sel, setSel] = useState(0);
  const ep = EPISODES[sel];

  return (
    <div className="min-h-dvh pb-8">
      <SubHeader
        title={`${ARTIST.name} 퀘스트`}
        right={
          <>
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-semibold"><Sparkles className="size-3 text-primary" />{ME.dukEarned.toLocaleString()}</span>
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-semibold"><Ticket className="size-3 text-ticket" />{ME.tickets}</span>
          </>
        }
      />

      {/* EP 카드 캐러셀 */}
      <div className="px-4 pt-2">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {EPISODES.map((e, i) => (
            <button key={e.id} onClick={() => setSel(i)} className="shrink-0">
              <div className={cn('relative h-64 w-44 overflow-hidden rounded-2xl border-2', sel === i ? 'border-primary' : 'border-transparent')}>
                <Image src={e.image} alt={e.title} width={176} height={256} className={cn('h-full w-full object-cover', e.status === 'locked' && 'opacity-40')} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                {e.status === 'locked' && <Lock className="absolute right-3 top-3 size-5 text-white/80" />}
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-[12px] text-white/80">EP.0{e.no}</p>
                  <p className="text-[15px] font-bold leading-tight text-white">{e.title}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <p className="text-center text-[12px] text-text-disabled">{sel + 1} / {EPISODES.length}</p>
      </div>

      {/* 선택 에피소드 헤더 */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-bold">EP.0{ep.no} {ep.title}</h2>
          {ep.status === 'active' && <span className="rounded bg-primary-900 px-1.5 py-0.5 text-[11px] text-purple-light">진행중</span>}
          <span className="text-[13px] text-text-disabled">{ep.done}/{ep.total}</span>
        </div>
        <p className="mt-1 text-[13px] text-text-body">{ARTIST.name}를 만나 첫 퀘스트를 시작해보세요</p>
      </div>

      {/* 미션 리스트 */}
      <div className="mt-3 space-y-2.5 px-4">
        {ep.status === 'locked' ? (
          <div className="rounded-2xl bg-card p-6 text-center text-[13px] text-text-body">
            이전 에피소드의 모든 미션을 제출하면 해금됩니다
          </div>
        ) : (
          ep.missions.map((m) => (
            <div key={m.id} className="rounded-2xl bg-card p-4">
              <div className="flex items-center gap-2 text-[12px] text-text-disabled">
                <Image src={ARTIST.logo} alt="" width={16} height={16} className="size-4 rounded-full" /> {ARTIST.name}
              </div>
              <p className="mt-1.5 text-[14px] font-medium leading-snug">{m.title}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[12px] text-text-body">보상 <span className="text-purple-light">✦ +{m.dukReward}</span> <span className="text-ticket">🎟 {m.ticketReward}장</span></span>
                <Link href="/quest/submit" className="flex items-center gap-0.5 rounded-full bg-primary px-3.5 py-1.5 text-[12px] font-medium text-white">참여하기<ChevronRight className="size-3.5" /></Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
