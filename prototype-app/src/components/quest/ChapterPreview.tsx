'use client';

import type { QuestChapter } from '@/lib/types';

interface ChapterPreviewProps {
  chapter: QuestChapter;
  onClose: () => void;
}

export default function ChapterPreview({ chapter, onClose }: ChapterPreviewProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 animate-fadeIn" />
      <div
        className="relative z-10 w-full max-w-[430px] bg-white rounded-t-2xl px-5 py-6 animate-slideInUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔒</span>
          <h3 className="text-base font-bold text-gray-900">
            {chapter.number}장: {chapter.title}
          </h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">{chapter.description}</p>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-400">미션 유형</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {chapter.missionHint}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs text-gray-400">보상</span>
          <div className="flex items-center gap-1">
            <span className="text-sm">🎁</span>
            <span className="text-xs text-gray-600">Grade {chapter.goodsGrade} &quot;???&quot;</span>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-blue-700">
            이전 장의 모든 미션을 제출하면 해금됩니다
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
