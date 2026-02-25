'use client';

import { useRouter } from 'next/navigation';

interface LeaveModalProps {
  onClose: () => void;
  isSpectateMode?: boolean;
}

export default function LeaveModal({ onClose, isSpectateMode = false }: LeaveModalProps) {
  const router = useRouter();

  function handleLeave() {
    router.push('/home');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dim overlay - dismissible by tapping outside */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-80 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
        {/* Body */}
        <div className="px-6 pt-8 pb-6 text-center">
          <h2 className="text-xl font-bold text-white mb-3">
            게임을 나가시겠어요?
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            이번 회차의 결과를 포기하고,
            <br />
            즉시 종료됩니다.
            <br />
            <span className="text-gray-500">(참여 GP는 환불되지 않습니다)</span>
          </p>
          {isSpectateMode && (
            <p className="text-orange-400 text-sm mt-2">
              관전 보상 하트도 받을 수 없습니다
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-600" />

        {/* Buttons */}
        <div className="flex">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-gray-400 text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            취소
          </button>
          <div className="w-px bg-gray-600" />
          <button
            onClick={handleLeave}
            className="flex-1 py-4 text-red-400 text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            나가기
          </button>
        </div>
      </div>
    </div>
  );
}
