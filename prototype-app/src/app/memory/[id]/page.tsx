'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Share2, MoreHorizontal, Eye, Heart, MapPin, Lock } from 'lucide-react';
import SubHeader from '@/components/layout/SubHeader';
import { MY_MEMORIES, ALL_MEMORIES } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function MemoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const mem = [...MY_MEMORIES, ...ALL_MEMORIES].find((m) => m.id === id) ?? MY_MEMORIES[0];
  const [liked, setLiked] = useState(false);

  return (
    <div className="min-h-dvh pb-8">
      <SubHeader title={`2026.05.${mem.date}의 기억`} right={<Share2 className="size-5 text-foreground" />} />
      <div className="px-4 pt-1">
        {/* 작성자 */}
        <div className="flex items-center gap-2.5">
          <Image src="/v01d/avatar.jpg" alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
          <div className="flex-1">
            <p className="text-[14px] font-semibold">{mem.author}</p>
            <p className="flex items-center gap-1 text-[12px] text-text-disabled">2026.05.{mem.date} 19:23 KST {mem.isPublic ? '· 공개' : <>· <Lock className="size-3" /> 비공개</>}</p>
          </div>
          <MoreHorizontal className="size-5 text-text-disabled" />
        </div>

        {/* 이미지 */}
        {mem.image && (
          <div className="mt-3 overflow-hidden rounded-2xl">
            <Image src={mem.image} alt="" width={375} height={375} className="aspect-square w-full object-cover" />
          </div>
        )}

        {/* 감정 + 지표 */}
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[14px]"><span className="text-[18px]">{mem.emotion}</span></span>
          <div className="flex items-center gap-4 text-[13px] text-text-disabled">
            <span className="flex items-center gap-1"><Eye className="size-4" />{mem.views}</span>
            <button onClick={() => setLiked((v) => !v)} className={cn('flex items-center gap-1', liked && 'text-error')}>
              <Heart className={cn('size-4', liked && 'fill-current')} />{mem.likes + (liked ? 1 : 0)}
            </button>
          </div>
        </div>

        {/* 텍스트 */}
        <p className="mt-3 text-[14px] leading-relaxed">{mem.text}</p>

        {/* 위치 */}
        {mem.place && <p className="mt-3 flex items-center gap-1 text-[13px] text-text-body"><MapPin className="size-4 text-primary" />{mem.place}</p>}
      </div>
    </div>
  );
}
