'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import SubPageHeader from '@/components/layout/SubPageHeader';
import GuestBanner from '@/components/ui/GuestBanner';
import PresetSelector from '@/components/dev/PresetSelector';
import { useUIStore } from '@/stores/useUIStore';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import { useSupportEvents, useInvestSupport } from '@/lib/hooks/useSupport';
import { useUserCurrency } from '@/lib/hooks/useUser';
import { Skeleton } from '@/components/ui/skeleton';
import { SUPPORT_PRESET_OPTIONS, applySupportPreset, type SupportPreset } from '@/lib/presets/support';
import { formatNumber } from '@/lib/utils';
import EventCard from '@/components/support/EventCard';
import ConfirmModal from '@/components/ui/ConfirmModal';
import EmptyState from '@/components/ui/EmptyState';

export default function SupportPage() {
  const { artistName, activeArtistId } = useActiveArtist();
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const { data: events, isLoading } = useSupportEvents(activeArtistId);
  const { data: currency } = useUserCurrency(activeArtistId);
  const investMutation = useInvestSupport(activeArtistId);

  const [preset, setPreset] = useState('mixed');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [forceEmpty, setForceEmpty] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{ eventId: string; amount: number } | null>(null);
  const [investAmounts, setInvestAmounts] = useState<Record<string, number>>({});
  // Fix #12: 완료 이벤트 결과 이미지 전체화면
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const myHeldPt = currency?.virtueHeld ?? 0;

  const handlePreset = async (key: string) => {
    if (key === 'guest') {
      setIsLoggedIn(false);
      setForceEmpty(false);
      setPreset(key);
      return;
    }
    if (key === 'guestEmpty') {
      setIsLoggedIn(false);
      setForceEmpty(true);
      setPreset(key);
      return;
    }
    setIsLoggedIn(true);
    setForceEmpty(false);
    setPreset(key);
    await applySupportPreset(key as SupportPreset, queryClient);
    setExpandedId(null);
  };

  // Auto-expand first active event — useEffect avoids render-time side effects
  const firstActiveId = events?.find((e) => e.status === 'active')?.id;
  useEffect(() => {
    if (expandedId === null && firstActiveId) {
      setExpandedId(firstActiveId);
    }
  }, [firstActiveId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInvest = useCallback((eventId: string) => {
    if (!isLoggedIn) { addToast('info', '로그인 화면으로 이동합니다'); return; }
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
      <div className="min-h-dvh bg-white pb-20">
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
    <div className="min-h-dvh bg-white pb-20">
      {!isLoggedIn && <GuestBanner />}
      <SubPageHeader title={`${artistName} 응원하기`} />

      <div className="px-4 mt-4 space-y-3">
        {!forceEmpty && (events ?? []).map((event) => (
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

        {(forceEmpty || (events ?? []).length === 0) && (
          <EmptyState
            emoji="💜"
            title="현재 진행 중인 서포트 이벤트가 없습니다"
          />
        )}
      </div>

      <ConfirmModal
        open={!!showConfirmModal}
        title="덕력 응원"
        confirmLabel="응원"
        onConfirm={confirmInvest}
        onCancel={() => setShowConfirmModal(null)}
      >
        {showConfirmModal && (
          <>
            <p className="text-sm text-gray-700 leading-relaxed mb-2">덕력 {formatNumber(showConfirmModal.amount)}pt를 응원합니다.</p>
            <p className="text-xs text-violet-600 font-medium mb-2">응원 후 잔액: {formatNumber(Math.max(0, myHeldPt - showConfirmModal.amount))}pt</p>
            <p className="text-sm text-gray-900 font-semibold mb-3">한번 응원하면 돌이킬 수 없어요.<br />그래도 응원할까요?</p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>달성 시: 서포트 집행에 사용됩니다</p>
              <p>미달성 시: 전액 반환됩니다</p>
            </div>
          </>
        )}
      </ConfirmModal>

      <PresetSelector presets={SUPPORT_PRESET_OPTIONS} current={preset} onSelect={handlePreset} />

      {/* Fix #12: 결과 이미지 전체화면 오버레이 */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" role="dialog" aria-modal="true" aria-label="결과 이미지 전체화면" onClick={() => setFullscreenImage(null)}>
          <button className="absolute top-4 right-4 text-white text-2xl z-10">✕</button>
          <img src={fullscreenImage} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}

