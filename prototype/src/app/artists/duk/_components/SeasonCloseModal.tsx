'use client';

import type { DukSeason } from '@/mock/duk';

// [CEB-BO-ART-401] v1.7 §2-1-D — 시즌 강제 종료 확인 모달
// v1.7: 강제 종료(취소·미지급)로 문구 전면 교체. 정책 3행 + 경고.
// - 버튼 [강제 종료], 보상 미지급, 랭킹 스냅샷 보존, 다음 시즌 귀속 명시

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
          <h3 className="text-base font-semibold text-gray-900">시즌을 강제 종료하시겠습니까?</h3>
        </div>
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-gray-800">
            <span className="font-semibold">{target.artistGroupName} - {target.name.ko}</span> 시즌을 강제 종료합니다.
          </p>
          <ul className="space-y-1.5 text-sm text-gray-600 list-disc pl-5">
            <li>보상은 지급되지 않습니다 (강제 종료·취소). 정상 보상은 종료일 자동 정산으로만 지급됩니다.</li>
            <li>종료 시점까지의 랭킹은 스냅샷으로 보존·조회 가능합니다.</li>
            <li>신규 적립·소비는 다음 시즌에 귀속됩니다.</li>
          </ul>
          <p className="text-sm font-medium text-rose-600">
            이 작업은 되돌릴 수 없습니다.
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
            강제 종료
          </button>
        </div>
      </div>
    </div>
  );
}
