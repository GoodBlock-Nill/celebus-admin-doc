'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import SubPageHeader from '@/components/layout/SubPageHeader';
import PresetSelector from '@/components/dev/PresetSelector';
import { useUIStore } from '@/stores/useUIStore';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import { useSupportEvents, useInvestSupport } from '@/lib/hooks/useSupport';
import { useUserCurrency } from '@/lib/hooks/useUser';
import { Skeleton } from '@/components/ui/skeleton';
import { SUPPORT_PRESET_OPTIONS, applySupportPreset, type SupportPreset } from '@/lib/presets/support';
import { cn, formatNumber } from '@/lib/utils';
import type { SupportEvent, SupportEventStatus } from '@/lib/types';

const STATUS_CONFIG: Record<SupportEventStatus, { badge: string; color: string; icon: string }> = {
  active: { badge: '모집중', color: 'bg-green-100 text-green-700', icon: '' },
  achieved: { badge: '달성', color: 'bg-blue-100 text-blue-700', icon: '🎯' },
  executing: { badge: '집행중', color: 'bg-amber-100 text-amber-700', icon: '⏳' },
  completed: { badge: '완료', color: 'bg-gray-100 text-gray-600', icon: '✅' },
  expired: { badge: '미달성', color: 'bg-red-100 text-red-600', icon: '⛔' },
  cancelled: { badge: '취소', color: 'bg-gray-200 text-gray-500', icon: '🚫' },
};

