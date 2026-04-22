'use client';

import { useEffect } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmVariant?: 'primary' | 'danger';
  disabled?: boolean;
}

export default function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
  confirmVariant = 'primary',
  disabled,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/40 animate-fadeIn" />
      <div
        className="relative z-10 w-full max-w-[340px] bg-white rounded-2xl px-6 py-6 animate-scaleIn"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h3 className="text-base font-bold text-gray-900 mb-3">{title}</h3>
        {children}
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 ${confirmVariant === 'danger' ? 'bg-red-500' : 'bg-violet-600'}`}
          >
            {disabled ? '처리중...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
