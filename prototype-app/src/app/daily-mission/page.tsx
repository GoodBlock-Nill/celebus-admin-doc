'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SubPageHeader from '@/components/layout/SubPageHeader';
import StreakHeader from '@/components/daily/StreakHeader';
import WeekDots from '@/components/daily/WeekDots';
import StreakBonuses from '@/components/daily/StreakBonuses';
import Toast from '@/components/ui/Toast';
import { useDailyStore } from '@/stores/useDailyStore';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

export default function DailyMissionPage() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);
  const {
    checkedIn, mission, streak, weekRecord, bonuses,
    checkIn, completeMission, claimBonus, reset,
  } = useDailyStore();

  const [showBonusModal, setShowBonusModal] = useState<{ days: number; pt: number } | null>(null);

  const allDone = checkedIn && mission.completed;

  const handleCheckIn = useCallback(() => {
    if (checkedIn) return;
    checkIn();
    addToast('success', '출석 완료! 덕력 10pt 획득');
  }, [checkedIn, checkIn, addToast]);

  const handleGoMission = useCallback(() => {
    if (mission.completed) return;
    // 미션 대상 화면으로 이동 (복귀 시 자동 완료 시뮬레이션)
    completeMission();
    addToast('success', `미션 완료! 덕력 ${mission.rewardPt}pt 획득`);
  }, [mission, completeMission, addToast]);

  const handleClaimBonus = useCallback((days: number, pt: number) => {
    claimBonus(days);
    setShowBonusModal(null);
    addToast('success', `🔥 ${days}일 연속 보너스! ${pt}pt 획득!`);
  }, [claimBonus, addToast]);

  // 보너스 달성 체크
  const pendingBonus = bonuses.find((b) => streak >= b.days && !b.claimed);

  return (
    <div className="min-h-dvh bg-white pb-8">
      <Toast />
      <SubPageHeader title="일일 미션" />

      {/* 스트릭 현황 */}
      <StreakHeader streak={streak} bonuses={bonuses} />

      {/* 요일별 도트 */}
      <WeekDots weekRecord={weekRecord} />

      {/* 오늘의 할 일 */}
      <div className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">오늘의 할 일</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* 출석 체크 */}
        <div className={cn(
          'rounded-2xl border px-4 py-4 mb-3 transition-all',
          checkedIn ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">{checkedIn ? '✅' : '☐'}</span>
              <span className={cn('text-sm font-semibold', checkedIn ? 'text-green-700' : 'text-gray-900')}>
                {checkedIn ? '출석 완료!' : '출석 체크'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">+10pt</span>
              {!checkedIn && (
                <button
                  onClick={handleCheckIn}
                  className="text-xs font-semibold text-white bg-violet-600 px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors"
                >
                  출석하기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 일일 미션 */}
        <div className={cn(
          'rounded-2xl border px-4 py-4 transition-all',
          mission.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
        )}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">{mission.completed ? '✅' : '☐'}</span>
              <span className={cn('text-sm font-semibold', mission.completed ? 'text-green-700' : 'text-gray-900')}>
                {mission.title}
              </span>
            </div>
            <span className="text-xs text-gray-400">+{mission.rewardPt}pt</span>
          </div>
          <p className="text-xs text-gray-500 ml-6 mb-2">{mission.description}</p>
          {!mission.completed && (
            <div className="ml-6">
              <button
                onClick={handleGoMission}
                className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                하러가기 →
              </button>
            </div>
          )}
          {mission.completed && (
            <p className="text-[10px] text-green-600 ml-6">덕력 {mission.rewardPt}pt 획득!</p>
          )}
        </div>

        {/* 모두 완료 */}
        {allDone && (
          <div className="text-center mt-4 py-3 animate-slideInUp">
            <span className="text-sm font-semibold text-violet-700">🎉 오늘 할 일 모두 완료!</span>
          </div>
        )}
      </div>

      {/* 스트릭 보너스 */}
      <StreakBonuses bonuses={bonuses} streak={streak} />

      {/* 달성 가능한 보너스 CTA */}
      {pendingBonus && (
        <div className="mx-4 mt-4">
          <button
            onClick={() => setShowBonusModal({ days: pendingBonus.days, pt: pendingBonus.rewardPt })}
            className="w-full py-3 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors animate-pulse-glow"
          >
            🔥 {pendingBonus.days}일 보너스 받기! (+{pendingBonus.rewardPt}pt)
          </button>
        </div>
      )}

      {/* 보너스 축하 모달 */}
      {showBonusModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 animate-fadeIn" />
          <div className="relative z-10 w-full max-w-[340px] bg-white rounded-2xl overflow-hidden animate-scaleIn text-center px-6 py-8">
            <p className="text-4xl mb-3">🔥</p>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {showBonusModal.days}일 연속 달성!
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {showBonusModal.pt}pt 보너스가 준비되어 있어요!
            </p>
            <button
              onClick={() => handleClaimBonus(showBonusModal.days, showBonusModal.pt)}
              className="w-full py-3 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors"
            >
              받기 🎁
            </button>
          </div>
        </div>
      )}

      {/* 플로팅 디버그 */}
      <div className="fixed bottom-20 right-4 z-50">
        <button
          onClick={() => {
            reset();
            addToast('info', '일일 미션 상태가 초기화되었습니다');
          }}
          className="w-12 h-12 rounded-full bg-gray-900 text-white shadow-lg flex flex-col items-center justify-center active:scale-95 transition-transform"
          title="상태 초기화"
        >
          <span className="text-base">🔄</span>
          <span className="text-[8px] leading-none">리셋</span>
        </button>
      </div>
    </div>
  );
}
