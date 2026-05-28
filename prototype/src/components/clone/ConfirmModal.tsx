'use client';

import { useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  lines: string[];
  confirmLabel?: string;
  cancelLabel?: string;
}

// 운영 BO 확인 모달 — 제목 + 본문 2줄 + [다시 돌아가기]/[확인]
export default function ConfirmModal({ isOpen, onClose, onConfirm, title, lines, confirmLabel = '확인', cancelLabel = '다시 돌아가기' }: Props) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 pt-7 pb-5 text-center">
          <h3 className="text-base font-semibold text-gray-900 mb-3">{title}</h3>
          {lines.map((l, i) => (
            <p key={i} className="text-sm text-gray-500 leading-relaxed">{l}</p>
          ))}
        </div>
        <div className="flex items-center gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 h-11 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="flex-1 h-11 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
