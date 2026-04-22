'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/useUIStore';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import PresetSelector from '@/components/dev/PresetSelector';
import { MEMORY_DETAIL_PRESET_OPTIONS, getMemoryDetailPresetState } from '@/lib/presets/memoryDetail';
import { PRESETS, type PresetKey } from '@/lib/presets/memoryDetailData';

export default function MemoryDetailPage() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);

  const [presetKey, setPresetKey] = useState<PresetKey>('photo');
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [fullscreenImg, setFullscreenImg] = useState<number | null>(null);
  const [galleryScrollIdx, setGalleryScrollIdx] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  const handlePreset = (key: string) => {
    setPresetKey(key as PresetKey);
  };

  const presetState = getMemoryDetailPresetState(presetKey);
  const memory = PRESETS[presetKey] ?? null;
  const isSharedGuest = presetState.isGuest;
  const isSharedPrivate = presetState.isLocked;

  const handleDelete = () => {
    setShowDeleteModal(false);
    addToast('success', '기억이 삭제되었어요');
    setTimeout(() => router.back(), 500);
  };

  const handleReport = (reason: string) => {
    setShowReportSheet(false);
    addToast('success', '신고가 접수되었어요');
  };

  return (
    <div className="min-h-dvh bg-white pb-20">

      {/* Fix 7: 삭제된 기억 에러 상태 */}
      {!memory && (
        <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-6 text-center">
          <span className="text-4xl mb-4">🗑️</span>
          <p className="text-base font-bold text-gray-900">삭제된 기억이에요</p>
          <p className="text-xs text-gray-400 mt-1">이미 삭제된 기억이에요</p>
          <button onClick={() => router.back()} className="mt-6 px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold">돌아가기</button>
        </div>
      )}

      {/* 공유 링크 → 비공개 기억 차단 */}
      {memory && isSharedPrivate && (
        <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-6 text-center">
          <span className="text-4xl mb-4">🔒</span>
          <p className="text-base font-bold text-gray-900">이 기억은 비공개예요</p>
          <p className="text-xs text-gray-400 mt-1">작성자만 볼 수 있는 기억이에요</p>
          <button onClick={() => addToast('info', 'CELEBUS 홈으로 이동')} className="mt-6 px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold">CELEBUS 홈으로</button>
        </div>
      )}

      {memory && !isSharedPrivate && (
        <>
          {/* Fix 8: 비로그인 공유 링크 — CELEBUS 로고 헤더, 로그인 유저 — 뒤로가기 헤더 */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-top">
            <div className="flex items-center h-12 px-4">
              {isSharedGuest ? (
                /* Fix 8: 비로그인 공유 링크 접속 시 로고 표시 (뒤로가기 버튼 없음) */
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-base font-bold text-violet-600 tracking-wider">CELEBUS</span>
                </div>
              ) : (
                <>
                  <button onClick={() => router.back()} className="mr-3 -ml-1 p-2" aria-label="뒤로가기">
                    <ChevronLeftIcon className="w-5 h-5 text-gray-900" />
                  </button>
                  <h1 className="text-base font-semibold text-gray-900 flex-1">{memory.date}</h1>
                  {/* Fix 8: 비로그인 공유 링크에서는 ⋯ 메뉴 없음 */}
                  <button onClick={() => setShowMenu(true)} className="p-1">
                    <span className="text-gray-600 text-lg">⋯</span>
                  </button>
                </>
              )}
            </div>
          </header>

          <div className="px-4 py-5 space-y-4">
            {/* 1. 감정 이모지 */}
            <div className="flex gap-3 justify-center">
              {memory.emojis.map((emoji, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-3xl">{emoji}</span>
                  <span className="text-[10px] text-gray-500">{memory.emojiLabels[i]}</span>
                </div>
              ))}
            </div>

            {/* 2. 유형 뱃지 */}
            <div className="flex justify-center">
              <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
                {memory.typeIcon} {memory.typeLabel}
              </span>
            </div>

            {/* 3. 미디어 갤러리 */}
            {memory.images > 0 && (
              <div>
                <div
                  ref={galleryRef}
                  className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory"
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const itemWidth = el.scrollWidth / memory.images;
                    const idx = Math.round(el.scrollLeft / itemWidth);
                    setGalleryScrollIdx(idx);
                  }}
                >
                  {Array.from({ length: memory.images }).map((_, i) => (
                    <button key={i} onClick={() => setFullscreenImg(i)}
                      className="w-56 h-40 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 active:scale-[0.98] transition-transform snap-start">
                      <span className="text-3xl">📷</span>
                    </button>
                  ))}
                </div>
                {memory.images > 1 && (
                  <div className="flex justify-center gap-1 mt-1">
                    {Array.from({ length: memory.images }).map((_, i) => (
                      <div key={i} className={cn('w-1.5 h-1.5 rounded-full transition-colors', i === galleryScrollIdx ? 'bg-violet-500' : 'bg-gray-300')} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. 텍스트 본문 */}
            {memory.text && (
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{memory.text}</p>
            )}

            {/* 5. 위치 */}
            {memory.location && (
              <p className="text-xs text-gray-500">📍 {memory.location}</p>
            )}

            {/* 6. 공개/비공개 */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {memory.isPublic ? '🌐 공개' : '🔒 비공개'}
              </span>
              {!memory.isMine && (
                <span className="text-[10px] font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                  다른 팬의 기억
                </span>
              )}
            </div>

            {/* 7. 작성/수정 시각 */}
            {/* Fix #30: updatedAt > createdAt 이면 "수정됨" 뱃지 표시 */}
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-gray-400">{memory.createdAt}</p>
              {memory.updatedAt && (
                <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  수정됨
                </span>
              )}
            </div>
            {memory.updatedAt && (
              <p className="text-[10px] text-gray-400">{memory.updatedAt}</p>
            )}

            {/* 공유 버튼 (공개 기억만) */}
            {/* Fix #32: TODO — 공유 링크 OG 메타는 서버사이드 렌더링 필요 */}
            {/* TODO: Server-side OG meta tags needed for share links (og:title, og:image, og:description) */}
            {memory.isPublic && (
              <button onClick={() => addToast('success', '링크가 복사되었어요!')}
                className="w-full py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 flex items-center justify-center gap-2 active:bg-gray-200 transition-colors">
                <span>🔗</span> 공유하기
              </button>
            )}
          </div>

          {/* Fix 8: 비로그인 공유 링크 접속 — 가입 유도 하단 고정 배너 */}
          {isSharedGuest && (
            <div className="fixed bottom-0 left-0 right-0 bg-violet-600 text-white px-4 py-4 safe-bottom z-40">
              <p className="text-sm font-semibold text-center">CELEBUS에서 더 많은 기억을 만나보세요</p>
              <button onClick={() => router.push('/')}
                className="w-full mt-2 py-3 bg-white text-violet-600 rounded-xl text-sm font-bold active:bg-violet-50">
                시작하기
              </button>
            </div>
          )}

          {/* ⋯ 메뉴 바텀시트 */}
          {showMenu && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowMenu(false)}>
              <div className="bg-white rounded-t-2xl w-full max-w-lg p-4 pb-8 safe-bottom" role="dialog" aria-modal="true" aria-label="기억 메뉴" onClick={(e) => e.stopPropagation()}>
                {memory.isMine ? (
                  <div className="space-y-1">
                    <button onClick={() => { setShowMenu(false); router.push('/memory-create'); }}
                      className="w-full py-3 text-sm font-semibold text-gray-900 text-center rounded-xl hover:bg-gray-50">수정하기</button>
                    <button onClick={() => { setShowMenu(false); setShowDeleteModal(true); }}
                      className="w-full py-3 text-sm font-semibold text-red-500 text-center rounded-xl hover:bg-red-50">삭제하기</button>
                  </div>
                ) : (
                  <button onClick={() => { setShowMenu(false); setShowReportSheet(true); }}
                    className="w-full py-3 text-sm font-semibold text-red-500 text-center rounded-xl hover:bg-red-50">신고하기</button>
                )}
                <button onClick={() => setShowMenu(false)}
                  className="w-full py-3 mt-2 text-sm font-semibold text-gray-500 text-center rounded-xl bg-gray-100">취소</button>
              </div>
            </div>
          )}

          {/* 삭제 확인 모달 */}
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDeleteModal(false)}>
              <div className="bg-white rounded-2xl w-72 p-5 text-center shadow-xl" role="dialog" aria-modal="true" aria-label="기억 삭제 확인" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm font-bold text-gray-900">삭제한 기억은 복구할 수 없어요.</p>
                <p className="text-xs text-gray-400 mt-1">삭제할까요?</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-sm font-semibold text-gray-600">취소</button>
                  <button onClick={handleDelete}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-semibold text-white">삭제</button>
                </div>
              </div>
            </div>
          )}

          {/* 신고 사유 바텀시트 */}
          {showReportSheet && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowReportSheet(false)}>
              <div className="bg-white rounded-t-2xl w-full max-w-lg p-4 pb-8 safe-bottom" role="dialog" aria-modal="true" aria-label="신고 사유 선택" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm font-bold text-gray-900 text-center mb-3">신고 사유를 선택해주세요</p>
                {['부적절한 콘텐츠', '스팸', '욕설·혐오', '개인정보 노출', '기타'].map((reason) => (
                  <button key={reason} onClick={() => handleReport(reason)}
                    className="w-full py-3 text-sm text-gray-700 text-center rounded-xl hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    {reason}
                  </button>
                ))}
                <button onClick={() => setShowReportSheet(false)}
                  className="w-full py-3 mt-2 text-sm font-semibold text-gray-500 text-center rounded-xl bg-gray-100">취소</button>
              </div>
            </div>
          )}

          {/* 풀스크린 이미지 뷰어 */}
          {fullscreenImg !== null && (
            <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" role="dialog" aria-modal="true" aria-label="사진 전체화면">
              <button onClick={() => setFullscreenImg(null)} className="absolute top-4 right-4 text-white text-2xl z-10">✕</button>
              {/* Fix 9: 핀치 줌 — touch-action: pinch-zoom 적용
                  Full pinch-to-zoom with gesture tracking requires a library (e.g. react-use-gesture).
                  For now, CSS touch-action enables native browser pinch zoom on mobile. */}
              <div
                className="text-center"
                style={{ touchAction: 'pinch-zoom' }}
              >
                <span className="text-6xl">📷</span>
                <p className="text-white/60 text-sm mt-4">{fullscreenImg + 1} / {memory.images}</p>
              </div>
              {fullscreenImg > 0 && (
                <button onClick={() => setFullscreenImg((p) => (p ?? 1) - 1)} className="absolute left-4 text-white text-3xl">‹</button>
              )}
              {fullscreenImg < memory.images - 1 && (
                <button onClick={() => setFullscreenImg((p) => (p ?? 0) + 1)} className="absolute right-4 text-white text-3xl">›</button>
              )}
            </div>
          )}
        </>
      )}

      <PresetSelector presets={MEMORY_DETAIL_PRESET_OPTIONS} current={presetKey} onSelect={handlePreset} />
    </div>
  );
}
