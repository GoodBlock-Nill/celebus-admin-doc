'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, ChevronRight, Trophy, Heart, Calendar, Gift, Check, Gamepad2, BookHeart } from 'lucide-react';
import { toast } from 'sonner';
import AppHeader from '@/components/layout/AppHeader';
import { Card, ProgressBar } from '@/components/ui/primitives';
import { ARTISTS, BANNERS, DAILY_MISSIONS, ATTENDANCE, BIVES, RAFFLES, SUPPORTS } from '@/lib/data';
import { cn } from '@/lib/utils';
import EventsTab from './EventsTab';

export default function HomePage() {
  const [tab, setTab] = useState<'home' | 'events'>('home');
  const [artist, setArtist] = useState('v01d');
  const [checkedIn, setCheckedIn] = useState(ATTENDANCE.doneToday);

  return (
    <div>
      <AppHeader />

      {/* HOME / EVENTS 상단 탭 */}
      <div className="flex gap-5 border-b border-border-card px-4">
        {(['home', 'events'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'relative py-3 text-[15px] font-semibold',
              tab === t ? 'text-foreground' : 'text-text-disabled',
            )}
          >
            {t === 'home' ? 'HOME' : 'Events'}
            {tab === t && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground" />}
          </button>
        ))}
      </div>

      {tab === 'events' ? (
        <EventsTab />
      ) : (
        <div className="space-y-6 px-4 pb-6 pt-4">
          {/* 캐러셀 배너 */}
          <div className="relative overflow-hidden rounded-2xl">
            <Image src={BANNERS[0].image} alt="" width={375} height={200} className="h-[200px] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute left-4 top-3">
              <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">NOTICE</span>
              <p className="mt-1 text-[12px] text-white/90">{BANNERS[0].title}</p>
            </div>
            <div className="absolute bottom-3 left-4 right-4">
              <h2 className="text-[20px] font-bold leading-tight text-white">{BANNERS[0].subtitle}</h2>
            </div>
            <div className="absolute bottom-3 right-4 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white">1 / {BANNERS.length}</div>
          </div>

          {/* 아티스트 선택 */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            {ARTISTS.filter((a) => a.followed).map((a) => (
              <button key={a.id} onClick={() => setArtist(a.id)} className="flex flex-col items-center gap-1">
                <span className={cn('grid size-14 place-items-center overflow-hidden rounded-full border-2', artist === a.id ? 'border-primary' : 'border-transparent')}>
                  <Image src={a.logo} alt={a.name} width={56} height={56} className="size-full object-cover" />
                </span>
              </button>
            ))}
            <Link href="/artist/discover" className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-dashed border-border-card text-text-disabled">
              <Plus className="size-5" />
            </Link>
          </div>

          {/* 오늘의 할 일 */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold">오늘의 할 일</h2>
              <Link href="/daily" className="text-[13px] text-text-body">전체 보기 ›</Link>
            </div>
            <Card className="space-y-3 p-4">
              {/* 출석 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-primary-900 text-[16px]">🙌</span>
                  <div>
                    <p className="text-[14px] font-semibold">출석 체크</p>
                    <p className="text-[12px] text-purple-light">✦ {ATTENDANCE.reward}</p>
                  </div>
                </div>
                {checkedIn ? (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-[12px] text-text-body"><Check className="size-3.5" /> 출석완료</span>
                ) : (
                  <button onClick={() => { setCheckedIn(true); toast.success('출석 완료! 덕력 5DUK 획득'); }} className="rounded-full bg-primary px-3.5 py-1.5 text-[12px] font-medium text-white">출석하기</button>
                )}
              </div>
              <div className="border-t border-border-card" />
              {/* 일일 미션 */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-medium">일일미션 <span className="text-text-disabled">{DAILY_MISSIONS.filter((m) => m.done).length}/{DAILY_MISSIONS.length} 완료</span></p>
                  <p className="text-[11px] text-purple-light">매일 미션 모두 완료시 ✦ 25 지급</p>
                </div>
                <div className="space-y-2">
                  {DAILY_MISSIONS.map((m, i) => (
                    <div key={m.id} className="flex items-center justify-between rounded-xl bg-card-dark px-3 py-2.5">
                      <span className="flex items-center gap-2 text-[13px]">
                        {i === 0 ? <Gamepad2 className="size-4 text-primary" /> : <BookHeart className="size-4 text-primary" />}
                        {m.title}
                      </span>
                      <button className="rounded-full bg-muted px-3 py-1 text-[12px] text-text-body">미션하기</button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </section>

          {/* 핵심 추천 */}
          <Link href="/quest" className="block">
            <Card className="gra-primary flex items-center justify-between border-0 p-4">
              <div>
                <p className="text-[15px] font-bold text-white">퀘스트 참여하기</p>
                <p className="text-[12px] text-white/80">오늘의 퀘스트를 완료하세요</p>
              </div>
              <ChevronRight className="size-5 text-white" />
            </Card>
          </Link>

          {/* 바로가기 */}
          <section>
            <h2 className="mb-3 text-[16px] font-semibold">V01D 바로가기</h2>
            <div className="space-y-2.5">
              <ShortcutRich href="/fandom" icon={<Trophy className="size-5 text-gold" />} title="V01D 키우기" meta="Lv.3" percent={85} cta="참여하기" />
              <ShortcutRich href="/support" icon={<Heart className="size-5 text-ticket" />} title={SUPPORTS[0].title} meta="달성 임박!" percent={85} cta="참여하기" />
              <ShortcutInfo href="/info" icon={<Calendar className="size-5 text-info" />} badge="오늘" title="14:00 음악중심 출연입니다" sub="+2건 더보기" cta="확인하기" />
              <ShortcutInfo href="/raffle" icon={<Gift className="size-5 text-ticket" />} badge={`D-${RAFFLES[1].dday}`} title={RAFFLES[1].title} sub={`${RAFFLES[1].entries.toLocaleString()}명 참여중`} cta="참여하기" />
            </div>
          </section>

          {/* BIVE 바이브 프리뷰 */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold">V01D 바이브</h2>
              <Link href="/collection" className="text-[13px] text-text-body">도감 보기 ›</Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {BIVES.slice(0, 4).map((b) => (
                <div key={b.id} className="relative overflow-hidden rounded-xl">
                  <Image src={b.image} alt={b.name} width={180} height={220} className="h-44 w-full object-cover" />
                  {b.owned && <span className="absolute right-2 top-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-medium text-white">보유 중</span>}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ShortcutRich({ href, icon, title, meta, percent, cta }: { href: string; icon: React.ReactNode; title: string; meta: string; percent: number; cta: string }) {
  return (
    <Link href={href} className="block">
      <Card className="flex items-center gap-3 p-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-card-dark">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="truncate text-[14px] font-medium">{title}</p>
            <span className="ml-2 shrink-0 text-[12px] text-text-body">{meta}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <ProgressBar percent={percent} className="h-1.5" />
            <span className="shrink-0 text-[11px] font-semibold text-primary">{percent}%</span>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-[12px] font-medium text-white">{cta}</span>
      </Card>
    </Link>
  );
}

function ShortcutInfo({ href, icon, badge, title, sub, cta }: { href: string; icon: React.ReactNode; badge: string; title: string; sub: string; cta: string }) {
  return (
    <Link href={href} className="block">
      <Card className="flex items-center gap-3 p-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-card-dark">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-primary-900 px-1.5 py-0.5 text-[10px] font-medium text-purple-light">{badge}</span>
            <p className="truncate text-[13px]">{title}</p>
          </div>
          <p className="mt-0.5 text-[11px] text-text-disabled">{sub}</p>
        </div>
        <span className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-[12px] font-medium text-white">{cta}</span>
      </Card>
    </Link>
  );
}
