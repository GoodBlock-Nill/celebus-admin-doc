'use client';

import type { RepeatingQuest } from '@/lib/types';
import { cn } from '@/lib/utils';

const STATUS_BADGE = {
  active: { label: '진행중', style: 'bg-green-100 text-green-700' },
  ready: { label: '신규', style: 'bg-blue-100 text-blue-700' },
  ended: { label: '종료', style: 'bg-gray-100 text-gray-500' },
};

interface RepeatingQuestCardProps {
  quest: RepeatingQuest;
}

export default function RepeatingQuestCard({ quest }: RepeatingQuestCardProps) {
  const badge = STATUS_BADGE[quest.status];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-4 active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">📋</span>
        <h3 className="text-sm font-semibold text-gray-900 flex-1 truncate">{quest.title}</h3>
        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', badge.style)}>
          {badge.label}
        </span>
      </div>
      <p className="text-[10px] text-gray-400 mb-1">{quest.period}</p>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>미션 {quest.missionCount}개</span>
        <span>|</span>
        <span>{quest.rewardText}</span>
      </div>
      {quest.status !== 'ended' && (
        <div className="mt-3 text-right">
          <span className="text-xs font-medium text-violet-600">참여하기 →</span>
        </div>
      )}
    </div>
  );
}
