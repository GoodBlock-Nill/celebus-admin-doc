'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Trophy, Star, Ticket, Gift, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, ProgressBar } from '@/components/ui/primitives';
import { ARTIST, ME, GROW, SUPPORTS, INFO_TODAY, MY_MEMORIES, RAFFLES } from '@/lib/data';

export default function ArtistPage() {
  const [followed, setFollowed] = useState(true);

  return (
    <div className="pb-6">
      {/* 아티스트 헤더 */}
      <div className="relative h-56">
        <Image src="/v01d/group.jpg" alt="V01D" width={375} height={224} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <button className="flex items-center gap-1 text-[22px] font-bold text-white">{ARTIST.name} <ChevronDown className="size-5" /></button>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[12px] text-white/90">
              <span>내 덕력 <b className="text-purple-light">✦ {ME.duk.toLocaleString()} DUK</b></span>
              <span>키우기 <b>Lv.{ME.growLevel}</b></span>
            </div>
            <button onClick={() => setFollowed((v) => !v)} className={cn('rounded-full px-3 py-1.5 text-[12px] font-medium', followed ? 'bg-muted text-text-body' : 'bg-primary text-white')}>
              {followed ? '✓ 팔로우' : '+ 팔로우'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-4 pt-5">
        {/* 키우기·응원 하이라이트 */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          <Link href="/fandom" className="w-[88%] shrink-0">
            <Card className="gra-amber border-0 p-4">
              <p className="text-[13px] text-white/90">{ARTIST.name} 키우기</p>
              <p className="mt-0.5 text-[18px] font-bold text-white">Lv.{GROW.level}</p>
              <div className="mt-2 flex items-center gap-2">
                <ProgressBar percent={GROW.percent} className="bg-white/25" barClassName="bg-white" />
                <span className="text-[12px] font-bold text-white">{GROW.percent}%</span>
              </div>
            </Card>
          </Link>
          <Link href="/support" className="w-[88%] shrink-0">
            <Card className="gra-violet-pink border-0 p-4">
              <p className="text-[13px] text-white/90">{SUPPORTS[0].title}</p>
              <p className="mt-0.5 text-[13px] font-bold text-white">목표 달성 임박!</p>
              <div className="mt-2 flex items-center gap-2">
                <ProgressBar percent={SUPPORTS[0].percent} className="bg-white/25" barClassName="bg-white" />
                <span className="text-[12px] font-bold text-white">{SUPPORTS[0].percent}%</span>
              </div>
            </Card>
          </Link>
        </div>

        {/* 오늘 스케줄 */}
        <Link href="/info">
          <Card className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-[13px]"><span>📅</span> 오늘 일정을 확인해보세요</div>
            <ChevronRight className="size-4 text-text-disabled" />
          </Card>
        </Link>

        {/* 미션 */}
        <section>
          <h2 className="mb-3 text-[16px] font-semibold">미션</h2>
          <Card className="divide-y divide-border-card">
            <MissionRow href="/quest" icon={<Sparkles className="size-4 text-primary" />} title="V01D 퀘스트" badge="진행중 · EP.1" />
            <MissionRow href="/daily" icon={<Star className="size-4 text-gold" />} title="오늘의 할 일" badge="0/2 완료" />
            <MissionRow href="/support" icon={<Trophy className="size-4 text-ticket" />} title="V01D 응원하기" badge="진행중 85%" />
            <MissionRow href="/fandom" icon={<Trophy className="size-4 text-amber-400" />} title="V01D 키우기" badge={`Lv.${GROW.level}`} />
          </Card>
        </section>

        {/* RAFFLE NOW */}
        <Link href="/raffle">
          <Card className="gra-violet-pink flex items-center justify-between border-0 p-4">
            <div>
              <p className="text-[15px] font-bold text-white">RAFFLE NOW</p>
              <p className="text-[12px] text-white/80">진행중 래플 {RAFFLES.filter((r) => r.status === 'active').length}건</p>
            </div>
            <Gift className="size-6 text-white" />
          </Card>
        </Link>

        {/* 내 기록 */}
        <section>
          <h2 className="mb-3 text-[16px] font-semibold">내 기록</h2>
          <div className="grid grid-cols-3 gap-2">
            <RecordCard href="/ranking" icon={<Star className="size-4 text-gold" />} label="덕력" value={`${ME.rank}위`} />
            <RecordCard href="/collection" icon={<Ticket className="size-4 text-ticket" />} label="응모권" value={`${ME.tickets}장`} />
            <RecordCard href="/raffle" icon={<Gift className="size-4 text-primary" />} label="래플" value="2건" />
          </div>
        </section>

        {/* 소식·일정 프리뷰 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">소식 · 일정 <span className="ml-1 rounded bg-primary px-1.5 py-0.5 text-[10px] text-white">NEW</span></h2>
            <Link href="/info" className="text-[13px] text-text-body">더보기 ›</Link>
          </div>
          <Card className="divide-y divide-border-card">
            {INFO_TODAY.slice(0, 3).map((i) => (
              <Link key={i.id} href={`/info/${i.id}`} className="flex items-center gap-2 p-3.5">
                <span>{i.type === 'schedule' ? '📅' : '📰'}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px]">{i.official && <span className="mr-1 text-primary">공식</span>}{i.title}</p>
                  <p className="text-[11px] text-text-disabled">{i.time}{i.sub ? ` · ${i.sub}` : ''}</p>
                </div>
              </Link>
            ))}
          </Card>
        </section>

        {/* 기억 저장소 프리뷰 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">기억 저장소</h2>
            <Link href="/memory" className="text-[13px] text-text-body">더보기 ›</Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MY_MEMORIES.map((m) => (
              <Link key={m.id} href={`/memory/${m.id}`} className="relative overflow-hidden rounded-xl">
                <Image src={m.image!} alt="" width={120} height={120} className="aspect-square w-full object-cover" />
                <span className="absolute bottom-1 left-1 text-[14px]">{m.emotion}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MissionRow({ href, icon, title, badge }: { href: string; icon: React.ReactNode; title: string; badge: string }) {
  return (
    <Link href={href} className="flex items-center justify-between p-3.5">
      <span className="flex items-center gap-2.5 text-[14px]">{icon}{title}</span>
      <span className="flex items-center gap-2 text-[12px] text-text-body">{badge}<ChevronRight className="size-4 text-text-disabled" /></span>
    </Link>
  );
}

function RecordCard({ href, icon, label, value }: { href: string; icon: React.ReactNode; label: string; value: string }) {
  return (
    <Link href={href}>
      <Card className="flex flex-col items-center gap-1 p-3">
        {icon}
        <span className="text-[11px] text-text-disabled">{label}</span>
        <span className="text-[14px] font-bold">{value}</span>
      </Card>
    </Link>
  );
}
