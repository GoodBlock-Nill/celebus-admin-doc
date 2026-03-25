'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { useFQStore } from '@/stores/useFQStore';
import { useUIStore } from '@/stores/useUIStore';
import { formatDateTime } from '@/lib/utils';

import type { QuestSubmission } from '@/lib/fq-types';

interface PendingTabProps {
  questId: string;
}

export default function PendingTab({ questId }: PendingTabProps) {
  const submissions = useFQStore((s) => s.getSubmissionsByQuest(questId));
  const rejectionReasons = useFQStore((s) => s.rejectionReasons.filter((r) => r.isActive));
  const { approveSubmission, rejectSubmission, approveAllPending } = useFQStore();
  const { addToast } = useUIStore();

  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const pendingSubmissions = submissions.filter((s) => s.status === 'Pending');

  const handleApprove = (id: string) => {
    approveSubmission(id);
    addToast('success', '제출물이 승인되었습니다.');
  };

  const handleRejectConfirm = () => {
    if (!rejectTarget || !selectedReason) return;
    rejectSubmission(rejectTarget, selectedReason);
    addToast('success', '제출물이 반려되었습니다.');
    setRejectTarget(null);
    setSelectedReason('');
  };

  const handleApproveAll = () => {
    approveAllPending(questId);
    addToast('success', `${pendingSubmissions.length}건의 제출물이 모두 승인되었습니다.`);
  };

  if (pendingSubmissions.length === 0) {
    return <EmptyState message="대기 중인 제출물이 없습니다." />;
  }

  return (
    <div>
      {/* Top action bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          총 <span className="font-semibold text-gray-900">{pendingSubmissions.length}</span>건 대기 중
        </p>
        <button
          onClick={handleApproveAll}
          className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          현재 페이지 모두 승인
        </button>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {pendingSubmissions.map((sub) => (
          <SubmissionCard
            key={sub.id}
            submission={sub}
            onApprove={() => handleApprove(sub.id)}
            onReject={() => {
              setRejectTarget(sub.id);
              setSelectedReason('');
            }}
            onImageClick={() => setPreviewImage(sub.imageUrl)}
          />
        ))}
      </div>

      {/* Rejection Modal */}
      <Modal
        isOpen={rejectTarget !== null}
        onClose={() => {
          setRejectTarget(null);
          setSelectedReason('');
        }}
        title="반려사유 선택"
        footer={
          <>
            <button
              onClick={() => {
                setRejectTarget(null);
                setSelectedReason('');
              }}
              className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleRejectConfirm}
              disabled={!selectedReason}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              반려 확인
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">반려 사유를 선택해 주세요</label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">선택해 주세요</option>
            {rejectionReasons.map((r) => (
              <option key={r.id} value={r.id}>{r.adminLabel}</option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        isOpen={previewImage !== null}
        onClose={() => setPreviewImage(null)}
        title="제출 이미지"
        width="max-w-2xl"
      >
        <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl block mb-3">🖼️</span>
            <p className="text-sm text-gray-400">{previewImage}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SubmissionCard({
  submission,
  onApprove,
  onReject,
  onImageClick,
}: {
  submission: QuestSubmission;
  onApprove: () => void;
  onReject: () => void;
  onImageClick: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Image area */}
      <button
        onClick={onImageClick}
        className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group cursor-pointer"
      >
        <span className="text-4xl">🖼️</span>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
          </svg>
        </div>
      </button>

      {/* Info area */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">{submission.nickname}</span>
          <span className="text-xs text-gray-400">ID: {submission.userId}</span>
        </div>
        <div className="text-xs text-gray-500 space-y-0.5">
          <p>제출ID: {submission.id}</p>
          <p>{formatDateTime(submission.submittedAt)}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={onReject}
            className="flex-1 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            반려
          </button>
          <button
            onClick={onApprove}
            className="flex-1 px-3 py-1.5 text-sm font-medium text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
          >
            승인
          </button>
        </div>
      </div>
    </div>
  );
}
