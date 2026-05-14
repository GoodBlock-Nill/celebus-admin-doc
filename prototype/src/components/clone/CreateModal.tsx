'use client';

import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
  onSubmit?: () => void;
  submitLabel?: string;
  disabled?: boolean;
}

export default function CreateModal({ isOpen, onClose, title, children, width = 'max-w-2xl', onSubmit, submitLabel = '추가하기', disabled }: Props) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-white rounded-2xl shadow-xl w-full ${width} mx-4 max-h-[90vh] flex flex-col overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center" aria-label="닫기">
            <XMarkIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">{children}</div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            취소하기
          </button>
          <button
            onClick={onSubmit}
            disabled={disabled}
            className="h-10 px-5 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:bg-indigo-300"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
