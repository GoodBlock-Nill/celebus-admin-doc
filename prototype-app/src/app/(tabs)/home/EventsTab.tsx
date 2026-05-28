'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { FilterTabs, Card, ProgressBar } from '@/components/ui/primitives';
import { RAFFLES, SUPPORTS } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function EventsTab() {
  const [filter, setFilter] = useState('전체');
  const [mineOnly, setMineOnly] = useState(false);

  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      <FilterTabs tabs={['전체', '참여가능', '종료']} active={filter} onChange={setFilter} />
      <button onClick={() => setMineOnly((v) => !v)} className="flex items-center gap-2 text-[13px] text-text-body">
        <span className={cn('grid size-4 place-items-center rounded border', mineOnly ? 'border-primary bg-primary' : 'border-border-card')}>
          {mineOnly && <Check className="size-3 text-white" />}
        </span>
        내 참여만 보기
      </button>

      <div className="space-y-3">
        {RAFFLES.map((r) => {
          const ended = r.status === 'closed';
          const tallying = r.status === 'tallying';
          return (
            <Link key={r.id} href="/raffle" className="block">
              <Card className="overflow-hidden p-0">
                <div className="relative">
                  <Image src={r.image} alt={r.title} width={375} height={180} className={cn('h-44 w-full object-cover', ended && 'opacity-50')} />
                  <span className="absolute left-3 top-3 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-medium text-white">🎁 응모</span>
                  {ended && <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-error/80 px-4 py-1 text-[14px] font-bold text-error/90 rotate-[-8deg]">CLOSED</span>}
                </div>
                <div className="space-y-1.5 p-3.5">
                  <p className="text-[12px] text-text-disabled">🎁 {r.artist}</p>
                  <p className="text-[15px] font-semibold">{r.title}</p>
                  <p className="text-[12px] text-text-body">응모 <b className="text-foreground">{r.entries.toLocaleString()}</b> · 당첨인원 <b className="text-foreground">{r.winners}명</b></p>
                  {r.status === 'active' ? (
                    <>
                      <p className="text-[12px] text-text-body"><span className="mr-2 rounded bg-primary-900 px-1.5 py-0.5 text-purple-light">D-{r.dday}</span>{r.period}</p>
                      <button className="mt-1 w-full rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-white">응모하기</button>
                    </>
                  ) : (
                    <p className="text-[12px] text-text-body">{tallying && <span className="mr-2 rounded bg-gold/20 px-1.5 py-0.5 text-gold">집계중</span>}{r.period}</p>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}

        {SUPPORTS.map((s) => {
          const ended = s.status === 'closed-fail' || s.status === 'cancelled';
          return (
            <Link key={s.id} href="/support" className="block">
              <Card className="overflow-hidden p-0">
                <div className="relative">
                  <Image src={s.image} alt={s.title} width={375} height={180} className={cn('h-44 w-full object-cover', ended && 'opacity-50')} />
                  <span className="absolute left-3 top-3 rounded-full bg-ticket/90 px-2 py-0.5 text-[10px] font-medium text-white">💜 서포트</span>
                  {ended && <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-error/80 px-4 py-1 text-[14px] font-bold text-error/90 rotate-[-8deg]">CLOSED</span>}
                </div>
                <div className="space-y-1.5 p-3.5">
                  <p className="text-[12px] text-text-disabled">💜 {s.artist}</p>
                  <p className="text-[15px] font-semibold">{s.title}</p>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-text-body">목표금액 <b className="text-foreground">{s.goal.toLocaleString()} DUK</b> {s.percent === 100 && <span className="text-primary">달성</span>}</span>
                    <span className={cn('font-semibold', s.percent === 100 ? 'text-success' : 'text-primary')}>{s.percent}%</span>
                  </div>
                  <ProgressBar percent={s.percent} barClassName={s.percent === 100 ? 'bg-success' : ''} />
                  {s.status === 'active' && <button className="mt-1 w-full rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-white">참여하기</button>}
                  {s.status === 'achieved' && <p className="text-[12px] text-text-body">서포트 진행 예정</p>}
                  {ended && <p className="text-[12px] text-error">서포트가 {s.status === 'cancelled' ? '취소되었어요' : '미달성으로 종료'}</p>}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
