'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Sparkles, ChevronRight } from 'lucide-react';
import SubHeader from '@/components/layout/SubHeader';
import { FilterTabs } from '@/components/ui/primitives';
import { BIVES, type Bive } from '@/lib/data';
import { cn } from '@/lib/utils';

const CAT: Record<string, Bive['category']> = { '아티스트': 'artist', '이벤트': 'event', '스페셜': 'special' };

export default function CollectionPage() {
  const [filter, setFilter] = useState('아티스트');
  const [sel, setSel] = useState<Bive | null>(null);
  const owned = BIVES.filter((b) => b.owned).length;
  const list = [...BIVES.filter((b) => b.category === CAT[filter])].sort((a, b) => Number(b.owned) - Number(a.owned));

  return (
    <div className="min-h-dvh pb-8">
      <SubHeader title="컬렉션" right={<span className="text-[13px] text-text-body">보유 {owned}종</span>} />
      <div className="space-y-4 px-4 pt-2">
        <FilterTabs tabs={['아티스트', '이벤트', '스페셜']} active={filter} onChange={setFilter} />
        <div className="grid grid-cols-2 gap-3">
          {list.map((b) => (
            <button key={b.id} onClick={() => setSel(b)} className="relative overflow-hidden rounded-2xl">
              <Image src={b.image} alt={b.name} width={180} height={220} className={cn('h-48 w-full object-cover', !b.owned && 'opacity-50')} />
              <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-black/50"><Sparkles className="size-3.5 text-purple-light" /></span>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left">
                <span className="rounded bg-primary/80 px-1.5 py-0.5 text-[10px] text-white">Grade {b.grade}</span>
                <p className="mt-1 text-[12px] font-medium text-white">{b.name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* BIVE 상세 바텀시트 */}
      {sel && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70" onClick={() => setSel(null)}>
          <div className="w-full max-w-shell rounded-t-3xl bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
            <div className="relative mx-auto aspect-[3/4] w-2/3 overflow-hidden rounded-2xl">
              <Image src={sel.image} alt={sel.name} width={240} height={320} className="size-full object-cover" />
              <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/50"><Sparkles className="size-4 text-purple-light" /></span>
            </div>
            <p className="mt-3 text-center text-[15px] font-semibold">{sel.name}</p>
            <p className="text-center text-[12px] text-text-disabled">Grade {sel.grade} · {sel.owned ? '보유 중' : '미보유'}</p>
            <button className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl bg-primary py-3 text-[14px] font-semibold text-white">
              {sel.owned ? '컬렉션에서 보기' : '해당 바이브 얻기'} <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
