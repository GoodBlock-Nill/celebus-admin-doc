'use client';

import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

// [CEB-BO-BIVE-202-MD-DELETE] BIVE 삭제 모달
// 초안(Draft) + 민팅 0건일 때만 호출됨 (상위 페이지에서 게이팅)

export default function DeleteBiveModal({
  isOpen,
  biveName,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  biveName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">BIVE 삭제</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <XMarkIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="px-6 pb-6 space-y-4">
          <div className="flex gap-3 p-4 bg-red-50 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">
              <span className="font-semibold">{biveName}</span>을(를) 삭제하시겠습니까?
              <br />
              삭제 후에는 복구할 수 없습니다.
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className="h-10 px-5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
