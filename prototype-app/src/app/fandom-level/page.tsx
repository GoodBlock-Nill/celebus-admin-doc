'use client';

import { useState } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import Toast from '@/components/ui/Toast';
import { useUIStore } from '@/stores/useUIStore';
import { useArtistStore } from '@/stores/useArtistStore';
import { MOCK_FANDOM_LEVEL, MOCK_FANDOM_LEVEL_MAX } from '@/mock/fandom-level';
import { cn, formatNumber } from '@/lib/utils';
import type { FandomLevelState } from '@/lib/types';

type DebugPreset = 'progress' | 'max';

export default function FandomLevelPage() {
  const artistName = useArtistStore((s) => s.activeArtist.name);
  const addToast = useUIStore((s) => s.addToast);
  const [preset, setPreset] = useState<DebugPreset>('progress');
  const [debugOpen, setDebugOpen] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);

  const data: FandomLevelState = preset === 'max' ? MOCK_FANDOM_LEVEL_MAX : MOCK_FANDOM_LEVEL;
  const progress = Math.min((data.currentPt / data.targetPt) * 100, 100);
  const contributionPct = data.currentPt > 0 ? ((data.myContributionPt / data.currentPt) * 100).toFixed(1) : '0';

  const switchPreset = (p: DebugPreset) => {
    setPreset(p);
    setDebugOpen(false);
    if (p === 'max') setShowLevelUpModal(true);
  };

  return (
    <div className="min-h-dvh bg-white pb-8">
      <Toast />
      <SubPageHeader title={`${artistName} 키우기`} backHref="/artist" />

      {/* 현재 레벨 카드 */}
      <div className="mx-4 mt-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl px-5 py-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🏆</span>
          <span className="text-base font-bold text-gray-900">
            {artistName} Lv.{data.currentLevel} {data.isMax && <span className="text-amber-600">MAX!</span>}
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

        <p className="text-xs text-gray-500">내 기여: {formatNumber(data.myContributionPt)}pt ({contributionPct}%)</p>
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
            <a key={cta.label} href={cta.href} className="flex-1 bg-violet-50 rounded-xl px-3 py-3 text-center active:scale-[0.97] transition-transform">
              <span className="text-lg">{cta.icon}</span>
              <p className="text-[10px] font-semibold text-violet-700 mt-1">{cta.label}</p>
            </a>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">활동하면 팬덤 레벨에 기여됩니다</p>
      </div>

      {/* 레벨업 축하 모달 */}
      {showLevelUpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 animate-fadeIn" />
          <div className="relative z-10 w-full max-w-[340px] bg-white rounded-2xl px-6 py-8 animate-scaleIn text-center">
            <p className="text-4xl mb-3">🎉</p>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{artistName} Lv.{data.currentLevel} 달성!</h3>
            <p className="text-sm text-gray-500 mb-6">우리 팬덤이 함께 달성했어요!</p>
            <button onClick={() => setShowLevelUpModal(false)} className="w-full py-3 bg-amber-500 text-white rounded-xl text-sm font-semibold">
              보상 확인하기
            </button>
          </div>
        </div>
      )}

      {/* 플로팅 디버그 */}
      <div className="fixed bottom-20 right-4 z-50">
        {debugOpen && (
          <div className="mb-2 flex flex-col gap-1.5 animate-slideInUp">
            <button onClick={() => switchPreset('progress')} className={cn('w-12 h-10 rounded-xl shadow-md flex items-center justify-center text-sm', preset === 'progress' ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200')}>🔓</button>
            <button onClick={() => switchPreset('max')} className={cn('w-12 h-10 rounded-xl shadow-md flex items-center justify-center text-sm', preset === 'max' ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200')}>🏆</button>
          </div>
        )}
        <button onClick={() => setDebugOpen(!debugOpen)} className="w-12 h-12 rounded-full bg-gray-900 text-white shadow-lg flex flex-col items-center justify-center active:scale-95 transition-transform">
          <span className="text-base">{preset === 'progress' ? '🔓' : '🏆'}</span>
          <span className="text-[8px] leading-none">{preset === 'progress' ? '진행' : 'MAX'}</span>
        </button>
      </div>
    </div>
  );
}
