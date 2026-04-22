'use client';

import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import SubPageHeader from '@/components/layout/SubPageHeader';
import GuestBanner from '@/components/ui/GuestBanner';
import PresetSelector from '@/components/dev/PresetSelector';
import { useUIStore } from '@/stores/useUIStore';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import { useFandomLevel } from '@/lib/hooks/useFandom';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatNumber } from '@/lib/utils';
import { FANDOM_PRESET_OPTIONS, applyFandomPreset } from '@/lib/presets/fandom';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function FandomLevelPage() {
  const { activeArtistId, artistName } = useActiveArtist();
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [preset, setPreset] = useState('progress');
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const prevPresetRef = useRef(preset);

  const handlePreset = async (key: string) => {
    if (key === 'guest') {
      setIsLoggedIn(false);
      setPreset(key);
      prevPresetRef.current = key;
      return;
    }
    setIsLoggedIn(true);
    const prev = prevPresetRef.current;
    prevPresetRef.current = key;
    setPreset(key);
    await applyFandomPreset(key, queryClient);
    if (key === 'max' && prev !== 'max') {
      setTimeout(() => setShowLevelUpModal(true), 400);
    }
  };

  const { data, isLoading } = useFandomLevel(activeArtistId);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-white pb-20">
        <SubPageHeader title={`${artistName} 키우기`} />
        <div className="mx-4 mt-4 space-y-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const progress = Math.min((data.currentPt / data.targetPt) * 100, 100);
  const contributionPct = data.currentPt > 0 ? ((data.myContributionPt / data.currentPt) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-dvh bg-white pb-20">
      {!isLoggedIn && <GuestBanner />}
      <SubPageHeader title={`${artistName} 키우기`} />

      {/* 현재 레벨 카드 */}
      <div className="mx-4 mt-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl px-5 py-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🏆</span>
          <span className="text-base font-bold text-gray-900">
            {artistName} Lv.{data.currentLevel} (누적) {data.isMax && <span className="text-amber-600">MAX!</span>}
          </span>
        </div>

        {!data.isMax ? (
          <>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-1.5">
              <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-xs text-gray-600 font-medium">{formatNumber(data.currentPt)} / {formatNumber(data.targetPt)}pt</span>
              <span className="text-xs text-amber-600 font-medium">{Math.round(progress)}%</span>
            </div>
          </>
        ) : (
          <div className="text-center py-3 mb-3">
            <p className="text-sm font-semibold text-amber-700">🎉 최고 레벨 달성!</p>
            <p className="text-xs text-amber-600 mt-1">새로운 레벨이 곧 열립니다</p>
          </div>
        )}

        {/* Fix #19: 비로그인 시 내 기여도 "-" 표시 */}
        <p className="text-xs text-gray-500">
          내 기여: {isLoggedIn ? `${formatNumber(data.myContributionPt)}pt (${contributionPct}%)` : '-'}
        </p>
      </div>

      {/* 레벨 보상 리스트 */}
      <div className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">레벨 보상</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <div className="space-y-2">
          {data.rewards.map((reward) => {
            const isCurrent = reward.level === data.currentLevel && !reward.unlocked;
            const levelProgress = isCurrent ? Math.min((data.currentPt / reward.targetPt) * 100, 100) : 0;

            return (
              <div key={reward.level} className={cn(
                'rounded-xl px-4 py-3 border',
                reward.unlocked ? 'bg-green-50 border-green-200' : isCurrent ? 'bg-violet-50 border-violet-200' : 'bg-gray-50 border-gray-200'
              )}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{reward.unlocked ? '✅' : isCurrent ? '🔓' : '🔒'}</span>
                  <span className={cn('text-xs font-semibold', reward.unlocked ? 'text-green-700' : isCurrent ? 'text-violet-700' : 'text-gray-400')}>
                    Lv.{reward.level}
                  </span>
                  <span className={cn('text-xs flex-1', reward.unlocked ? 'text-green-600' : isCurrent ? 'text-violet-600' : 'text-gray-400')}>
                    {reward.unlocked || isCurrent ? reward.rewardName : '???'}
                  </span>
                </div>
                {isCurrent && (
                  <div className="mt-2">
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${levelProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 팬덤 활동 요약 */}
      <div className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">팬덤 활동 요약</span>
          <span className="text-[9px] text-gray-400">(이번 달, 매월 초기화)</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-xl px-3 py-3 text-center">
            <span className="text-lg">👥</span>
            <p className="text-xs font-semibold text-gray-700 mt-1">{data.participantCount}명</p>
            <p className="text-[9px] text-gray-400">참여 팬</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-3 text-center">
            <span className="text-lg">⭐</span>
            <p className="text-xs font-semibold text-gray-700 mt-1">{formatNumber(data.monthlyTotal)}pt</p>
            <p className="text-[9px] text-gray-400">이번 달 합계</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-3 text-center">
            <span className="text-lg">🎯</span>
            <p className="text-xs font-semibold text-gray-700 mt-1">{data.topActivity}</p>
            <p className="text-[9px] text-gray-400">주요 활동</p>
          </div>
        </div>
      </div>

      {/* 덕력 획득 CTA */}
      <div className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">덕력 획득하러 가기</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="flex gap-2">
          {[
            { icon: '📋', label: '출석 체크', href: '/daily-mission' },
            { icon: '🎯', label: '퀘스트', href: '/quest' },
            { icon: '⭐', label: '랭킹', href: '/virtue' },
          ].map((cta) => (
            <button
              key={cta.label}
              onClick={() => addToast('info', `${cta.label} 화면으로 이동합니다`)}
              className="flex-1 bg-violet-50 rounded-xl px-3 py-3 text-center active:scale-[0.97] transition-transform"
            >
              <span className="text-lg">{cta.icon}</span>
              <p className="text-[10px] font-semibold text-violet-700 mt-1">{cta.label}</p>
            </button>
          ))}
        </div>
        {/* Fix #18: MAX 상태 시 CTA 텍스트 변형 */}
        <p className="text-[10px] text-gray-400 text-center mt-2">
          {data.isMax
            ? '활동하면 덕력이 쌓여요! 새 레벨이 열리면 바로 기여돼요'
            : '활동하면 팬덤 레벨에 기여됩니다'}
        </p>
      </div>

      {process.env.NODE_ENV !== 'production' && (
        <div className="px-4 mt-4">
          <button
            onClick={() => setShowLevelUpModal(true)}
            className="w-full py-2 rounded-xl bg-amber-100 text-amber-800 text-xs font-semibold active:bg-amber-200 transition-colors"
          >
            [DEV] 레벨업 축하 모달 테스트
          </button>
        </div>
      )}

      <PresetSelector presets={FANDOM_PRESET_OPTIONS} current={preset} onSelect={handlePreset} />

      {/* 레벨업 축하 모달 */}
      <ConfirmModal
        open={showLevelUpModal}
        title="레벨 달성"
        confirmLabel="보상 확인하기"
        onConfirm={() => setShowLevelUpModal(false)}
        onCancel={() => setShowLevelUpModal(false)}
      >
        <div className="text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-lg font-bold text-gray-900 mb-2">{artistName} Lv.{data.currentLevel} 달성!</p>
          <p className="text-sm text-gray-500">우리 팬덤이 함께 달성했어요!</p>
        </div>
      </ConfirmModal>
    </div>
  );
}
