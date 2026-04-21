'use client';

import { useState, useCallback } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import StreakHeader from '@/components/daily/StreakHeader';
import WeekDots from '@/components/daily/WeekDots';
import StreakBonuses from '@/components/daily/StreakBonuses';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import { useDailyState, useCheckin, useCompleteMission, useClaimStreakBonus } from '@/lib/hooks/useDaily';
import { useUIStore } from '@/stores/useUIStore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function DailyMissionPage() {
  const { activeArtistId } = useActiveArtist();
  const addToast = useUIStore((s) => s.addToast);

  const { data, isLoading } = useDailyState(activeArtistId);
  const checkinMutation = useCheckin(activeArtistId);
  const completeMissionMutation = useCompleteMission(activeArtistId);
  const claimBonusMutation = useClaimStreakBonus(activeArtistId);

  const [showBonusModal, setShowBonusModal] = useState<{ days: number; pt: number } | null>(null);

  const checkedIn = data?.checkedIn ?? false;
  const mission = data?.mission ?? null;
  const streak = data?.streak ?? 0;
  const weekRecord = data?.weekRecord ?? Array(7).fill(false);
  const bonuses = data?.bonuses ?? [];

  const allDone = checkedIn && (mission?.completed ?? false);

  const handleCheckIn = useCallback(() => {
    if (checkedIn) return;
    checkinMutation.mutate(undefined, {
      onSuccess: () => addToast('success', '출석 완료! 덕력 10pt 획득'),
      onError: () => addToast('error', '출석 처리 중 오류가 발생했습니다'),
    });
  }, [checkedIn, checkinMutation, addToast]);

  const handleGoMission = useCallback(() => {
    if (!mission || mission.completed) return;
    completeMissionMutation.mutate(mission.id, {
      onSuccess: () => addToast('success', `미션 완료! 덕력 ${mission.rewardPt}pt 획득`),
      onError: () => addToast('error', '미션 처리 중 오류가 발생했습니다'),
    });
  }, [mission, completeMissionMutation, addToast]);

  const handleClaimBonus = useCallback((days: number, pt: number) => {
    claimBonusMutation.mutate(days, {
      onSuccess: () => {
        setShowBonusModal(null);
        addToast('success', `🔥 ${days}일 연속 보너스! ${pt}pt 획득!`);
      },
      onError: () => addToast('error', '보너스 수령 중 오류가 발생했습니다'),
    });
  }, [claimBonusMutation, addToast]);

  // 보너스 달성 체크
  const pendingBonus = bonuses.find((b) => streak >= b.days && !b.claimed);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-white pb-8">
        <SubPageHeader title="일일 미션" />
        <div className="px-4 mt-4 space-y-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white pb-8">
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
                  disabled={checkinMutation.isPending}
                  className="text-xs font-semibold text-white bg-violet-600 px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  출석하기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 일일 미션 */}
        {mission && (
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
                  disabled={completeMissionMutation.isPending}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors disabled:opacity-50"
                >
                  하러가기 →
                </button>
              </div>
            )}
            {mission.completed && (
              <p className="text-[10px] text-green-600 ml-6">덕력 {mission.rewardPt}pt 획득!</p>
            )}
          </div>
        )}

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
              disabled={claimBonusMutation.isPending}
              className="w-full py-3 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              받기 🎁
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
