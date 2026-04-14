'use client';

import { useUIStore } from '@/stores/useUIStore';

interface OnboardingOverlayProps {
  onDismiss: () => void;
}

export default function OnboardingOverlay({ onDismiss }: OnboardingOverlayProps) {
  const showOnboarding = useUIStore((s) => s.showOnboarding);

  if (!showOnboarding) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-6 animate-fadeIn"
      onClick={onDismiss}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-[360px] w-full animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          아티스트 메인 안내
        </h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <span className="text-lg">🎯</span>
            <p><strong>미션</strong> — 챌린지, 일일 미션, 서포트로 활동하세요</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">⭐</span>
            <p><strong>내기록</strong> — 덕력, 컬렉션, 응모, 팬덤 레벨을 확인하세요</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">📋</span>
            <p><strong>더보기</strong> — 아티스트 정보와 기억 저장소를 둘러보세요</p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="w-full mt-5 py-3 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition-colors"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
