'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

type PresetKey = 'photo' | 'letter' | 'memo' | 'public-other' | 'shared-guest' | 'shared-private';

interface MemoryDetail {
  emojis: string[];
  emojiLabels: string[];
  type: 'photo' | 'letter' | 'memo';
  typeLabel: string;
  typeIcon: string;
  date: string;
  images: number;
  text: string;
  location?: string;
  isPublic: boolean;
  isMine: boolean;
  createdAt: string;
}

const PRESETS: Record<PresetKey, MemoryDetail> = {
  photo: {
    emojis: ['😍', '🤩'], emojiLabels: ['설렘', '어마'],
    type: 'photo', typeLabel: '사진 기록', typeIcon: '📸',
    date: '2026.04.14', images: 3,    text: 'V01D 콘서트 다녀왔다! 무대 위의 V01D는 정말 빛나고 있었어. 앵콜에서 우리 쪽을 봐줬을 때 심장이 멈추는 줄 알았다 💜 다음에 또 꼭 가고 싶다!',
    location: '잠실 올림픽홀', isPublic: false, isMine: true,
    createdAt: '2026.04.14 23:30 작성',
  },
  letter: {
    emojis: ['💜'], emojiLabels: ['사랑'],
    type: 'letter', typeLabel: '편지', typeIcon: '✉️',
    date: '2026.04.07', images: 0,    text: '사랑하는 V01D에게,\n\n오늘도 너희 음악을 들으며 하루를 보냈어. 힘든 날이었는데 너희 노래가 위로가 됐어. 항상 곁에 있어줘서 고마워.\n\n너희의 팬이',
    isPublic: true, isMine: true,
    createdAt: '2026.04.07 21:15 작성',
  },
  memo: {
    emojis: ['✨', '🎉', '😭'], emojiLabels: ['행복', '신남', '감동'],
    type: 'memo', typeLabel: '메모', typeIcon: '📝',
    date: '2026.04.03', images: 0,    text: '오늘 V01D 노래 들으며 산책했다. 봄바람이 불어서 기분이 너무 좋았어. 이런 평범한 순간이 행복하다.',
    isPublic: false, isMine: true,
    createdAt: '2026.04.03 18:42 작성',
  },
  'public-other': {
    emojis: ['🎉', '😍'], emojiLabels: ['신남', '설렘'],
    type: 'photo', typeLabel: '사진 기록', typeIcon: '📸',
    date: '2026.04.10', images: 3,    text: 'V01D 음방 1위 축하! 🎉 정말 감격스러웠어요. 팬들 다 같이 울었다 ㅠㅠ',
    location: '상암 MBC', isPublic: true, isMine: false,
    createdAt: '2026.04.10 20:00 작성',
  },
  'shared-guest': {
    emojis: ['🎉', '😍'], emojiLabels: ['신남', '설렘'],
    type: 'photo', typeLabel: '사진 기록', typeIcon: '📸',
    date: '2026.04.10', images: 3,    text: 'V01D 음방 1위 축하! 🎉 정말 감격스러웠어요. 팬들 다 같이 울었다 ㅠㅠ',
    location: '상암 MBC', isPublic: true, isMine: false,
    createdAt: '2026.04.10 20:00 작성',
  },
  'shared-private': {
    emojis: ['💜'], emojiLabels: ['사랑'],
    type: 'memo', typeLabel: '메모', typeIcon: '📝',
    date: '2026.04.03', images: 0,    text: '',
    isPublic: false, isMine: false,
    createdAt: '',
  },
};

export default function MemoryDetailPage() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);

  const preset: PresetKey = 'photo';
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [fullscreenImg, setFullscreenImg] = useState<number | null>(null);

  const memory = PRESETS[preset];
  const isSharedGuest = false;
  const isSharedPrivate = false;

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
    <div className="min-h-dvh bg-white pb-8">

      {/* 공유 링크 → 비공개 기억 차단 */}
      {isSharedPrivate && (
        <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-6 text-center">
          <span className="text-4xl mb-4">🔒</span>
          <p className="text-base font-bold text-gray-900">이 기억은 비공개예요</p>
          <p className="text-xs text-gray-400 mt-1">작성자만 볼 수 있는 기억이에요</p>
          <button onClick={() => addToast('info', 'CELEBUS 홈으로 이동')} className="mt-6 px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold">CELEBUS 홈으로</button>
        </div>
      )}

      {!isSharedPrivate && (
        <>
          {/* 헤더 */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-top">
            <div className="flex items-center h-12 px-4">
              <button onClick={() => router.back()} className="mr-3 -ml-1 p-1">
                <span className="text-gray-900">←</span>
              </button>
              <h1 className="text-base font-semibold text-gray-900 flex-1">{memory.date}</h1>
              {!isSharedGuest && (
                <button onClick={() => setShowMenu(true)} className="p-1">
                  <span className="text-gray-600 text-lg">⋯</span>
                </button>
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
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {Array.from({ length: memory.images }).map((_, i) => (
                    <button key={i} onClick={() => setFullscreenImg(i)}
                      className="w-56 h-40 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 active:scale-[0.98] transition-transform">
                      <span className="text-3xl">📷</span>
                    </button>
                  ))}
                </div>
                {memory.images > 1 && (
                  <div className="flex justify-center gap-1 mt-1">
                    {Array.from({ length: memory.images }).map((_, i) => (
                      <div key={i} className={cn('w-1.5 h-1.5 rounded-full', i === 0 ? 'bg-violet-500' : 'bg-gray-300')} />
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

            {/* 7. 작성 시각 */}
            <p className="text-[10px] text-gray-400">{memory.createdAt}</p>

            {/* 공유 버튼 (공개 기억만) */}
            {memory.isPublic && (
              <button onClick={() => addToast('success', '링크가 복사되었어요!')}
                className="w-full py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 flex items-center justify-center gap-2 active:bg-gray-200 transition-colors">
                <span>🔗</span> 공유하기
              </button>
            )}
          </div>

          {/* 비로그인 공유 링크 접속 — 가입 유도 배너 */}
          {isSharedGuest && (
            <div className="fixed bottom-0 left-0 right-0 bg-violet-600 text-white px-4 py-4 safe-bottom z-40">
              <p className="text-sm font-semibold text-center">CELEBUS에서 나만의 기억을 남겨보세요 💜</p>
              <button onClick={() => addToast('info', 'CELEBUS 홈으로 이동')}
                className="w-full mt-2 py-3 bg-white text-violet-600 rounded-xl text-sm font-bold active:bg-violet-50">
                시작하기
              </button>
            </div>
          )}

          {/* ⋯ 메뉴 바텀시트 */}
          {showMenu && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowMenu(false)}>
              <div className="bg-white rounded-t-2xl w-full max-w-lg p-4 pb-8 safe-bottom" onClick={(e) => e.stopPropagation()}>
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
              <div className="bg-white rounded-2xl w-72 p-5 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
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
              <div className="bg-white rounded-t-2xl w-full max-w-lg p-4 pb-8 safe-bottom" onClick={(e) => e.stopPropagation()}>
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
            <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
              <button onClick={() => setFullscreenImg(null)} className="absolute top-4 right-4 text-white text-2xl z-10">✕</button>
              <div className="text-center">
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
    </div>
  );
}
