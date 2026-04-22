'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import { useUIStore } from '@/stores/useUIStore';
import { useSubmitMission, useQuestChapters } from '@/lib/hooks/useQuests';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import { CameraIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

function QuestSubmitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useUIStore((s) => s.addToast);
  const { activeArtistId } = useActiveArtist();
  const submitMissionMutation = useSubmitMission(activeArtistId);
  const { data: chapters = [] } = useQuestChapters(activeArtistId);

  const missionTitle = searchParams.get('title') || 'Quest 미션';
  const rewardText = searchParams.get('reward') || '';
  const chapterId = searchParams.get('chapterId') || '';
  const missionId = searchParams.get('missionId') || '';

  // 챕터 데이터에서 미션의 연관 링크 직접 조회
  const mission = chapters
    .find((ch) => ch.id === chapterId)
    ?.missions.find((m) => m.id === missionId);
  const relatedLinks = mission?.relatedLinks || [];

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const handleImageSelect = useCallback(() => {
    // Mock: 이미지 업로드 시뮬레이션
    setUploadedImage('/v01d/logo.png');
  }, []);

  const handleRemoveImage = useCallback(() => {
    setUploadedImage(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!uploadedImage || isSubmitting) return;
    setIsSubmitting(true);
    submitMissionMutation.mutate(
      { missionId, imageUrl: uploadedImage },
      {
        onSuccess: () => {
          addToast('success', '제출 완료! 결과는 빠르면 하루 안에 알려드릴게요');
          setIsSubmitting(false);
          router.back();
        },
        onError: () => {
          addToast('error', '제출 중 오류가 발생했습니다');
          setIsSubmitting(false);
        },
      }
    );
  }, [uploadedImage, isSubmitting, addToast, router, missionId, submitMissionMutation]);

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <SubPageHeader title="Quest" backHref="/quest" />

      <div className="flex-1 px-4 py-5">
        {/* Quest 정보 영역 */}
        <div className="mb-5">
          <h2 className="text-base font-bold text-gray-900">{missionTitle}</h2>
          <p className="text-sm text-gray-500 mt-1">
            미션을 완료하고 인증샷을 제출하세요.
          </p>
          {rewardText && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-sm">🎁</span>
              <span className="text-xs text-violet-600 font-medium">{rewardText}</span>
            </div>
          )}
        </div>

        {/* 연관 링크 */}
        {relatedLinks.length > 0 && (
          <div className="flex gap-2 mb-5 flex-wrap">
            {relatedLinks.map((link) => (
              <button
                key={link.url}
                onClick={() => window.open(link.url, '_blank')}
                className="text-xs bg-violet-50 text-violet-700 px-3 py-1.5 rounded-lg font-medium hover:bg-violet-100 transition-colors"
              >
                {link.label} ↗
              </button>
            ))}
          </div>
        )}

        {/* 업로드 영역 */}
        <div className="mb-5">
          <div className="flex items-baseline gap-2 mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              인증샷 업로드
            </p>
            <p className="text-[10px] text-gray-400">JPG, PNG, WebP, HEIC · 최대 10MB</p>
          </div>

          {uploadedImage ? (
            <div className="relative w-full aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadedImage}
                alt="업로드 미리보기"
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center"
              >
                <XMarkIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleImageSelect}
                className="flex flex-col items-center justify-center gap-2 h-32 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-gray-100 transition-colors"
              >
                <PhotoIcon className="w-8 h-8 text-gray-400" />
                <span className="text-xs text-gray-500">갤러리에서 선택</span>
              </button>
              <button
                onClick={handleImageSelect}
                className="flex flex-col items-center justify-center gap-2 h-32 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-gray-100 transition-colors"
              >
                <CameraIcon className="w-8 h-8 text-gray-400" />
                <span className="text-xs text-gray-500">사진 촬영하기</span>
              </button>
            </div>
          )}
        </div>

        {/* 가이드 아코디언 */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <button
            onClick={() => setGuideOpen(!guideOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700"
          >
            <span>업로드 사진 가이드</span>
            <span className={`text-xs text-gray-400 transition-transform ${guideOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          {guideOpen && (
            <div className="px-4 pb-3 text-xs text-gray-500 leading-relaxed animate-slideInUp">
              <ul className="space-y-1.5">
                <li>- 인증 대상이 명확하게 보이는 선명한 사진을 올려주세요</li>
                <li>- 흐리거나 어두운 사진은 재도전이 필요할 수 있어요</li>
                <li>- 다른 사람의 사진을 도용하면 재도전 대상이에요</li>
                <li>- JPG, PNG, HEIC 형식, 최대 10MB</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 하단 고정 바 */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 safe-bottom">
        <button
          onClick={handleSubmit}
          disabled={!uploadedImage || isSubmitting}
          className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-colors ${
            uploadedImage && !isSubmitting
              ? 'bg-violet-600 text-white hover:bg-violet-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              제출 중...
            </span>
          ) : (
            '제출하기'
          )}
        </button>
      </div>
    </div>
  );
}

export default function QuestSubmitPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-white" />}>
      <QuestSubmitContent />
    </Suspense>
  );
}
