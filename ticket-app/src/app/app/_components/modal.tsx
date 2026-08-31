'use client';

import { GHOST_BUTTON, MUTED, PRIMARY_BUTTON } from './ui';

interface AppModalProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  onClose: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

/** 하단 시트 형태의 공통 모달 */
export function AppModal({ open, title, description, onClose, children, footer }: AppModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-[#191F2866]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[420px] rounded-t-3xl bg-white px-5 pb-7 pt-6 shadow-[0_-2px_16px_rgba(25,31,40,0.12)]"
      >
        <h2 className="text-[17px] font-bold text-[#191F28]">{title}</h2>
        {description ? (
          <div className={`mt-2 text-[14px] leading-[1.65] ${MUTED}`}>{description}</div>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        {footer ? <div className="mt-5 flex flex-col gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

/** 실행 확인 모달 */
export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = '닫기',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <AppModal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onConfirm} className={PRIMARY_BUTTON}>
            {confirmLabel}
          </button>
          <button type="button" onClick={onClose} className={GHOST_BUTTON}>
            {cancelLabel}
          </button>
        </>
      }
    />
  );
}
