'use client';

import { useRouter } from 'next/navigation';
import { formatGP } from '@/lib/utils';

interface NoBalanceModalProps {
  requiredGP: number;
  currentGP: number;
  gameId?: string;
  onClose: () => void;
}

export default function NoBalanceModal({
  requiredGP,
  currentGP,
  gameId,
  onClose,
}: NoBalanceModalProps) {
  const router = useRouter();

  const handleGoExchange = () => {
    onClose();
    const url = gameId ? `/exchange?returnTo=game&gameId=${gameId}` : '/exchange';
    router.push(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-gray-900 rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="text-4xl mb-4">💸</div>
          <h2 className="text-white font-bold text-lg mb-2">GP가 부족해요</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-4">
            예측에 참여하려면 {formatGP(requiredGP)}가 필요해요.
            <br />
            GP를 충전한 뒤 다시 시도해 주세요.
          </p>
          <p className="text-red-400 font-semibold text-sm">
            보유 GP: {formatGP(currentGP)}
          </p>
        </div>

        <div className="h-px bg-gray-800" />

        <div className="flex">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-gray-400 font-semibold text-sm active:bg-gray-800 transition-colors"
          >
            취소
          </button>
          <div className="w-px bg-gray-800" />
          <button
            onClick={handleGoExchange}
            className="flex-1 py-4 font-semibold text-sm active:opacity-70 transition-opacity"
            style={{ color: '#8B5CF6' }}
          >
            GP 가져오기
          </button>
        </div>
      </div>
    </div>
  );
}
