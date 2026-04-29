'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import SubPageHeader from '@/components/layout/SubPageHeader';
import PresetSelector from '@/components/dev/PresetSelector';
import StreakHeader from '@/components/daily/StreakHeader';
import WeekDots from '@/components/daily/WeekDots';
import StreakBonuses from '@/components/daily/StreakBonuses';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import { useDailyState, useCheckin, useCompleteMission, useClaimStreakBonus } from '@/lib/hooks/useDaily';
import { useUIStore } from '@/stores/useUIStore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DAILY_PRESET_OPTIONS, applyDailyPreset } from '@/lib/presets/daily';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function DailyMissionPage() {
  const { activeArtistId } = useActiveArtist();
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [preset, setPreset] = useState('default');

  const handlePreset = async (key: string) => {
    setPreset(key);
    await applyDailyPreset(key, queryClient);
    await queryClient.refetchQueries({ queryKey: ['daily-state'] });
  };

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
      onSuccess: () => addToast('success', '출석 완료! 덕력 5DUK 획득'),
      onError: () => addToast('error', '출석 처리 중 오류가 발생했습니다'),
    });
  }, [checkedIn, checkinMutation, addToast]);

  const handleGoMission = useCallback(() => {
    if (!mission || mission.completed) return;
    // v5.1: 일일 미션은 모두 완료 시 일괄 지급. 개별 토스트는 "완료" 안내만, 보상 메시지는 모두 완료 시 한 번만 발송
    completeMissionMutation.mutate(mission.id, {
      onSuccess: () => addToast('success', `오늘의 일일 미션을 모두 완료했어요! 덕력 ${mission.rewardPt}DUK 획득`),
      onError: () => addToast('error', '미션 처리 중 오류가 발생했습니다'),
    });
  }, [mission, completeMissionMutation, addToast]);

  const handleClaimBonus = useCallback((days: number, pt: number) => {
    claimBonusMutation.mutate(days, {
      onSuccess: () => {
        setShowBonusModal(null);
        addToast('success', `🔥 ${days}일 연속 보너스! ${pt}DUK 획득!`);
      },
      onError: () => addToast('error', '보너스 수령 중 오류가 발생했습니다'),
    });
  }, [claimBonusMutation, addToast]);

  // 보너스 달성 체크
  const pendingBonus = bonuses.find((b) => streak >= b.days && !b.claimed);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-white pb-20">
        <SubPageHeader title="일일 미션" backHref="/artist" />
        <div className="px-4 mt-4 space-y-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white pb-20">
      <SubPageHeader title="일일 미션" backHref="/artist" />

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
              <span className="text-xs text-gray-400">+5DUK</span>
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

        {/* 일일 미션 — null 시 안내 메시지 */}
        {!mission && (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 mb-3 text-center">
            <p className="text-sm text-gray-400">오늘 미션이 아직 준비되지 않았어요</p>
          </div>
        )}

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
              <span className="text-xs text-gray-400">+{mission.rewardPt}DUK</span>
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
              <p className="text-[10px] text-green-600 ml-6">덕력 {mission.rewardPt}DUK 획득!</p>
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
            🔥 {pendingBonus.days}일 보너스 받기! (+{pendingBonus.rewardPt}DUK)
          </button>
        </div>
      )}

      <PresetSelector presets={DAILY_PRESET_OPTIONS} current={preset} onSelect={handlePreset} />

      {/* 보너스 축하 모달 */}
      <ConfirmModal
        open={!!showBonusModal}
        title="스트릭 보너스 달성"
        confirmLabel="받기 🎁"
        onConfirm={() => showBonusModal && handleClaimBonus(showBonusModal.days, showBonusModal.pt)}
        onCancel={() => setShowBonusModal(null)}
        disabled={claimBonusMutation.isPending}
      >
        {showBonusModal && (
          <div className="text-center">
            <p className="text-4xl mb-3">🔥</p>
            <p className="text-lg font-bold text-gray-900 mb-2">
              {showBonusModal.days}일 연속 달성!
            </p>
            <p className="text-sm text-gray-500">
              {showBonusModal.pt}DUK 보너스가 준비되어 있어요!
            </p>
          </div>
        )}
      </ConfirmModal>

    </div>
  );
}
