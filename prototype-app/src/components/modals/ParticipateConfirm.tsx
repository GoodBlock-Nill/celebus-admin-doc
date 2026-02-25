'use client';

import { formatGP, formatNumber } from '@/lib/utils';

interface ParticipateConfirmProps {
  choice: 'YES' | 'NO';
  participationCost: number;
  gpBalance: number;
  gameTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ParticipateConfirm({
  choice,
  participationCost,
  gpBalance,
  gameTitle,
  onConfirm,
  onCancel,
}: ParticipateConfirmProps) {
  const hasEnoughGP = gpBalance >= participationCost;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onCancel}>
      <div
        className="w-full max-w-[430px] bg-gray-900 rounded-t-3xl px-6 pt-6 pb-8 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-6" />

        <h2 className="text-white font-bold text-lg text-center mb-1">예측 참여를 확정할까요?</h2>
        <p className="text-gray-400 text-sm text-center mb-6 line-clamp-2">{gameTitle}</p>

        <div className="bg-gray-800 rounded-2xl p-4 space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">내 선택</span>
            <span
              className={`font-bold text-lg ${choice === 'YES' ? 'text-blue-400' : 'text-red-400'}`}
            >
              {choice}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">사용 GP</span>
            <span className="text-white font-semibold">{formatGP(participationCost)}</span>
          </div>
          <div className="h-px bg-gray-700" />
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">보유 GP</span>
            <span className={`font-semibold ${hasEnoughGP ? 'text-white' : 'text-red-400'}`}>
              {formatGP(gpBalance)}
            </span>
          </div>
        </div>

        <p className="text-gray-500 text-xs text-center mb-6">
          예측에 참여하면, 선택은 변경할 수 없어요.
          <br />
          결과에 따라 GP를 획득하거나 소모해요.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl border border-gray-700 text-gray-300 font-semibold text-sm active:opacity-70"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-12 rounded-xl font-semibold text-sm text-white active:opacity-70 ${
              choice === 'YES'
                ? 'bg-blue-600 active:bg-blue-700'
                : 'bg-red-600 active:bg-red-700'
            }`}
          >
            {choice}로 참여하기
          </button>
        </div>
      </div>
    </div>
  );
}
