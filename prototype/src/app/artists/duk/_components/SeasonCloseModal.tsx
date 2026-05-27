'use client';

import type { DukSeason } from '@/mock/duk';

// [CEB-BO-ART-401] v1.6 §2-1-E §E-1 — 시즌 종료 확인 모달
// SeasonTab에 인라인으로 있던 모달을 별도 컴포넌트로 추출 (시즌 상세에서도 재활용)

interface Props {
  target: DukSeason | null;
  onClose: () => void;
  onConfirm: (target: DukSeason) => void;
}

export default function SeasonCloseModal({ target, onClose, onConfirm }: Props) {
  if (!target) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b">
          <h3 className="text-base font-semibold text-gray-900">시즌을 종료하시겠습니까?</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-700">
            {target.artistGroupName} - {target.name} 시즌을 종료합니다. 종료 후 본 시즌의 랭킹은 확정 보존되며 신규 적립/소비는 다음 시즌에 귀속됩니다.
          </p>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(target)}
            className="h-10 px-5 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700"
          >
            종료하기
          </button>
        </div>
      </div>
    </div>
  );
}
