'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BIVE_PREVIEW_LIST } from '@/lib/data/bive';
import type { BivePreviewItem } from '@/lib/data/bive';

interface BivePreviewSheetProps {
  bive: BivePreviewItem | null;
  onClose: () => void;
}

export default function BivePreviewSheet({ bive, onClose }: BivePreviewSheetProps) {
  const router = useRouter();

  if (!bive) return null;

  const isOwned = BIVE_PREVIEW_LIST.indexOf(bive) === 0;

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
