'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, LayoutGrid, MapPin, Settings, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/primitives';
import { MY_MEMORIES, MEMORY_DATES, ALL_MEMORIES } from '@/lib/data';
import { cn } from '@/lib/utils';

const DOW = ['일', '월', '화', '수', '목', '금', '토'];

export default function MemoryPage() {
  const [tab, setTab] = useState<'mine' | 'all'>('mine');
  const [view, setView] = useState<'cal' | 'grid' | 'map'>('cal');

  // May 2026 calendar grid (1st = Friday => offset 5)
  const days = Array.from({ length: 35 }, (_, i) => {
    const date = i - 4;
    return date >= 1 && date <= 31 ? date : null;
  });

  return (
    <div>
      <AppHeader />
      {/* 탭 + 뷰 버튼 */}
      <div className="flex items-center justify-between px-4 pt-2">
        <div className="flex rounded-full bg-muted p-0.5">
          {(['mine', 'all'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('rounded-full px-4 py-1.5 text-[13px] font-medium', tab === t ? 'bg-background text-foreground' : 'text-text-disabled')}>
              {t === 'mine' ? '내 기억' : '모두의 기억'}
            </button>
          ))}
        </div>
        {tab === 'mine' && (
          <div className="flex gap-1">
            {([['cal', Calendar], ['grid', LayoutGrid], ['map', MapPin]] as const).map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v)} className={cn('grid size-8 place-items-center rounded-lg', view === v ? 'bg-primary text-white' : 'bg-muted text-text-disabled')}>
                <Icon className="size-4" />
              </button>
            ))}
            <button className="grid size-8 place-items-center rounded-lg bg-muted text-text-disabled"><Settings className="size-4" /></button>
          </div>
        )}
      </div>

      {tab === 'all' ? (
        <div className="grid grid-cols-3 gap-1 p-4">
          {ALL_MEMORIES.map((m) => (
            <Link key={m.id} href={`/memory/${m.id}`} className="relative aspect-square overflow-hidden rounded-lg">
              <Image src={m.image!} alt="" width={120} height={120} className="size-full object-cover" />
              <span className="absolute bottom-1 left-1 text-[13px]">{m.emotion}</span>
            </Link>
          ))}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-3 gap-1 p-4">
          {MY_MEMORIES.map((m) => (
            <Link key={m.id} href={`/memory/${m.id}`} className="relative aspect-square overflow-hidden rounded-lg">
              <Image src={m.image!} alt="" width={120} height={120} className="size-full object-cover" />
              <span className="absolute bottom-1 left-1 text-[13px]">{m.emotion}</span>
            </Link>
          ))}
        </div>
      ) : view === 'map' ? (
        <div className="p-4">
          <div className="relative h-80 overflow-hidden rounded-2xl bg-muted">
            <div className="absolute inset-0 grid place-items-center text-text-disabled"><MapPin className="size-8" /></div>
            <span className="absolute left-1/3 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-[16px]">😍</span>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-4">
          {/* 월 네비 */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChevronLeft className="size-5 text-text-disabled" />
              <span className="text-[16px] font-bold">5월</span>
              <ChevronRight className="size-5 text-text-disabled" />
            </div>
          </div>
          {/* 요일 */}
          <div className="grid grid-cols-7 text-center text-[12px] text-text-disabled">
            {DOW.map((d) => <span key={d} className="py-1">{d}</span>)}
          </div>
          {/* 날짜 */}
          <div className="grid grid-cols-7 text-center">
            {days.map((d, i) => (
              <div key={i} className="flex flex-col items-center py-1.5">
                <span className={cn('grid size-8 place-items-center rounded-full text-[14px]', d === 18 ? 'border border-primary font-bold' : d ? 'text-foreground' : 'text-transparent')}>{d ?? 0}</span>
                {d && MEMORY_DATES.includes(d) && <span className="mt-0.5 size-1 rounded-full bg-primary" />}
              </div>
            ))}
          </div>
          {/* 오늘 기억 */}
          <div className="mt-4">
            <p className="mb-2 text-[14px] font-semibold">5월18일 · 수 <span className="ml-1 rounded bg-primary px-1.5 py-0.5 text-[10px] text-white">TODAY</span></p>
            <Link href={`/memory/${MY_MEMORIES[0].id}`}>
              <Card className="overflow-hidden p-0">
                <Image src={MY_MEMORIES[0].image!} alt="" width={375} height={160} className="h-40 w-full object-cover" />
                <p className="flex items-center gap-1.5 bg-primary-900/50 px-4 py-2.5 text-[13px] text-purple-light">✅ 기억이 저장되었어요</p>
              </Card>
            </Link>
          </div>
        </div>
      )}

      <Link href="/memory/create" className="fixed bottom-20 left-1/2 z-30 grid size-12 -translate-x-1/2 translate-x-[150px] place-items-center rounded-full bg-primary shadow-lg shadow-primary/40">
        <Pencil className="size-5 text-white" />
      </Link>
    </div>
  );
}
