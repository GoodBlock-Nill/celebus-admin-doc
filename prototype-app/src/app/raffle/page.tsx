'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Ticket, Gift, Check } from 'lucide-react';
import SubHeader from '@/components/layout/SubHeader';
import { FilterTabs, Card } from '@/components/ui/primitives';
import { RAFFLES, ME } from '@/lib/data';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<string, string> = { tallying: '집계중' };

export default function RafflePage() {
  const [filter, setFilter] = useState('전체');
  const [mineOnly, setMineOnly] = useState(false);

  let list = RAFFLES;
  if (filter === '진행중') list = list.filter((r) => r.status === 'active');
  else if (filter === '집계중') list = list.filter((r) => r.status === 'tallying');
  else if (filter === '종료') list = list.filter((r) => r.status === 'closed' || r.status === 'won' || r.status === 'lost');
  if (mineOnly) list = list.filter((r) => r.myEntries > 0);

  return (
    <div className="min-h-dvh pb-8">
      <SubHeader
        title="RAFFLE"
        right={
          <>
            <Link href="/collection" className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-semibold"><Ticket className="size-3 text-ticket" />{ME.tickets}</Link>
            <Gift className="size-5 text-foreground" />
          </>
        }
      />
      <div className="space-y-4 px-4 pt-2">
        <FilterTabs tabs={['전체', '진행중', '집계중', '종료']} active={filter} onChange={setFilter} />
        <button onClick={() => setMineOnly((v) => !v)} className="flex items-center gap-2 text-[13px] text-text-body">
          <span className={cn('grid size-4 place-items-center rounded border', mineOnly ? 'border-primary bg-primary' : 'border-border-card')}>
            {mineOnly && <Check className="size-3 text-white" />}
          </span>
          내 참여만 보기
        </button>

        <div className="space-y-3">
          {list.map((r) => {
            const ended = r.status === 'closed';
            return (
              <Link key={r.id} href="/raffle/detail" className="block">
                <Card className="overflow-hidden p-0">
                  <div className="relative">
                    <Image src={r.image} alt={r.title} width={375} height={180} className={cn('h-44 w-full object-cover', ended && 'opacity-50')} />
                    <span className="absolute left-3 top-3 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-medium text-white">🎁 응모</span>
                    {ended && <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] rounded-full border-2 border-error/80 px-4 py-1 text-[14px] font-bold text-error/90">CLOSED</span>}
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
                      <p className="text-[12px] text-text-body">{STATUS_LABEL[r.status] && <span className="mr-2 rounded bg-gold/20 px-1.5 py-0.5 text-gold">{STATUS_LABEL[r.status]}</span>}{r.period}</p>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
          {list.length === 0 && <p className="py-16 text-center text-[13px] text-text-disabled">표시할 래플이 없어요</p>}
        </div>
      </div>
    </div>
  );
}
