'use client';

import { useState, useMemo } from 'react';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useFQStore } from '@/stores/useFQStore';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';

import type { QuestSubmission, SubmissionStatus } from '@/lib/fq-types';

interface HistoryTabProps {
  questId: string;
}

export default function HistoryTab({ questId }: HistoryTabProps) {
  const allSubmissions = useFQStore((s) => s.getSubmissionsByQuest(questId));
  const rejectionReasons = useFQStore((s) => s.rejectionReasons);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchField, setSearchField] = useState<string>('nickname');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Non-pending submissions only
  const processed = useMemo(() => {
    let filtered = allSubmissions.filter((s) => s.status !== 'Pending');

    if (statusFilter) {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => {
        if (searchField === 'nickname') return s.nickname.toLowerCase().includes(query);
        if (searchField === 'id') return s.id.toLowerCase().includes(query);
        return true;
      });
    }

    // Sort by processedAt desc
    filtered.sort((a, b) => {
      const dateA = a.processedAt ? new Date(a.processedAt).getTime() : 0;
      const dateB = b.processedAt ? new Date(b.processedAt).getTime() : 0;
      return dateB - dateA;
    });

    return filtered;
  }, [allSubmissions, statusFilter, searchField, searchQuery]);

  const totalPages = Math.ceil(processed.length / ITEMS_PER_PAGE);
  const paginated = processed.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getReasonLabel = (reasonId?: string) => {
    if (!reasonId) return '-';
    const reason = rejectionReasons.find((r) => r.id === reasonId);
    return reason ? reason.adminLabel : reasonId;
  };

  const handleReset = () => {
    setStatusFilter('');
    setSearchField('nickname');
    setSearchQuery('');
    setPage(1);
  };

  const columns = [
    {
      key: 'status',
      label: '상태',
      width: '80px',
      align: 'center' as const,
      render: (item: QuestSubmission & Record<string, unknown>) => (
        <Badge variant="submissionStatus" value={item.status} />
      ),
    },
    {
      key: 'id',
      label: '제출ID',
      width: '120px',
      render: (item: QuestSubmission & Record<string, unknown>) => (
        <span className="text-sm text-gray-700 font-mono">{item.id}</span>
      ),
    },
    {
      key: 'nickname',
      label: '유저닉네임',
      render: (item: QuestSubmission & Record<string, unknown>) => (
        <span className="text-blue-600">{item.nickname}</span>
      ),
    },
    {
      key: 'rejectionReason',
      label: '반려사유',
      render: (item: QuestSubmission & Record<string, unknown>) => (
        <span className="text-sm text-gray-600">{getReasonLabel(item.rejectionReason)}</span>
      ),
    },
    {
      key: 'image',
      label: '이미지보기',
      width: '90px',
      align: 'center' as const,
      render: (item: QuestSubmission & Record<string, unknown>) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPreviewImage(item.imageUrl);
          }}
          className="text-gray-400 hover:text-blue-600 transition-colors"
        >
          <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      ),
    },
    {
      key: 'submittedAt',
      label: '제출일시',
      width: '150px',
      render: (item: QuestSubmission & Record<string, unknown>) => formatDateTime(item.submittedAt),
    },
    {
      key: 'processedAt',
      label: '처리일시',
      width: '150px',
      render: (item: QuestSubmission & Record<string, unknown>) => item.processedAt ? formatDateTime(item.processedAt) : '-',
    },
    {
      key: 'processedBy',
      label: '처리자',
      width: '120px',
      render: (item: QuestSubmission & Record<string, unknown>) => (
        <span className="text-sm text-gray-600">{item.processedBy || '-'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Area */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 shrink-0">상태</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체</option>
              <option value="Approved">승인</option>
              <option value="Rejected">반려</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 flex-1">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="nickname">닉네임</option>
              <option value="id">제출ID</option>
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="검색어 입력"
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1 max-w-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
            >
              초기화
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable<QuestSubmission & Record<string, unknown>>
        columns={columns}
        data={paginated as (QuestSubmission & Record<string, unknown>)[]}
        emptyMessage="처리내역이 없습니다."
        rowNumber={{ page, perPage: ITEMS_PER_PAGE }}
      />

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

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
