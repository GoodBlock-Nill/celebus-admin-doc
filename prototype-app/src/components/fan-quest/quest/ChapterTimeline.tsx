'use client';

import { useFQStore } from '@/stores/useFQStore';
import ChapterCard from './ChapterCard';

export default function ChapterTimeline() {
  const chapters = useFQStore((s) => s.chapters);

  return (
    <div className="relative px-4 py-2">
      {chapters.map((chapter, index) => (
        <div key={chapter.id} className="relative flex gap-4">
          {/* Timeline line + dot */}
          <div className="flex flex-col items-center flex-shrink-0 w-8">
            {/* Dot */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 ${
                chapter.status === 'COMPLETED'
                  ? 'bg-violet-600 text-white'
                  : chapter.status === 'IN_PROGRESS' || chapter.status === 'AVAILABLE'
                  ? 'bg-white border-2 border-violet-600 text-violet-600 animate-pulse-glow'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {chapter.status === 'COMPLETED' ? '✓' : chapter.number}
            </div>
            {/* Line */}
            {index < chapters.length - 1 && (
              <div
                className={`w-0.5 flex-1 min-h-[16px] ${
                  chapter.status === 'COMPLETED' ? 'bg-violet-400' : 'bg-gray-200'
                }`}
              />
            )}
          </div>

          {/* Chapter card */}
          <div className="flex-1 pb-4">
            <ChapterCard chapter={chapter} />
          </div>
        </div>
      ))}
    </div>
  );
}
