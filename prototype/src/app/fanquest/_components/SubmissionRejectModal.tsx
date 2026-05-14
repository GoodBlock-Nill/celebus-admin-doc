'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getActiveRejectionReasons, type RejectionReason } from '@/mock/fanquest';

interface SubmissionRejectModalProps {
  submitId: number;
  onClose: () => void;
  onSubmit: (reason: RejectionReason) => void;
}

export default function SubmissionRejectModal({ submitId, onClose, onSubmit }: SubmissionRejectModalProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const reasons = getActiveRejectionReasons();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">반려 사유 선택</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <XMarkIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-2">
          <p className="text-xs text-gray-500 mb-3">Submit ID: {submitId}</p>
          {reasons.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">사용 가능한 반려사유가 없습니다.</p>
          ) : (
            reasons.map((r) => (
              <label
                key={r.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  selected === r.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="rejectReason"
                  checked={selected === r.id}
                  onChange={() => setSelected(r.id)}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-sm text-gray-900">{r.displayName}</span>
              </label>
            ))
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            취소
          </button>
          <button
            disabled={selected === null}
            onClick={() => {
              const found = reasons.find((r) => r.id === selected);
              if (found) onSubmit(found);
            }}
            className="h-10 px-5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
          >
            반려하기
          </button>
        </div>
      </div>
    </div>
  );
}
