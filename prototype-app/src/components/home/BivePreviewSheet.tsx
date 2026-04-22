'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface BiveItem {
  name: string;
  grade: string;
  emoji: string;
  howToGet: string;
}

const BIVE_LIST_FOR_INDEX: BiveItem[] = [
  { name: 'V01D 데뷔 포토', grade: 'Grade 1', emoji: '📸', howToGet: 'Quest 1장 완료 시 획득' },
  { name: 'V01D 콘서트 메모리', grade: 'Grade 2', emoji: '🎤', howToGet: 'Quest 2장 완료 시 획득' },
  { name: 'V01D 음방 1위', grade: 'Grade 3', emoji: '🏆', howToGet: 'Quest 3장 완료 시 획득' },
  { name: 'V01D 스페셜 에디션', grade: '스페셜', emoji: '✨', howToGet: 'Grade 1~5 전체 합성으로 획득' },
];

interface BivePreviewSheetProps {
  bive: BiveItem | null;
  onClose: () => void;
}

export default function BivePreviewSheet({ bive, onClose }: BivePreviewSheetProps) {
  const router = useRouter();

  if (!bive) return null;

  const isOwned = BIVE_LIST_FOR_INDEX.indexOf(bive) === 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl w-full max-w-lg p-5 pb-28 animate-slideInUp"
        role="dialog"
        aria-modal="true"
        aria-label="BIVE 미리보기"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
            <span className="text-5xl">{bive.emoji}</span>
          </div>
          <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full mb-2">{bive.grade}</span>
          <p className="text-base font-bold text-gray-900">{bive.name}</p>
          <p className="text-xs text-gray-500 mt-1">📋 {bive.howToGet}</p>
          <span className={cn(
            'mt-2 text-[10px] font-semibold px-2.5 py-1 rounded-full',
            isOwned ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'
          )}>
            {isOwned ? '✅ 보유 중' : '미보유'}
          </span>
        </div>
        <button
          onClick={() => {
            onClose();
            router.push('/collection');
          }}
          className="w-full mt-5 py-3 rounded-xl bg-violet-600 text-white text-sm font-bold active:bg-violet-700 transition-colors"
        >
          컬렉션에서 보기
        </button>
      </div>
    </div>
  );
}
