'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SubPageHeader from '@/components/layout/SubPageHeader';
import Toast from '@/components/ui/Toast';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

type DebugPreset = 'photo' | 'letter' | 'memo' | 'public-other';

interface MemoryDetail {
  emojis: string[];
  emojiLabels: string[];
  type: 'photo' | 'letter' | 'memo';
  typeLabel: string;
  typeIcon: string;
  date: string;
  images: number;
  hasVideo: boolean;
  text: string;
  location?: string;
  isPublic: boolean;
  isMine: boolean;
  createdAt: string;
}

const PRESETS: Record<DebugPreset, MemoryDetail> = {
  photo: {
    emojis: ['😍', '🤩'], emojiLabels: ['설렘', '어마'],
    type: 'photo', typeLabel: '사진 기록', typeIcon: '📸',
    date: '2026.04.14', images: 5, hasVideo: true,
    text: 'V01D 콘서트 다녀왔다! 무대 위의 V01D는 정말 빛나고 있었어. 앵콜에서 우리 쪽을 봐줬을 때 심장이 멈추는 줄 알았다 💜 다음에 또 꼭 가고 싶다!',
    location: '잠실 올림픽홀', isPublic: false, isMine: true,
    createdAt: '2026.04.14 23:30 작성',
  },
  letter: {
    emojis: ['💜'], emojiLabels: ['사랑'],
    type: 'letter', typeLabel: '편지', typeIcon: '✉️',
    date: '2026.04.07', images: 0, hasVideo: false,
    text: '사랑하는 V01D에게,\n\n오늘도 너희 음악을 들으며 하루를 보냈어. 힘든 날이었는데 너희 노래가 위로가 됐어. 항상 곁에 있어줘서 고마워.\n\n너희의 팬이',
    isPublic: true, isMine: true,
    createdAt: '2026.04.07 21:15 작성',
  },
  memo: {
    emojis: ['✨', '🎉', '😭'], emojiLabels: ['행복', '신남', '감동'],
    type: 'memo', typeLabel: '메모', typeIcon: '📝',
    date: '2026.04.03', images: 0, hasVideo: false,
    text: '오늘 V01D 노래 들으며 산책했다. 봄바람이 불어서 기분이 너무 좋았어. 이런 평범한 순간이 행복하다.',
    isPublic: false, isMine: true,
    createdAt: '2026.04.03 18:42 작성',
  },
  'public-other': {
    emojis: ['🎉', '😍'], emojiLabels: ['신남', '설렘'],
    type: 'photo', typeLabel: '사진 기록', typeIcon: '📸',
    date: '2026.04.10', images: 3, hasVideo: false,
    text: 'V01D 음방 1위 축하! 🎉 정말 감격스러웠어요. 팬들 다 같이 울었다 ㅠㅠ',
    location: '상암 MBC', isPublic: true, isMine: false,
    createdAt: '2026.04.10 20:00 작성',
  },
};

export default function MemoryDetailPage() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);

  const [preset, setPreset] = useState<DebugPreset>('photo');
  const [debugOpen, setDebugOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [fullscreenImg, setFullscreenImg] = useState<number | null>(null);

  const memory = PRESETS[preset];

  const handleDelete = () => {
    setShowDeleteModal(false);
    addToast('success', '기억이 삭제되었어요');
    setTimeout(() => router.back(), 500);
  };

  const handleReport = (reason: string) => {
    setShowReportSheet(false);
    addToast('success', '신고가 접수되었어요');
  };

  const switchPreset = (p: DebugPreset) => {
    setPreset(p);
    setDebugOpen(false);
    setShowMenu(false);
    setShowDeleteModal(false);
    setShowReportSheet(false);
    setFullscreenImg(null);
  };

  return (
    <div className="min-h-dvh bg-white pb-8">
      <Toast />

      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-top">
        <div className="flex items-center h-12 px-4">
          <button onClick={() => router.back()} className="mr-3 -ml-1 p-1">
            <span className="text-gray-900">←</span>
          </button>
          <h1 className="text-base font-semibold text-gray-900 flex-1">{memory.date}</h1>
          <button onClick={() => setShowMenu(true)} className="p-1">
            <span className="text-gray-600 text-lg">⋯</span>
          </button>
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
        {(memory.images > 0 || memory.hasVideo) && (
          <div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: memory.images }).map((_, i) => (
                <button key={i} onClick={() => setFullscreenImg(i)}
                  className="w-56 h-40 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 active:scale-[0.98] transition-transform">
                  <span className="text-3xl">📷</span>
                </button>
              ))}
              {memory.hasVideo && (
                <button onClick={() => addToast('info', '영상 재생 (시뮬레이션)')}
                  className="w-56 h-40 rounded-xl bg-gray-900 flex items-center justify-center shrink-0 relative">
                  <span className="text-4xl text-white">▶</span>
                  <span className="absolute bottom-2 right-2 text-[10px] text-white/70 bg-black/50 px-1.5 py-0.5 rounded">0:45</span>
                </button>
              )}
            </div>
            {memory.images > 1 && (
              <div className="flex justify-center gap-1 mt-1">
                {Array.from({ length: memory.images + (memory.hasVideo ? 1 : 0) }).map((_, i) => (
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
      </div>

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

      {/* 플로팅 디버그 */}
      <div className="fixed bottom-20 right-4 z-40">
        {debugOpen && (
          <div className="mb-2 flex flex-col gap-1.5 animate-slideInUp">
            {[
              { key: 'photo' as const, label: '사진 기억' },
              { key: 'letter' as const, label: '편지 기억' },
              { key: 'memo' as const, label: '메모 기억' },
              { key: 'public-other' as const, label: '타인 공개 기억' },
            ].map((p) => (
              <button key={p.key} onClick={() => switchPreset(p.key)}
                className={cn('px-3 py-2 rounded-xl shadow-md text-[10px] font-semibold whitespace-nowrap',
                  p.key === preset ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-700')}>
                {p.label}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setDebugOpen(!debugOpen)}
          className="px-3 py-2.5 rounded-full bg-gray-900 text-white shadow-lg flex items-center gap-1.5 active:scale-95 transition-transform">
          <span className="text-[10px] font-semibold">{preset === 'photo' ? '사진 기억' : preset === 'letter' ? '편지 기억' : preset === 'memo' ? '메모 기억' : '타인 공개 기억'}</span>
          <span className="text-[8px]">▲</span>
        </button>
      </div>
    </div>
  );
}
