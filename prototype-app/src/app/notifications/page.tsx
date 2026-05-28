'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCheck, Settings, ChevronDown } from 'lucide-react';
import SubHeader from '@/components/layout/SubHeader';
import { FilterTabs } from '@/components/ui/primitives';
import { NOTIFICATIONS, ARTIST } from '@/lib/data';
import { cn } from '@/lib/utils';

const GROUPS = ['오늘', '어제', '지난 주'];

export default function NotificationsPage() {
  const [cat, setCat] = useState('전체');
  const [read, setRead] = useState(false);

  return (
    <div className="min-h-dvh pb-8">
      <SubHeader
        title="알림"
        right={
          <>
            <button onClick={() => setRead(true)} className="flex items-center gap-1 text-[12px] text-text-body"><CheckCheck className="size-4" /> 모두 읽음</button>
            <Link href="/my"><Settings className="size-5 text-text-body" /></Link>
          </>
        }
      />
      <div className="px-4 pt-1">
        <FilterTabs tabs={['전체', '아티스트', '이벤트', '게임존', '공지']} active={cat} onChange={setCat} />
        {cat === '아티스트' && (
          <button className="mt-3 flex items-center gap-1 rounded-lg border border-primary px-3 py-1.5 text-[13px] text-purple-light">{ARTIST.name} <ChevronDown className="size-4" /></button>
        )}

        <div className="mt-4 space-y-5">
          {GROUPS.map((g) => {
            const items = NOTIFICATIONS.filter((n) => n.group === g);
            if (items.length === 0) return null;
            return (
              <section key={g}>
                <p className="mb-2 text-[13px] text-text-disabled">{g}</p>
                <div className="space-y-3">
                  {items.map((n) => (
                    <div key={n.id} className="flex gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-[16px]">{n.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-start gap-1 text-[14px] font-medium">
                          {n.title}
                          {n.unread && !read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ticket" />}
                        </p>
                        <p className="mt-0.5 text-[13px] text-text-body">{n.desc}</p>
                        <p className="mt-1 text-[11px] text-text-disabled">{n.time} · {n.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
