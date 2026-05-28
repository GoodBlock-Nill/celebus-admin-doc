'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Sparkles, Check, Gamepad2, Calendar, Gift } from 'lucide-react';
import SubHeader from '@/components/layout/SubHeader';
import { Card } from '@/components/ui/primitives';
import { GROW, ARTIST } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function FandomPage() {
  const [selLv, setSelLv] = useState(3);
  const icons = [<Calendar key="0" className="size-5 text-primary" />, <Gamepad2 key="1" className="size-5 text-ticket" />, <Gift key="2" className="size-5 text-gold" />];

  return (
    <div className="min-h-dvh pb-8">
      <SubHeader title={`${ARTIST.name} 키우기`} />
      <div className="space-y-6 px-4 pt-2">
        {/* 현재 레벨 */}
        <section>
          <p className="rounded bg-primary-900 px-2 py-0.5 text-[11px] text-purple-light inline-block">현재 레벨</p>
          <p className="mt-1 text-[28px] font-bold leading-tight">Lv.{GROW.level}</p>
          <p className="text-[13px] text-text-body">다음 레벨까지 <b className="text-primary">{GROW.remain.toLocaleString()}DUK</b> 남음</p>
          {/* 세그먼트 바 */}
          <div className="mt-3 flex items-center justify-between text-[12px] text-text-disabled">
            <span className="font-semibold text-foreground">{GROW.percent}%</span>
            <span>{GROW.current.toLocaleString()} / {GROW.goal.toLocaleString()}DUK</span>
          </div>
          <div className="mt-1.5 flex gap-1">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className={cn('h-3 flex-1 rounded-sm', i < Math.round(GROW.percent / 100 * 16) ? 'bg-primary' : 'bg-muted')} />
            ))}
          </div>
        </section>

        {/* 스탯 */}
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3 text-center"><p className="text-[18px] font-bold">{GROW.participants}</p><p className="text-[12px] text-text-disabled">참여 인원</p></Card>
          <Card className="p-3 text-center"><p className="text-[18px] font-bold">{GROW.totalDuk.toLocaleString()}</p><p className="text-[12px] text-text-disabled">누적 DUK</p></Card>
        </div>
        <Card className="flex items-center justify-between p-3.5">
          <span className="flex items-center gap-1.5 text-[13px] text-text-body"><Sparkles className="size-4 text-primary" />내 기여도</span>
          <span className="text-[14px] font-semibold">{GROW.myDuk} DUK <span className="rounded bg-primary-900 px-1.5 py-0.5 text-[11px] text-purple-light">{GROW.myPercent}%</span></span>
        </Card>

        {/* 레벨보상 */}
        <section>
          <h2 className="text-[16px] font-semibold">레벨보상</h2>
          <p className="mb-3 text-[12px] text-text-body">레벨별 보상을 확인하세요</p>
          <Card className="p-4">
            {/* 스텝퍼 */}
            <div className="flex items-center justify-between">
              {GROW.levels.map((l, i) => (
                <div key={l.lv} className="flex flex-1 items-center">
                  <button onClick={() => setSelLv(l.lv)} className={cn('grid size-8 place-items-center rounded-full text-[13px] font-bold', l.done ? 'bg-primary text-white' : l.lv === selLv ? 'bg-primary text-white ring-2 ring-purple-light' : 'bg-muted text-text-disabled')}>
                    {l.done ? <Check className="size-4" /> : l.lv}
                  </button>
                  {i < GROW.levels.length - 1 && <span className={cn('h-0.5 flex-1', l.done ? 'bg-primary' : 'bg-muted')} />}
                </div>
              ))}
            </div>
            {/* 선택 레벨 보상 */}
            <div className="mt-4 border-t border-border-card pt-3">
              <p className="text-[13px] text-text-body">Lv.{selLv} 달성 보상</p>
              {GROW.selectedReward.items.map((r) => (
                <div key={r.name} className="mt-3 flex items-center gap-3">
                  <Image src={r.image} alt={r.name} width={40} height={40} className="size-10 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="text-[14px] font-medium">{r.name}</p>
                    <p className="text-[12px] text-text-disabled">{'status' in r ? r.status : ''}</p>
                  </div>
                  {'cta' in r && r.cta && <button className="rounded-full bg-primary px-3 py-1.5 text-[12px] font-medium text-white">참여하기</button>}
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* 덕력 획득하기 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">덕력 획득하기</h2>
            <span className="text-[13px] text-text-body">전체 보기 ›</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {GROW.earnCtas.map((c, i) => (
              <Card key={c.label} className="flex flex-col items-center gap-1.5 p-3">
                {icons[i]}
                <span className="text-[12px]">{c.label}</span>
                <span className="text-[11px] text-purple-light">✦ +{c.reward}</span>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
