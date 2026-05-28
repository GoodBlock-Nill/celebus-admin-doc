'use client';

import { useState } from 'react';
import { ImagePlus, Camera, Link2, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import SubHeader from '@/components/layout/SubHeader';
import { PrimaryButton } from '@/components/ui/primitives';
import { QUEST_SUBMIT } from '@/lib/data';

export default function QuestSubmitPage() {
  const [uploaded, setUploaded] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col">
      <SubHeader title="Quest" />

      <div className="flex-1 space-y-5 px-4 pt-2">
        {/* 보상 뱃지 */}
        <div className="flex gap-2">
          {QUEST_SUBMIT.badges.map((b) => (
            <span key={b} className="rounded-md bg-primary-900 px-2 py-1 text-[11px] font-medium text-purple-light">{b}</span>
          ))}
        </div>

        {/* 미션 정보 */}
        <div>
          <h1 className="text-[18px] font-bold">{QUEST_SUBMIT.title}</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-text-body">{QUEST_SUBMIT.desc}</p>
        </div>

        {/* 연관 링크 */}
        <div className="flex flex-wrap gap-2">
          {QUEST_SUBMIT.links.map((l) => (
            <button key={l} className="flex items-center gap-1.5 rounded-full border border-border-card px-3 py-1.5 text-[12px] text-text-card">
              <Link2 className="size-3.5 text-primary" />{l}
            </button>
          ))}
        </div>

        {/* 업로드 */}
        <div className="text-center">
          <h2 className="text-[16px] font-bold">업로드</h2>
          <p className="mt-1 text-[13px] text-text-body">인증샷을 업로드해주세요</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={() => { setUploaded(true); toast.success('이미지가 선택되었어요'); }} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-border-card bg-card text-text-body">
              <ImagePlus className="size-7" /><span className="text-[13px]">갤러리</span>
            </button>
            <button onClick={() => { setUploaded(true); toast.success('이미지가 선택되었어요'); }} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-border-card bg-card text-text-body">
              <Camera className="size-7" /><span className="text-[13px]">사진 촬영하기</span>
            </button>
          </div>
        </div>

        {/* 가이드 */}
        <div className="rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold">업로드 사진 가이드</p>
            <ChevronUp className="size-4 text-text-disabled" />
          </div>
          <ol className="mt-3 space-y-1.5 text-[13px] text-text-body">
            {QUEST_SUBMIT.guide.map((g, i) => (
              <li key={i}>{i + 1}. {g}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="sticky bottom-0 bg-background/95 p-4 backdrop-blur">
        <PrimaryButton disabled={!uploaded} onClick={() => toast.success('제출 완료! 결과는 빠르면 하루 안에 알려드릴게요')}>제출하기</PrimaryButton>
      </div>
    </div>
  );
}
