'use client';

import { useState, useCallback } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import TimelineNode from '@/components/quest/TimelineNode';
import ChapterPreview from '@/components/quest/ChapterPreview';
import StoryIntroBanner from '@/components/quest/StoryIntroBanner';
import CompleteBanner from '@/components/quest/CompleteBanner';
import RepeatingQuestCard from '@/components/quest/RepeatingQuestCard';
import Toast from '@/components/ui/Toast';
import { useQuestStore } from '@/stores/useQuestStore';
import { useArtistStore } from '@/stores/useArtistStore';
import { useUIStore } from '@/stores/useUIStore';
import type { QuestChapter } from '@/lib/types';
import type { PresetKey } from '@/mock/quests';

export default function QuestPage() {
  const artistName = useArtistStore((s) => s.activeArtist.name);
  const { chapters, repeatingQuests, isStoryComplete, expandedChapterId, toggleChapter, refresh, currentPreset, setPreset } = useQuestStore();
  const addToast = useUIStore((s) => s.addToast);
  const [storyRewardClaimed, setStoryRewardClaimed] = useState(false);

  const [previewChapter, setPreviewChapter] = useState<QuestChapter | null>(null);
  const [showStoryView, setShowStoryView] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  const handleNodeTap = useCallback(
    (chapter: QuestChapter) => {
      if (chapter.status === 'locked') {
        setPreviewChapter(chapter);
      } else {
        toggleChapter(chapter.id);
      }
    },
    [toggleChapter]
  );

  // Pull-to-Refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      refresh();
      setIsRefreshing(false);
    }, 800);
  }, [refresh]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (typeof window !== 'undefined' && window.scrollY === 0) {
      setTouchStart(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === 0) return;
    const diff = e.changedTouches[0].clientY - touchStart;
    if (diff > 80 && !isRefreshing) handleRefresh();
    setTouchStart(0);
  };

  const hasReviewingMissions = chapters.some(
    (ch) => ch.missions.some((m) => m.status === 'SUBMITTED')
  );

  const allSubmitted = !isStoryComplete && chapters.every(
    (ch) => ch.status === 'reviewing' || ch.status === 'cleared'
  );

  const currentChapter = chapters.find(
    (ch) => ch.status === 'active' || ch.status === 'provisional'
  );

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeModalShown, setCompleteModalShown] = useState(false);

  // 5장 완료 시 축하 모달 (1회성)
  if (isStoryComplete && !completeModalShown && !storyRewardClaimed) {
    if (!showCompleteModal) setShowCompleteModal(true);
  }

  const showTimeline = !isStoryComplete || showStoryView;

  return (
    <div
      className="min-h-dvh bg-white pb-8"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Toast />
      <SubPageHeader title={`${artistName} 챌린지`} backHref="/artist" />

      {/* Pull-to-Refresh 인디케이터 */}
      {isRefreshing && (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* === 스토리 완료 모드 === */}
      {isStoryComplete && !showStoryView && (
        <>
          <CompleteBanner
            onViewStory={() => setShowStoryView(true)}
            onClaimReward={() => {
              setStoryRewardClaimed(true);
              addToast('success', '🎉 5장 완료 보상을 수령했습니다! 서명 포카 래플 자격 + 독점 콘텐츠 해금');
            }}
            rewardClaimed={storyRewardClaimed}
          />

          <div className="px-4 mt-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                반복 퀘스트
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {repeatingQuests.length > 0 ? (
              <div className="space-y-3">
                {repeatingQuests.map((rq) => (
                  <RepeatingQuestCard key={rq.id} quest={rq} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-2xl mb-3">🎉</p>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  이번 주 퀘스트를 모두 완료했어요!
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  새 퀘스트가 열리면 알려드릴게요
                </p>
                <button className="text-xs font-medium text-violet-600 bg-violet-50 px-4 py-2 rounded-lg mb-4">
                  알림 설정하기
                </button>
                <div className="flex justify-center gap-4">
                  <button className="text-xs text-gray-500 underline">덕력 랭킹 확인</button>
                  <button className="text-xs text-gray-500 underline">래플 응모하기</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* === 스토리 타임라인 모드 === */}
      {showTimeline && (
        <>
          {showStoryView && (
            <div className="px-4 mt-3">
              <button
                onClick={() => setShowStoryView(false)}
                className="text-xs text-gray-500"
              >
                ← 반복 퀘스트로 돌아가기
              </button>
            </div>
          )}

          {!showStoryView && currentChapter && (
            <StoryIntroBanner artistName={artistName} currentChapter={currentChapter.number} />
          )}

          <div className="px-4 mt-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                타임라인
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {chapters.map((chapter, idx) => (
              <TimelineNode
                key={chapter.id}
                chapter={chapter}
                isExpanded={expandedChapterId === chapter.id}
                isLast={idx === chapters.length - 1}
                readOnly={showStoryView}
                onTap={() => handleNodeTap(chapter)}
              />
            ))}
          </div>

          {/* 전 장 심사중 안내 (D-4) */}
          {allSubmitted && !showStoryView && (
            <div className="mx-4 mt-2 mb-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-center">
              <p className="text-sm font-semibold text-violet-700">
                모든 미션을 제출했습니다! 🎉
              </p>
              <p className="text-xs text-violet-500 mt-1">
                심사 결과를 기다려주세요
              </p>
            </div>
          )}

          {hasReviewingMissions && !allSubmitted && !showStoryView && (
            <div className="mx-4 mt-2 mb-6 bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500">
                ℹ️ 결과는 빠르면 하루 안에 알려드릴게요!
              </p>
            </div>
          )}
        </>
      )}

      {previewChapter && (
        <ChapterPreview chapter={previewChapter} onClose={() => setPreviewChapter(null)} />
      )}

      {/* 5장 완료 축하 모달 (A-1) */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 animate-fadeIn" />
          <div className="relative z-10 w-full max-w-[340px] bg-white rounded-2xl overflow-hidden animate-scaleIn text-center px-6 py-8">
            <p className="text-4xl mb-3">🎉</p>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{artistName} 챌린지 완주!</h3>
            <p className="text-sm text-gray-500 mb-6">
              5장의 스토리를 모두 완료했습니다!<br />특별한 보상이 준비되어 있어요.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setCompleteModalShown(true);
                  setStoryRewardClaimed(true);
                  addToast('success', '🎉 5장 완료 보상을 수령했습니다! 서명 포카 래플 자격 + 독점 콘텐츠 해금');
                }}
                className="flex-1 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
              >
                보상 받기
              </button>
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setCompleteModalShown(true);
                }}
                className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium"
              >
                나중에
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 디버그 플로팅 버튼 */}
      <DebugPresetSwitcher currentPreset={currentPreset} onSwitch={setPreset} />
    </div>
  );
}

const PRESET_LIST: { key: PresetKey; label: string; icon: string }[] = [
  { key: 'ch1', label: '1장', icon: '1️⃣' },
  { key: 'ch2', label: '2장', icon: '2️⃣' },
  { key: 'ch3', label: '3장', icon: '3️⃣' },
  { key: 'ch4', label: '4장', icon: '4️⃣' },
  { key: 'ch5', label: '5장', icon: '5️⃣' },
  { key: 'complete', label: '완료', icon: '✅' },
];

function DebugPresetSwitcher({ currentPreset, onSwitch }: { currentPreset: PresetKey; onSwitch: (p: PresetKey) => void }) {
  const [open, setOpen] = useState(false);
  const current = PRESET_LIST.find((p) => p.key === currentPreset);

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {open && (
        <div className="mb-2 flex flex-col gap-1.5 animate-slideInUp">
          {PRESET_LIST.map((p) => (
            <button
              key={p.key}
              onClick={() => { onSwitch(p.key); setOpen(false); }}
              className={`w-12 h-10 rounded-xl shadow-md flex items-center justify-center text-sm transition-all ${
                p.key === currentPreset
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              {p.icon}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full bg-gray-900 text-white shadow-lg flex flex-col items-center justify-center active:scale-95 transition-transform"
      >
        <span className="text-base">{current?.icon}</span>
        <span className="text-[8px] leading-none">{current?.label}</span>
      </button>
    </div>
  );
}
