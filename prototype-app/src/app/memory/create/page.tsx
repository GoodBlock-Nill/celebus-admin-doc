'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Plus, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import SubHeader from '@/components/layout/SubHeader';
import { PrimaryButton } from '@/components/ui/primitives';
import { EMOTIONS } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function MemoryCreatePage() {
  const [emotion, setEmotion] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(true);
  const [text, setText] = useState('');

  return (
    <div className="flex min-h-dvh flex-col">
      <SubHeader
        title="기억 남기기"
        right={
          <button onClick={() => setIsPrivate((v) => !v)} className="flex items-center gap-1.5 text-[12px] text-text-body">
            비공개
            <span className={cn('relative h-5 w-9 rounded-full transition-colors', isPrivate ? 'bg-primary' : 'bg-muted')}>
              <span className={cn('absolute top-0.5 size-4 rounded-full bg-white transition-all', isPrivate ? 'left-[18px]' : 'left-0.5')} />
            </span>
          </button>
        }
      />

      <div className="flex-1 space-y-5 px-4 pt-2">
        {/* 날짜 */}
        <button className="flex items-center gap-1 text-[16px] font-bold">2025.05.23 (토) <ChevronDown className="size-4 text-text-disabled" /></button>

        {/* 감정 이모지 */}
        <div className="flex justify-between">
          {EMOTIONS.map((e) => (
            <button key={e.key} onClick={() => setEmotion(e.key)} className="flex flex-col items-center gap-1">
              <span className={cn('grid size-12 place-items-center rounded-full text-[22px] transition-all', emotion === e.key ? 'bg-primary-900 ring-2 ring-primary' : 'bg-muted')}>{e.emoji}</span>
              <span className={cn('text-[11px]', emotion === e.key ? 'text-foreground' : 'text-text-disabled')}>{e.label}</span>
            </button>
          ))}
        </div>

        {/* 사진 추가 */}
        <div className="flex items-center gap-2">
          <button className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-card text-text-disabled">
            <Plus className="size-5" /><span className="text-[10px]">최대 3장</span>
          </button>
          <span className="text-[13px] text-text-body">사진을 추가해보세요</span>
        </div>

        {/* 텍스트 + 장소 */}
        <div className="rounded-2xl border border-border-card p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 1000))}
            placeholder="이 순간을 기록해 보세요"
            className="h-28 w-full resize-none bg-transparent text-[14px] outline-none placeholder:text-text-disabled"
          />
          <div className="mt-2 flex items-center justify-between border-t border-border-card pt-3">
            <Link href="/memory/place" className="flex items-center gap-1.5 text-[13px] text-purple-light"><MapPin className="size-4" /> 장소를 추가해 보세요</Link>
            <span className="text-[12px] text-text-disabled">{text.length}/1,000</span>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-background/95 p-4 backdrop-blur">
        <PrimaryButton disabled={!emotion} onClick={() => toast.success('기억이 저장되었어요! 덕력 30DUK 획득')}>저장하기</PrimaryButton>
      </div>
    </div>
  );
}
