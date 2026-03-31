'use client';

import Link from 'next/link';
import type { Chapter } from '@/lib/fq-types';

interface ChapterCardProps {
  chapter: Chapter;
}

const statusConfig = {
  COMPLETED: { bg: 'bg-violet-50', border: 'border-violet-200', label: '클리어!', labelColor: 'text-violet-600' },
  IN_PROGRESS: { bg: 'bg-white', border: 'border-violet-300', label: '진행중', labelColor: 'text-violet-600' },
  AVAILABLE: { bg: 'bg-white', border: 'border-violet-300', label: '도전하기', labelColor: 'text-violet-600' },
  LOCKED: { bg: 'bg-gray-50', border: 'border-gray-200', label: '잠김', labelColor: 'text-gray-400' },
};

export default function ChapterCard({ chapter }: ChapterCardProps) {
  const config = statusConfig[chapter.status];
  const isAccessible = chapter.status !== 'LOCKED';
  const completedMissions = chapter.missions.filter((m) => m.status === 'COMPLETED').length;

  const content = (
    <div
      className={`p-3.5 rounded-xl border ${config.bg} ${config.border} transition-all ${
        isAccessible ? 'active:scale-[0.98]' : 'opacity-60'
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-sm font-bold text-gray-900">
            {chapter.number}장: {chapter.title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{chapter.subtitle}</p>
        </div>
        <span className={`text-[10px] font-semibold ${config.labelColor}`}>{config.label}</span>
      </div>

      {/* Mission progress */}
      {chapter.status !== 'LOCKED' && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <span className="text-[10px] text-gray-400">
            미션 {completedMissions}/{chapter.missions.length}
          </span>
          <span className="text-[10px] font-semibold text-pink-500">
            🎫 +{chapter.reward.tickets}장
          </span>
        </div>
      )}

      {chapter.status === 'LOCKED' && (
        <p className="text-[10px] text-gray-400 mt-2">🔒 이전 장을 클리어하면 해금됩니다</p>
      )}
    </div>
  );

  if (isAccessible) {
    return <Link href={`/quest/${chapter.id}`}>{content}</Link>;
  }

  return content;
}
