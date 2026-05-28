'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Share2, Heart } from 'lucide-react';
import SubHeader from '@/components/layout/SubHeader';
import { INFO_TODAY, INFO_UPCOMING, ARTIST } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const item = [...INFO_TODAY, ...INFO_UPCOMING].find((i) => i.id === id) ?? INFO_TODAY[2];
  const [liked, setLiked] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col">
      <SubHeader title="소식" right={<Share2 className="size-5 text-foreground" />} />
      <div className="flex-1 px-4 pt-1">
        {item.official && <span className="rounded bg-primary-900 px-1.5 py-0.5 text-[11px] text-purple-light">[공식 제공]</span>}
        <h1 className="mt-2 text-[20px] font-bold leading-snug">{item.title}</h1>
        <div className="mt-2 flex items-center gap-2 text-[12px] text-text-disabled">
          <Image src={ARTIST.logo} alt="" width={20} height={20} className="size-5 rounded-full" />
          {ARTIST.name} · {item.time}
        </div>

        <Image src={item.image ?? '/v01d/group.jpg'} alt="" width={375} height={220} className="mt-4 w-full rounded-2xl object-cover" />

        <p className="mt-4 text-[14px] leading-relaxed text-text-card">
          {ARTIST.name}의 새로운 소식을 전해드립니다. 많은 관심과 응원 부탁드려요! 자세한 내용은 공식 채널에서 확인하실 수 있습니다.
        </p>
      </div>

      <div className="sticky bottom-0 flex items-center gap-4 border-t border-border-card bg-background/95 px-4 py-3 backdrop-blur">
        <button onClick={() => setLiked((v) => !v)} className={cn('flex items-center gap-1.5 text-[14px]', liked ? 'text-error' : 'text-text-body')}>
          <Heart className={cn('size-5', liked && 'fill-current')} /> {liked ? 1 : 0}
        </button>
        <button className="ml-auto flex items-center gap-1.5 text-[14px] text-text-body"><Share2 className="size-5" /> 공유</button>
      </div>
    </div>
  );
}
