'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/useUIStore';
import { useMonthlyMemoryCount } from '@/lib/hooks/useMemory';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import { cn } from '@/lib/utils';
import ConfirmModal from '@/components/ui/ConfirmModal';

type MemoryType = 'photo' | 'letter' | 'memo';

const EMOJIS = [
  { emoji: '😍', label: '설렘' },
  { emoji: '😭', label: '감동' },
  { emoji: '🎉', label: '신남' },
  { emoji: '💜', label: '사랑' },
  { emoji: '🤩', label: '어마' },
  { emoji: '✨', label: '행복' },
];

export default function MemoryCreatePage() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);
  // Fix 6: 월간 잔여 횟수
  const { activeArtistId } = useActiveArtist();
  const { data: monthlyCount } = useMonthlyMemoryCount(activeArtistId);

  const [memoryType, setMemoryType] = useState<MemoryType>('photo');
  const [selectedEmojis, setSelectedEmojis] = useState<Set<string>>(new Set());
  const [location, setLocation] = useState('');
  const [text, setText] = useState('');
  const [imageCount, setImageCount] = useState(0);
  const [isPublic, setIsPublic] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEmojiError, setShowEmojiError] = useState(false);

  const hasInput = selectedEmojis.size > 0 || text.length > 0 || location.length > 0 || imageCount > 0;
  const textRequired = memoryType === 'letter' || memoryType === 'memo';
  const canSave = selectedEmojis.size >= 1 && (!textRequired || text.length > 0);

  const toggleEmoji = (emoji: string) => {
    setSelectedEmojis((prev) => {
      const next = new Set(prev);
      if (next.has(emoji)) { next.delete(emoji); }
      else if (next.size < 3) { next.add(emoji); }
      else { addToast('info', '이모지는 최대 3개까지 선택할 수 있어요'); }
      return next;
    });
    // Clear emoji error as soon as user interacts with the selector
    setShowEmojiError(false);
  };

  const handleSave = () => {
    if (selectedEmojis.size === 0) {
      setShowEmojiError(true);
      return;
    }
    setShowEmojiError(false);
    addToast('success', '기억이 저장되었어요! 덕력 30pt 획득');
    setTimeout(() => router.back(), 500);
  };

  const handleBack = () => {
    if (hasInput) { setShowCancelModal(true); }
    else { router.back(); }
  };

  return (
    <div className="min-h-dvh bg-white pb-24">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-top">
        <div className="flex items-center h-12 px-4">
          <button onClick={handleBack} className="mr-3 -ml-1 p-1">
            <span className="text-gray-900">←</span>
          </button>
          <h1 className="text-base font-semibold text-gray-900">기억 남기기</h1>
        </div>
      </header>

      <div className="px-4 py-4 space-y-5">
        {/* Fix 6: 월간 잔여 횟수 표시 */}
        <p className="text-xs text-gray-400 text-center">이번 달 {monthlyCount ?? 0}/50건</p>

        {/* 1. 유형 선택 */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">유형</label>
          <div className="flex gap-2">
            {[
              { key: 'photo' as MemoryType, icon: '📸', label: '사진 기록' },
              { key: 'letter' as MemoryType, icon: '✉️', label: '편지' },
              { key: 'memo' as MemoryType, icon: '📝', label: '메모' },
            ].map((t) => (
              <button key={t.key}
                onClick={() => setMemoryType(t.key)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors',
                  memoryType === t.key ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'
                )}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. 날짜 선택 */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">날짜</label>
          <input type="date" defaultValue={new Date().toISOString().split('T')[0]}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900" />
        </div>

        {/* 3. 감정 이모지 (필수) */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">
            감정 <span className="text-violet-500">*</span> <span className="text-gray-400 font-normal">(1~3개 선택)</span>
          </label>
          <div className="flex gap-2">
            {EMOJIS.map((e) => (
              <button key={e.emoji} onClick={() => toggleEmoji(e.emoji)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all',
                  selectedEmojis.has(e.emoji) ? 'bg-violet-100 border-2 border-violet-400 scale-105' : showEmojiError ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'
                )}>
                <span className="text-xl">{e.emoji}</span>
                <span className="text-[9px] text-gray-500">{e.label}</span>
              </button>
            ))}
          </div>
          {showEmojiError && (
            <p className="text-xs text-red-500 mt-1.5">감정 이모지를 1개 이상 선택해주세요</p>
          )}
        </div>

        {/* 4. 위치 (선택) */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">위치 <span className="text-gray-400 font-normal">(선택)</span></label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder="장소를 입력해주세요 (선택)"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400" />
        </div>

        {/* 5. 미디어 업로드 (선택) */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">사진/영상 <span className="text-gray-400 font-normal">(선택)</span></label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: imageCount }).map((_, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <span className="text-2xl">📷</span>
                <button onClick={() => setImageCount((c) => c - 1)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">✕</button>
              </div>
            ))}
            {/* Fix #28: 이미지 3장 초과 시 토스트 */}
            <button
              onClick={() => {
                if (imageCount >= 3) {
                  addToast('info', '이미지는 최대 3장까지 추가할 수 있어요');
                  return;
                }
                setImageCount((c) => c + 1);
                addToast('info', '이미지 추가됨 (시뮬레이션)');
              }}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center shrink-0 text-gray-400">
              <span className="text-xl">+</span>
              <span className="text-[9px]">{imageCount}/3</span>
            </button>
          </div>
        </div>

        {/* 6. 텍스트 입력 */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">
            내용 {textRequired && <span className="text-violet-500">*</span>}
          </label>
          <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 1000))}
            placeholder={memoryType === 'photo' ? '이 순간을 기록해보세요 (선택)' : memoryType === 'letter' ? '마음을 전해보세요' : '오늘의 기억을 남겨보세요'}
            rows={5}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 resize-none" />
          <div className="flex justify-end mt-1">
            <span className={cn(
              'text-[10px]',
              text.length >= 950 ? 'text-red-500 font-bold' : text.length >= 800 ? 'text-amber-500 font-medium' : 'text-gray-400'
            )}>{text.length}/1,000</span>
          </div>
        </div>

        {/* 7. 공개/비공개 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-700">{isPublic ? '🌐 공개' : '🔒 비공개'}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">공개 시 다른 팬도 볼 수 있어요</p>
          </div>
          <button onClick={() => setIsPublic(!isPublic)}
            className={cn('w-11 h-6 rounded-full transition-colors relative', isPublic ? 'bg-violet-500' : 'bg-gray-300')}>
            <div className={cn('w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform', isPublic ? 'translate-x-5' : 'translate-x-0.5')} />
          </button>
        </div>
      </div>

      {/* 하단 CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 safe-bottom">
        <button onClick={handleSave} disabled={!canSave}
          className={cn('w-full py-3.5 rounded-xl text-sm font-bold transition-colors', canSave ? 'bg-violet-600 text-white active:bg-violet-700' : 'bg-gray-200 text-gray-400')}>
          저장하기
        </button>
      </div>

      {/* 취소 확인 모달 */}
      <ConfirmModal
        open={showCancelModal}
        title="작성을 취소할까요?"
        confirmLabel="나가기"
        cancelLabel="취소"
        confirmVariant="danger"
        onConfirm={() => router.back()}
        onCancel={() => setShowCancelModal(false)}
      >
        <p className="text-xs text-gray-400">입력한 내용이 사라져요</p>
      </ConfirmModal>
    </div>
  );
}
