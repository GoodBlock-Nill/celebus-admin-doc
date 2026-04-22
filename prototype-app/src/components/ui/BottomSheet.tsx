'use client';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 animate-fadeIn" />
      <div
        className="relative z-10 w-full max-w-[430px] mx-auto bg-white rounded-t-2xl px-5 py-6 animate-slideInUp"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? '바텀시트'}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        {title && <h3 className="text-base font-bold text-gray-900 mb-4">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
