'use client';

import BottomSheet from './BottomSheet';
import { formatNumber } from '@/lib/utils';
import type { ExchangeDirection } from '@/lib/types';

interface ExchangeConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  direction: ExchangeDirection;
  gpAmount: number;
  celbAmount: number;
}

export default function ExchangeConfirm({
  isOpen,
  onClose,
  onConfirm,
  direction,
  gpAmount,
  celbAmount,
}: ExchangeConfirmProps) {
  const isCharge = direction === 'CHARGE';
  const title = isCharge ? '가져오기 전 확인' : '보내기 전 확인';

  const notes = isCharge
    ? [
        'Celeb을 Game Point로 바꾸는 교환이에요.',
        '교환 완료 후에는 취소할 수 없어요.',
        '네트워크 상황에 따라 반영까지 시간이 소요될 수 있어요.',
      ]
    : [
        'Game Point를 Celeb으로 바꾸는 교환이에요.',
        '교환 완료 후에는 취소할 수 없습니다.',
        '네트워크 상황에 따라 반영까지 시간이 소요될 수 있습니다.',
      ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      <div className="px-5 py-4 space-y-5">
        {/* 금액 카드 */}
        <div className="bg-blue-50 rounded-2xl px-5 py-4 text-center space-y-1">
          <p className="text-xs text-gray-500">
            {isCharge ? '가져올 Game Point' : '보낼 Game Point'}
          </p>
          <p className="text-2xl font-bold text-blue-600">
            {formatNumber(gpAmount)} GP
          </p>
          <p className="text-xs text-gray-400">
            {isCharge
              ? `${formatNumber(celbAmount)} CELB 사용`
              : `${formatNumber(celbAmount)} CELB 수신`}
          </p>
        </div>

        {/* 안내 */}
        <div className="space-y-2">
          {notes.map((note, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-gray-400 text-xs mt-0.5 shrink-0">{i + 1}.</span>
              <p className="text-xs text-gray-600">{note}</p>
            </div>
          ))}
        </div>

        {/* 버튼 */}
        <div className="grid grid-cols-2 gap-3 pb-2">
          <button
            onClick={onClose}
            className="h-12 rounded-2xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="h-12 rounded-2xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            계속하기
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