export default function SupportPage() {
  const { artistName, activeArtistId } = useActiveArtist();
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const { data: events, isLoading } = useSupportEvents(activeArtistId);
  const { data: currency } = useUserCurrency(activeArtistId);
  const investMutation = useInvestSupport(activeArtistId);

  const [preset, setPreset] = useState('mixed');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{ eventId: string; amount: number } | null>(null);
  const [investAmounts, setInvestAmounts] = useState<Record<string, number>>({});
  // Fix #12: 완료 이벤트 결과 이미지 전체화면
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const myHeldPt = currency?.virtueHeld ?? 0;

  const handlePreset = async (key: string) => {
    if (key === 'guest') {
      setIsLoggedIn(false);
      setPreset(key);
      return;
    }
    setIsLoggedIn(true);
    setPreset(key);
    await applySupportPreset(key as SupportPreset, queryClient);
    setExpandedId(null);
  };

  // Auto-expand first active event
  const firstActiveId = events?.find((e) => e.status === 'active')?.id;
  if (expandedId === null && firstActiveId) {
    setExpandedId(firstActiveId);
  }

  const handleInvest = useCallback((eventId: string) => {
    if (!isLoggedIn) { addToast('info', '로그인 후 이용 가능합니다'); return; }
    const amount = investAmounts[eventId] || 100;
    setShowConfirmModal({ eventId, amount });
  }, [isLoggedIn, investAmounts, addToast]);

  const confirmInvest = useCallback(async () => {
    if (!showConfirmModal) return;
    try {
      await investMutation.mutateAsync({ eventId: showConfirmModal.eventId, amount: showConfirmModal.amount });
      addToast('success', `덕력 ${showConfirmModal.amount}pt 응원 완료!`);
    } catch {
      addToast('error', '앗, 응원이 전달되지 않았어요. 다시 시도해 주세요');
    }
    setShowConfirmModal(null);
  }, [showConfirmModal, investMutation, addToast]);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-white pb-8">
        <SubPageHeader title={`${artistName} 응원하기`} />
        <div className="px-4 mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white pb-8">
      {!isLoggedIn && (
        <div className="bg-violet-600 text-white text-center py-1.5 text-[10px] font-medium">
          👀 비로그인 미리보기 — 열람 가능, 참여 시 로그인 필요
        </div>
      )}
      <SubPageHeader title={`${artistName} 응원하기`} />

      <div className="px-4 mt-4 space-y-3">
        {(events ?? []).map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isExpanded={expandedId === event.id}
            onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)}
            investAmount={investAmounts[event.id] || 100}
            onAmountChange={(v) => setInvestAmounts((prev) => ({ ...prev, [event.id]: v }))}
            onInvest={() => handleInvest(event.id)}
            myHeldPt={myHeldPt}
            onImageFullscreen={setFullscreenImage}
          />
        ))}

        {(events ?? []).length === 0 && (
          <div className="text-center py-12">
            <span className="text-3xl">💜</span>
            <p className="text-sm font-semibold text-gray-900 mt-3">현재 진행 중인 서포트 이벤트가 없습니다</p>
          </div>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 animate-fadeIn" />
          <div className="relative z-10 w-full max-w-[340px] bg-white rounded-2xl px-6 py-6 animate-scaleIn">
            <h3 className="text-base font-bold text-gray-900 mb-3">덕력 응원</h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-2">덕력 {formatNumber(showConfirmModal.amount)}pt를 응원합니다.</p>
            <p className="text-xs text-violet-600 font-medium mb-2">응원 후 잔액: {formatNumber(Math.max(0, myHeldPt - showConfirmModal.amount))}pt</p>
            <p className="text-sm text-gray-900 font-semibold mb-3">한번 응원하면 돌이킬 수 없어요.<br />그래도 응원할까요?</p>
            <div className="text-xs text-gray-500 space-y-1 mb-5">
              <p>달성 시: 서포트 집행에 사용됩니다</p>
              <p>미달성 시: 전액 반환됩니다</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirmModal(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">취소</button>
              <button onClick={confirmInvest} className="flex-1 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold">응원</button>
            </div>
          </div>
        </div>
      )}

      <PresetSelector presets={SUPPORT_PRESET_OPTIONS} current={preset} onSelect={handlePreset} />

      {/* Fix #12: 결과 이미지 전체화면 오버레이 */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={() => setFullscreenImage(null)}>
          <button className="absolute top-4 right-4 text-white text-2xl z-10">✕</button>
          <img src={fullscreenImage} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}

function EventCard({ event, isExpanded, onToggle, investAmount, onAmountChange, onInvest, myHeldPt, onImageFullscreen }: {
  event: SupportEvent; isExpanded: boolean; onToggle: () => void;
  investAmount: number; onAmountChange: (v: number) => void; onInvest: () => void; myHeldPt: number;
  onImageFullscreen: (src: string) => void;
}) {
  const config = STATUS_CONFIG[event.status];
  const progress = Math.min((event.currentPt / event.targetPt) * 100, 100);
  const remaining = Math.max(event.targetPt - event.currentPt, 0);

  return (
    <div className={cn('rounded-2xl border transition-all', isExpanded ? 'border-violet-200 bg-violet-50/30' : 'border-gray-200 bg-white')}>
      <button onClick={onToggle} className="w-full px-4 py-4 text-left">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{config.icon || event.icon}</span>
          <span className="text-sm font-semibold text-gray-900 flex-1 truncate">{event.title}</span>
          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', config.color)}>{config.badge}</span>
        </div>
        {event.status === 'active' && (
          <>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-500">목표: {formatNumber(event.targetPt)}pt</span>
              <span className="text-[10px] text-gray-500">D-{event.daysLeft}</span>
            </div>
          </>
        )}
        {event.status === 'completed' && <p className="text-xs text-gray-500 mt-1">결과 보기 →</p>}
        {event.status === 'expired' && <p className="text-xs text-red-500 mt-1">응원 덕력 반환 완료</p>}
        {event.status === 'achieved' && <p className="text-xs text-blue-600 mt-1">목표 달성! 집행 대기</p>}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 animate-slideInUp">
          <p className="text-xs text-gray-600 mb-3">{event.description}</p>
          {event.myInvestPt > 0 && <p className="text-xs text-violet-600 mb-1">내 응원: {formatNumber(event.myInvestPt)}pt</p>}
          <p className="text-xs text-gray-500 mb-3">참여자: {event.participants}명</p>

          {(event.status === 'achieved' || event.status === 'executing') && (
            <div className="bg-blue-50 rounded-xl px-4 py-3 mb-3">
              <p className="text-sm font-semibold text-blue-800">목표 달성! 감사합니다 💜</p>
              <p className="text-xs text-blue-600 mt-1">{event.status === 'achieved' ? '집행 대기 중입니다' : '집행이 진행 중입니다'}</p>
            </div>
          )}

          {event.status === 'active' && (
            <div className="bg-white rounded-xl border border-gray-200 px-3 py-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => onAmountChange(Math.max(1, investAmount - 100))} className="w-8 h-8 bg-gray-100 rounded-lg text-sm font-bold">-</button>
                <input type="number" value={investAmount} onChange={(e) => onAmountChange(Math.min(Math.max(1, Number(e.target.value)), Math.min(myHeldPt, remaining)))}
                  className="flex-1 text-center text-sm font-semibold border border-gray-200 rounded-lg py-1.5" />
                <button onClick={() => onAmountChange(Math.min(investAmount + 100, Math.min(myHeldPt, remaining)))} className="w-8 h-8 bg-gray-100 rounded-lg text-sm font-bold">+</button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mb-2">보유: {formatNumber(myHeldPt)}pt | 남은 목표: {formatNumber(remaining)}pt</p>
              <button onClick={onInvest} disabled={investAmount < 1} className="w-full py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold disabled:bg-gray-200 disabled:text-gray-400">
                응원하기
              </button>
            </div>
          )}

          {event.status === 'completed' && event.resultMessage && (
            <div className="bg-green-50 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-green-800 mb-2">🎉 집행 완료!</p>
              <p className="text-xs text-green-700">{event.resultMessage}</p>
              {/* Fix #12: 결과 이미지 탭으로 전체화면 확대 */}
              {event.resultImages && (
                <div className="flex gap-2 mt-2">
                  {event.resultImages.map((img, i) => (
                    <button key={i} onClick={() => onImageFullscreen(img)}
                      className="w-16 h-16 bg-green-100 rounded-lg overflow-hidden active:scale-95 transition-transform shrink-0">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-green-600 mt-2">총 응원: {formatNumber(event.currentPt)}pt | 참여자: {event.participants}명</p>
            </div>
          )}

          {(event.status === 'expired' || event.status === 'cancelled') && (
            <div className="bg-red-50 rounded-xl px-4 py-3">
              <p className="text-xs text-red-600">{event.status === 'expired' ? '아쉽지만 이번엔 목표에 닿지 못했어요.' : '아쉽지만 이번 서포트가 취소되었어요.'} 응원한 덕력은 전액 돌려드렸어요</p>
              <p className="text-[10px] text-red-500 mt-1">반환 완료: {formatNumber(event.myInvestPt)}pt</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
