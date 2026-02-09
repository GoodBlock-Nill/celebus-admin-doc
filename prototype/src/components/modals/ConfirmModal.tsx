'use client';

import Modal from '@/components/ui/Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  warning?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
}

export default function ConfirmModal({
  isOpen, onClose, onConfirm, title, message, warning,
  confirmText = '확인', cancelText = '취소', confirmVariant = 'primary',
}: ConfirmModalProps) {
  const btnClass = confirmVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm font-medium rounded-lg ${btnClass}`}>
            {confirmText}
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-600">{message}</p>
      {warning && (
        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700">{warning}</p>
        </div>
      )}
    </Modal>
  );
}
