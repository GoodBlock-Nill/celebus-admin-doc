'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import SubHeader from '@/components/layout/SubHeader';
import { FilterTabs } from '@/components/ui/primitives';
import { DUK_HISTORY } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function DukHistoryPage() {
  const [filter, setFilter] = useState('전체');

  return (
    <div className="min-h-dvh pb-8">
      <SubHeader title="덕력 내역" />
      <div className="space-y-5 px-4 pt-2">
        <FilterTabs tabs={['전체', '획득', '사용']} active={filter} onChange={setFilter} />

        {DUK_HISTORY.map((g) => {
          const items = g.items.filter((i) => filter === '전체' || (filter === '획득' ? i.amount > 0 : i.amount < 0));
          if (items.length === 0) return null;
          return (
            <section key={g.date}>
              <p className="mb-2 text-[13px] text-text-disabled">{g.date}</p>
              <div className="divide-y divide-border-card">
                {items.map((i) => (
                  <div key={i.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-[14px]">{i.title}</p>
                      {i.sub && <p className="text-[12px] text-text-disabled">{i.sub}</p>}
                    </div>
                    <span className="flex items-center gap-1">
                      <span className={cn('text-[14px] font-semibold', i.amount > 0 ? 'text-primary' : 'text-error')}>
                        {i.amount > 0 ? '+' : ''}{i.amount}
                      </span>
                      {i.link && <ChevronRight className="size-4 text-text-disabled" />}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
