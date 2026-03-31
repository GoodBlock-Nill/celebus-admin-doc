'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFQStore } from '@/stores/useFQStore';
import FQHeader from '@/components/layout/FQHeader';

export default function QuestSubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { activeQuests, submitQuest, triggerCelebration } = useFQStore();
  const quest = activeQuests.find((q) => q.id === id);
  const [hasImage, setHasImage] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  if (!quest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">퀘스트를 찾을 수 없습니다</p>
      </div>
    );
  }

  const isEditable =
    quest.submissionStatus === 'AVAILABLE' || quest.submissionStatus === 'REJECTED';
  const canSubmit = isEditable && hasImage;

  const handleSubmit = () => {
    if (!canSubmit) return;
    submitQuest(quest.id);
    triggerCelebration('reward', { chapter: '퀘스트 제출 완료' });
    setTimeout(() => router.back(), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <FQHeader title="Quest" />

      <div className="px-4 py-4 space-y-4">
        {/* Quest info */}
        <div className="p-4 bg-white rounded-2xl border border-violet-100">
          <span className="text-[10px] text-violet-500 font-semibold">
            [{quest.artistName}] QUEST
          </span>
          <h2 className="text-base font-bold text-gray-900 mt-1">{quest.title}</h2>
          <p className="text-xs text-gray-500 mt-2">{quest.description}</p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs font-semibold text-pink-500">🎫 +{quest.rewardTickets}장</span>
            {quest.dDay > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                D-{quest.dDay}
              </span>
            )}
          </div>
        </div>

        {/* Related links */}
        {quest.relatedLinks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quest.relatedLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full"
              >
                🔗 {link.label}
              </a>
            ))}
          </div>
        )}

        {/* Rejection notice */}
        {quest.submissionStatus === 'REJECTED' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs font-semibold text-red-600">⚠️ 반려됨</p>
            <p className="text-[10px] text-red-500 mt-0.5">
              {quest.rejectionCode ?? '이미지를 확인 후 다시 제출해주세요'}
            </p>
          </div>
        )}

        {/* Pending */}
        {quest.submissionStatus === 'PENDING' && (
          <div className="p-4 bg-amber-50 rounded-xl text-center">
            <p className="text-sm font-semibold text-amber-700">⏳ 현재 검토 진행 중입니다</p>
            <p className="text-xs text-amber-600 mt-1">보통 1~2 영업일 내에 처리됩니다</p>
          </div>
        )}

        {/* Completed */}
        {quest.submissionStatus === 'COMPLETED' && (
          <div className="p-4 bg-emerald-50 rounded-xl text-center">
            <p className="text-lg font-semibold text-emerald-700">✅ 참여 완료!</p>
            <p className="text-xs text-emerald-600 mt-1">응모권 {quest.rewardTickets}장이 지급되었어요</p>
          </div>
        )}

        {/* Upload area */}
        {isEditable && (
          <div className="p-4 bg-white rounded-2xl border border-violet-100">
            <p className="text-xs font-semibold text-gray-500 mb-3">인증 이미지 업로드</p>
            {hasImage ? (
              <div className="relative h-48 bg-violet-50 rounded-xl flex flex-col items-center justify-center">
                <span className="text-5xl">📷</span>
                <p className="text-xs text-violet-600 mt-2">이미지 업로드됨</p>
                <button
                  onClick={() => setHasImage(false)}
                  className="absolute top-2 right-2 w-7 h-7 bg-gray-800/50 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setHasImage(true)}
                  className="flex-1 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 active:bg-gray-100"
                >
                  <span className="text-2xl">🖼️</span>
                  <span className="text-[10px] text-gray-500">갤러리</span>
                </button>
                <button
                  onClick={() => setHasImage(true)}
                  className="flex-1 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 active:bg-gray-100"
                >
                  <span className="text-2xl">📸</span>
                  <span className="text-[10px] text-gray-500">카메라</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upload guide accordion */}
        {quest.uploadGuide && isEditable && (
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full text-left p-3 bg-white rounded-xl border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">📋 업로드 사진 가이드</span>
              <span className="text-gray-400 text-xs">{showGuide ? '▲' : '▼'}</span>
            </div>
            {showGuide && (
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{quest.uploadGuide}</p>
            )}
          </button>
        )}
      </div>

      {/* Submit button – fixed bottom */}
      {isEditable && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 p-4 safe-bottom">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-colors ${
              canSubmit
                ? 'bg-violet-600 text-white active:bg-violet-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {hasImage ? '제출하기' : '이미지를 업로드해주세요'}
          </button>
        </div>
      )}
    </div>
  );
}
