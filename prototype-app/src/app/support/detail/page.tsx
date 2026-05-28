'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Share2, Minus, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import SubHeader from '@/components/layout/SubHeader';
import { Card, ProgressBar, PrimaryButton } from '@/components/ui/primitives';
import { SUPPORTS, ME } from '@/lib/data';

export default function SupportDetailPage() {
  const s = SUPPORTS[0];
  const [qty, setQty] = useState(s.myDuk);

  return (
    <div className="flex min-h-dvh flex-col">
      <SubHeader title="" right={<Share2 className="size-5 text-foreground" />} />
      <div className="flex-1">
        <div className="relative h-52">
          <Image src={s.image} alt={s.title} width={375} height={208} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <span className="rounded-full bg-ticket/90 px-2 py-0.5 text-[10px] text-white">💜 {s.artist}</span>
            <h1 className="mt-1 text-[20px] font-bold text-white">{s.title}</h1>
            <p className="text-[12px] text-white/80"><span className="mr-2 rounded bg-primary-900 px-1.5 py-0.5 text-purple-light">D-{s.dday}</span>{s.period}</p>
          </div>
        </div>

        <div className="space-y-5 px-4 pt-4">
          <p className="text-[13px] leading-relaxed text-text-body">{s.desc}</p>

          <section>
            <h2 className="mb-2 text-[14px] font-semibold">진행도</h2>
            <Card className="p-4">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-text-body">목표금액 <b className="text-foreground">{s.goal.toLocaleString()} DUK</b></span>
                <span className="font-bold text-primary">{s.percent}%</span>
              </div>
              <ProgressBar percent={s.percent} className="my-2" />
              <p className="text-[12px] text-text-body">{s.current.toLocaleString()} / {s.goal.toLocaleString()} DUK</p>
            </Card>
          </section>

          <section>
            <h2 className="mb-2 text-[14px] font-semibold">내 참여 현황</h2>
            <Card className="flex items-center justify-between p-4">
              <span className="text-[13px] text-text-body">내 누적 응원</span>
              <span className="flex items-center gap-1 text-[16px] font-bold"><Sparkles className="size-4 text-primary" />{s.myDuk.toLocaleString()}</span>
            </Card>
          </section>

          <section>
            <h2 className="mb-2 text-[14px] font-semibold">참여 통계</h2>
            <Card className="flex items-center justify-between p-4">
              <span className="text-[13px] text-text-body">참여 유저 수</span>
              <span className="text-[16px] font-bold">{s.participants}명</span>
            </Card>
          </section>

          <section>
            <h2 className="mb-2 text-[14px] font-semibold">유의사항 안내</h2>
            <ol className="space-y-1 text-[13px] text-text-body">
              <li>1. 응원한 덕력은 목표 미달성 시 전액 반환됩니다.</li>
              <li>2. 한번 응원하면 취소할 수 없어요.</li>
              <li>3. 응원 덕력은 랭킹에 영향을 주지 않습니다.</li>
            </ol>
          </section>
        </div>
      </div>

      {/* 응원 바 */}
      <div className="sticky bottom-0 space-y-3 bg-background/95 p-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[13px] text-text-body">사용 가능한 덕력 <b className="text-foreground">✦ {ME.duk.toLocaleString()} DUK</b></span>
          <div className="flex items-center gap-2">
            <button onClick={() => setQty((q) => Math.max(100, q - 100))} className="grid size-8 place-items-center rounded-lg bg-muted"><Minus className="size-4" /></button>
            <span className="w-16 rounded-lg border border-border-card py-1 text-center text-[14px] font-bold">{qty.toLocaleString()}</span>
            <button onClick={() => setQty((q) => Math.min(ME.duk, q + 100))} className="grid size-8 place-items-center rounded-lg bg-muted"><Plus className="size-4" /></button>
          </div>
        </div>
        <PrimaryButton onClick={() => toast.success(`덕력 ${qty.toLocaleString()}DUK 응원 완료!`)}>응원하기</PrimaryButton>
      </div>
    </div>
  );
}
