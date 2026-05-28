'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';
import SubHeader from '@/components/layout/SubHeader';
import { ARTISTS } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function ArtistDiscoverPage() {
  const [follows, setFollows] = useState(() => Object.fromEntries(ARTISTS.map((a) => [a.id, a.followed])));
  const mine = ARTISTS.filter((a) => follows[a.id]);

  return (
    <div className="min-h-dvh">
      <SubHeader title="아티스트" right={<Search className="size-5 text-foreground" />} />
      <div className="space-y-6 px-4 pt-2">
        <section>
          <h2 className="mb-3 text-[14px] font-semibold text-text-muted-title">내 아티스트</h2>
          <div className="flex gap-4 rounded-2xl bg-primary-900/40 p-4">
            {mine.map((a) => (
              <div key={a.id} className="flex flex-col items-center gap-1.5">
                <span className={cn('size-14 overflow-hidden rounded-full border-2', a.id === 'v01d' ? 'border-primary' : 'border-transparent')}>
                  <Image src={a.logo} alt={a.name} width={56} height={56} className="size-full object-cover" />
                </span>
                <span className="text-[11px] text-text-body">{a.id === 'v01d' && '✓ '}{a.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[14px] font-semibold text-text-muted-title">전체 아티스트</h2>
          <div className="space-y-1">
            {ARTISTS.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2.5">
                <Image src={a.logo} alt={a.name} width={40} height={40} className="size-10 rounded-full object-cover" />
                <span className="flex-1 text-[15px] font-semibold">{a.name}</span>
                <button
                  onClick={() => setFollows((s) => ({ ...s, [a.id]: !s[a.id] }))}
                  className={cn('rounded-full px-4 py-1.5 text-[12px] font-medium', follows[a.id] ? 'bg-muted text-text-body' : 'bg-primary text-white')}
                >
                  {follows[a.id] ? '✓ 팔로우' : '팔로우'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
