'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Share2, Minus, Plus, Check } from 'lucide-react';
import SubHeader from '@/components/layout/SubHeader';
import { Card, PrimaryButton } from '@/components/ui/primitives';
import { RAFFLES, ME } from '@/lib/data';

export default function RaffleDetailPage() {
  const r = RAFFLES[1];
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);

  return (
    <div className="relative flex min-h-dvh flex-col">
      <SubHeader title="" right={<Share2 className="size-5 text-foreground" />} />

      <div className="flex-1">
        <div className="relative h-52">
          <Image src={r.image} alt={r.title} width={375} height={208} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <span className="rounded-full bg-primary/90 px-2 py-0.5 text-[10px] text-white">🎁 {r.artist}</span>
            <h1 className="mt-1 text-[20px] font-bold text-white">{r.title}</h1>
            <p className="text-[12px] text-white/80"><span className="mr-2 rounded bg-primary-900 px-1.5 py-0.5 text-purple-light">D-{r.dday}</span>{r.period}</p>
          </div>
        </div>

        <div className="space-y-5 px-4 pt-4">
          <p className="text-[13px] leading-relaxed text-text-body">팬들의 정성껏 작성한 인증샷, 추첨을 통해 소수 인원에게 선물</p>

          <section>
            <h2 className="mb-2 text-[14px] font-semibold">보상 내역</h2>
            <Card className="bg-primary-900/40 p-4 text-center text-[14px] font-medium text-purple-light">V01D 1st Mini Album 한정 싸인 1장</Card>
          </section>

          <section>
            <h2 className="mb-2 text-[14px] font-semibold">내 참여 현황</h2>
            <Card className="flex items-center justify-between p-4">
              <span className="text-[13px] text-text-body">내 누적 응모권</span>
              <span className="text-[16px] font-bold">{r.myEntries}장</span>
            </Card>
          </section>

          <section>
            <h2 className="mb-2 text-[14px] font-semibold">참여 통계</h2>
            <Card className="flex items-center justify-between p-4">
              <span className="text-[13px] text-text-body">참여 유저 수</span>
              <span className="text-[16px] font-bold">{r.entries.toLocaleString()}명</span>
            </Card>
          </section>
        </div>
      </div>

      {/* 응모 바 */}
      <div className="sticky bottom-0 space-y-3 bg-background/95 p-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-text-body">보유 응모권</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-8 place-items-center rounded-full bg-muted"><Minus className="size-4" /></button>
            <span className="w-8 text-center text-[15px] font-bold">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(ME.tickets, q + 1))} className="grid size-8 place-items-center rounded-full bg-muted"><Plus className="size-4" /></button>
          </div>
        </div>
        <PrimaryButton onClick={() => setDone(true)}>응모하기</PrimaryButton>
      </div>

      {/* 응모완료 오버레이 */}
      {done && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 px-8" onClick={() => setDone(false)}>
          <Card className="w-full p-6 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full border-2 border-success"><Check className="size-7 text-success" /></span>
            <p className="mt-3 text-[16px] font-bold">응모가 완료되었어요!</p>
            <p className="mt-1 text-[13px] text-text-body">추첨 결과를 기다려주세요</p>
          </Card>
        </div>
      )}
    </div>
  );
}
