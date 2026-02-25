'use client';

import { useEffect, useState } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'default',
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const confirmButtonClass =
    variant === 'danger'
      ? 'flex-1 py-3 bg-red-500 text-white text-sm font-semibold rounded-xl active:opacity-80 transition-opacity'
      : 'flex-1 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl active:opacity-80 transition-opacity';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 max-w-[430px] mx-auto">
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-200 ${
          visible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`relative w-full bg-white rounded-2xl shadow-xl p-6 transition-all duration-200 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <h2 className="text-base font-bold text-gray-900 text-center mb-2">{title}</h2>
        <p className="text-sm text-gray-600 text-center leading-relaxed mb-6">{message}</p>

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl active:opacity-80 transition-opacity"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={confirmButtonClass}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
