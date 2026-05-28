import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle, ChevronRight, Bell } from 'lucide-react';
import SubHeader from '@/components/layout/SubHeader';
import { Card } from '@/components/ui/primitives';
import { NOTICE, WEEK_STRIP, INFO_TODAY, INFO_UPCOMING, ARTIST } from '@/lib/data';
import { cn } from '@/lib/utils';

function InfoRow({ item }: { item: typeof INFO_TODAY[number] }) {
  return (
    <Link href={`/info/${item.id}`} className="flex items-center gap-2.5 py-3">
      <span className="text-[16px]">{item.type === 'schedule' ? '📅' : '📰'}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px]">
          {item.official && <span className="mr-1 rounded bg-primary-900 px-1 py-0.5 text-[10px] text-purple-light">공식</span>}
          {item.title}
        </p>
        <p className="text-[12px] text-text-disabled">{item.time}{item.sub ? ` · ${item.sub}` : ''}</p>
      </div>
      {item.image && <Image src={item.image} alt="" width={44} height={44} className="size-11 rounded-lg object-cover" />}
    </Link>
  );
}

export default function InfoPage() {
  return (
    <div className="min-h-dvh pb-8">
      <SubHeader title={`${ARTIST.name} 정보`} right={<Bell className="size-5 text-primary" />} />
      <div className="space-y-5 px-4 pt-1">
        {/* 공지 배너 */}
        <Card className="flex items-center gap-2.5 bg-primary-900/40 p-3.5">
          <AlertTriangle className="size-4 shrink-0 text-gold" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{NOTICE.title}</p>
            <p className="text-[11px] text-text-disabled">{NOTICE.date}</p>
          </div>
          <ChevronRight className="size-4 text-text-disabled" />
        </Card>

        {/* 주간 날짜 스트립 */}
        <div>
          <h2 className="mb-2 text-[15px] font-semibold">소식 · 일정</h2>
          <div className="flex justify-between rounded-2xl bg-card p-3">
            {WEEK_STRIP.map((d) => (
              <div key={d.date} className={cn('flex flex-col items-center gap-1 rounded-lg px-1.5 py-1', d.today && 'bg-primary-900')}>
                <span className="text-[11px] text-text-disabled">{d.day}</span>
                <span className={cn('text-[14px] font-semibold', d.today && 'text-purple-light')}>{d.date}</span>
                <span className={cn('text-[10px]', d.count > 0 ? 'text-primary' : 'text-transparent')}>+{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 오늘 */}
        <section>
          <p className="mb-1 text-[13px] font-semibold text-text-muted-title">5월18일 월 <span className="ml-1 rounded bg-primary px-1.5 py-0.5 text-[10px] text-white">TODAY</span></p>
          <div className="divide-y divide-border-card">
            {INFO_TODAY.map((i) => <InfoRow key={i.id} item={i} />)}
          </div>
        </section>

        {/* 다가오는 일정 */}
        <section>
          <p className="mb-1 text-[13px] font-semibold text-text-muted-title">다가오는 일정</p>
          <div className="divide-y divide-border-card">
            {INFO_UPCOMING.map((i) => <InfoRow key={i.id} item={i} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
