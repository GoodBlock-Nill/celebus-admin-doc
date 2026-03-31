'use client';

import ChapterTimeline from '@/components/fan-quest/quest/ChapterTimeline';
import { useFQStore } from '@/stores/useFQStore';

export default function QuestPage() {
  const chapters = useFQStore((s) => s.chapters);
  const completedCount = chapters.filter((c) => c.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0F0A1A] via-violet-900 to-violet-700 px-5 pt-10 pb-6">
        <p className="text-violet-300 text-xs font-medium tracking-wider">V01D 팬싸 퀘스트</p>
        <h1 className="text-2xl font-black text-white mt-1">V01D 탐험</h1>
        <p className="text-violet-200/70 text-xs mt-1">
          5장을 모두 클리어하면 팬싸 응모 자격이 열려요
        </p>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-400 to-pink-400 rounded-full transition-all duration-700"
              style={{ width: `${(completedCount / 5) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-white">{completedCount}/5</span>
        </div>
      </div>

      {/* Chapter Timeline */}
      <div className="-mt-2 pt-4 pb-8">
        <ChapterTimeline />
      </div>
    </div>
  );
}
