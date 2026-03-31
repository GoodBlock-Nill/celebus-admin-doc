'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useFQStore } from '@/stores/useFQStore';
import FQHeader from '@/components/layout/FQHeader';
import MissionItem from '@/components/fan-quest/quest/MissionItem';
import RewardPreview from '@/components/fan-quest/quest/RewardPreview';

export default function ChapterDetailPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = use(params);
  const router = useRouter();
  const chapters = useFQStore((s) => s.chapters);
  const completeChapter = useFQStore((s) => s.completeChapter);
  const triggerCelebration = useFQStore((s) => s.triggerCelebration);
  const chapter = chapters.find((c) => c.id === chapterId);

  if (!chapter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">챕터를 찾을 수 없습니다</p>
      </div>
    );
  }

  const allMissionsCompleted = chapter.missions.every((m) => m.status === 'COMPLETED');
  const canComplete = allMissionsCompleted && chapter.status !== 'COMPLETED';

  const handleCompleteChapter = () => {
    completeChapter(chapter.id);
    triggerCelebration('chapter', { chapter: `${chapter.number}장` });
    setTimeout(() => router.push('/quest'), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <FQHeader title={`${chapter.number}장: ${chapter.title}`} />

      {/* Chapter info */}
      <div className="px-4 py-4">
        <p className="text-sm text-gray-600">{chapter.subtitle}</p>
      </div>

      {/* Missions */}
      <div className="px-4 space-y-2">
        <p className="text-xs font-semibold text-gray-400 mb-2">미션 목록</p>
        {chapter.missions.map((mission) => (
          <MissionItem key={mission.id} mission={mission} />
        ))}
      </div>

      {/* Complete chapter button */}
      {canComplete && (
        <div className="px-4 mt-4">
          <button
            onClick={handleCompleteChapter}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold rounded-xl active:opacity-90 transition-opacity"
          >
            🎉 {chapter.number}장 클리어하기!
          </button>
        </div>
      )}

      {/* Rewards */}
      <div className="px-4 mt-4">
        <RewardPreview chapter={chapter} />
      </div>
    </div>
  );
}
