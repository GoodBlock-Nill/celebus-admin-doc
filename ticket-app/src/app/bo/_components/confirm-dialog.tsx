'use client';

import type { ReactNode } from 'react';
import { Button } from './form';
import type { ButtonVariant } from './form';

export interface ConfirmRequest {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  confirmVariant?: ButtonVariant;
  onConfirm: () => void;
}

/** 되돌릴 수 없는 처리 앞에 띄우는 확인 모달 */
export function ConfirmDialog({
  request,
  onClose,
}: {
  request: ConfirmRequest | null;
  onClose: () => void;
}) {
  if (!request) return null;

  const handleConfirm = () => {
    request.onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[rgba(27,29,34,0.45)] p-4">
      <div className="w-full max-w-[420px] rounded-xl border border-[#E3E5EA] bg-white p-5 shadow-[0_18px_48px_rgba(27,29,34,0.24)]">
        <h3 className="text-[16px] font-bold text-[#1B1D22]">{request.title}</h3>
        <div className="mt-2.5 text-[13px] leading-relaxed text-[#4A4E5A]">{request.message}</div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button variant={request.confirmVariant ?? 'primary'} onClick={handleConfirm}>
            {request.confirmLabel ?? '확인'}
          </Button>
        </div>
      </div>
    </div>
  );
}
