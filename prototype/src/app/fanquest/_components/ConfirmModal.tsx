'use client';

interface ConfirmModalProps {
  title: string;
  message: string;
  /** message 아래에 노출할 부가 영역 (사용처 리스트 등) */
  extra?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger=true 시 confirm 버튼이 red 톤 */
  danger?: boolean;
  /** 단일 액션 모드 (정보 안내) — 취소 버튼 미표시, 외부 클릭으로 닫히지 않음 */
  singleAction?: boolean;
  /** 모달 본문 최대 너비 */
  size?: 'sm' | 'md';
  onCancel?: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  title,
  message,
  extra,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger,
  singleAction,
  size = 'sm',
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const widthClass = size === 'md' ? 'max-w-md' : 'max-w-sm';
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={(e) => { if (!singleAction && e.target === e.currentTarget && onCancel) onCancel(); }}
    >
      <div className={`bg-white rounded-2xl shadow-xl w-full ${widthClass} mx-4 overflow-hidden`}>
        <div className="px-6 py-5">
          <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">{message}</p>
          {extra}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          {!singleAction && onCancel && (
            <button onClick={onCancel} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`h-10 px-5 text-sm font-semibold text-white rounded-lg ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
