'use client';

import { useState, useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import DataTable from '@/components/ui/DataTable';
import FilterBar from '@/components/ui/FilterBar';
import Modal from '@/components/ui/Modal';
import MultiLangTextarea from '@/components/forms/MultiLangTextarea';
import { useFQStore } from '@/stores/useFQStore';
import type { RejectionReason } from '@/lib/fq-types';

const EMPTY_LANG = { ko: '', en: '', jp: '' };

interface ReasonFormState {
  adminLabel: string;
  userMessage: { ko: string; en: string; jp: string };
  isActive: boolean;
}

const initialFormState: ReasonFormState = {
  adminLabel: '',
  userMessage: { ...EMPTY_LANG },
  isActive: true,
};

function isFormValid(form: ReasonFormState): boolean {
  return (
    form.adminLabel.trim().length > 0 &&
    form.userMessage.ko.trim().length > 0 &&
    form.userMessage.en.trim().length > 0 &&
    form.userMessage.jp.trim().length > 0
  );
}

export default function RejectionReasonsPage() {
  const { rejectionReasons, addRejectionReason, updateRejectionReason } = useFQStore();

  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<RejectionReason | null>(null);
  const [form, setForm] = useState<ReasonFormState>({ ...initialFormState });

  const filteredReasons = useMemo(() => {
    const sorted = [...rejectionReasons].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (!statusFilter) return sorted;
    const isActive = statusFilter === 'active';
    return sorted.filter((r) => r.isActive === isActive);
  }, [rejectionReasons, statusFilter]);

  const filterConfig = [
    {
      key: 'status',
      label: '상태',
      type: 'select' as const,
      value: statusFilter,
      options: [
        { value: 'active', label: '사용' },
        { value: 'inactive', label: '미사용' },
      ],
    },
  ];

  const columns = [
    {
      key: 'isActive',
      label: '상태',
      align: 'center' as const,
      width: '100px',
      render: (item: RejectionReason) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
            item.isActive
              ? 'bg-green-100 text-green-600'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {item.isActive ? '사용' : '미사용'}
        </span>
      ),
    },
    {
      key: 'adminLabel',
      label: '운영자 노출명',
      render: (item: RejectionReason) => (
        <span className="text-gray-900">{item.adminLabel}</span>
      ),
    },
  ];

  const openAddModal = () => {
    setForm({ ...initialFormState });
    setShowAddModal(true);
  };

  const openEditModal = (reason: RejectionReason) => {
    setSelectedReason(reason);
    setForm({
      adminLabel: reason.adminLabel,
      userMessage: { ...reason.userMessage },
      isActive: reason.isActive,
    });
    setShowEditModal(true);
  };

  const handleAdd = () => {
    if (!isFormValid(form)) return;
    addRejectionReason({
      adminLabel: form.adminLabel.trim(),
      userMessage: {
        ko: form.userMessage.ko.trim(),
        en: form.userMessage.en.trim(),
        jp: form.userMessage.jp.trim(),
      },
      isActive: true,
    });
    setShowAddModal(false);
  };

  const handleEdit = () => {
    if (!selectedReason || !isFormValid(form)) return;
    updateRejectionReason(selectedReason.id, {
      adminLabel: form.adminLabel.trim(),
      userMessage: {
        ko: form.userMessage.ko.trim(),
        en: form.userMessage.en.trim(),
        jp: form.userMessage.jp.trim(),
      },
      isActive: form.isActive,
    });
    setShowEditModal(false);
    setSelectedReason(null);
  };

  const langCompletion = (msg: { ko: string; en: string; jp: string }) => ({
    ko: msg.ko.trim().length > 0,
    en: msg.en.trim().length > 0,
    jp: msg.jp.trim().length > 0,
  });

  const renderModalBody = (mode: 'add' | 'edit') => {
    const completion = langCompletion(form.userMessage);

    return (
      <div className="space-y-5">
        {/* 운영자 노출명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            운영자 노출명
            <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={form.adminLabel}
            onChange={(e) => setForm({ ...form, adminLabel: e.target.value })}
            maxLength={100}
            placeholder="운영자 노출명 입력"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-400">
              {form.adminLabel.length}/100
            </span>
          </div>
        </div>

        {/* 유저 노출 메시지 */}
        <MultiLangTextarea
          label="유저 노출 메시지"
          values={form.userMessage}
          onChange={(values) => setForm({ ...form, userMessage: values })}
          maxLength={200}
          required
          rows={4}
        />

        {/* Language completion indicators */}
        <div className="flex gap-2">
          {(['ko', 'en', 'jp'] as const).map((lang) => (
            <span
              key={lang}
              className={`px-2 py-0.5 text-xs rounded font-medium ${
                completion[lang]
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {lang.toUpperCase()} {completion[lang] ? '완료' : '미입력'}
            </span>
          ))}
        </div>

        {/* 상태설정 (edit only) */}
        {mode === 'edit' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              상태설정
            </label>
            <div className="relative">
              <select
                value={form.isActive ? 'active' : 'inactive'}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.value === 'active' })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="active">사용</option>
                <option value="inactive">미사용</option>
              </select>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              미사용 처리된 반려사유는 검수 화면에서 노출되지 않습니다.
            </p>
          </div>
        )}
      </div>
    );
  };

  const addModalFooter = (
    <>
      <button
        type="button"
        onClick={() => setShowAddModal(false)}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        취소하기
      </button>
      <button
        type="button"
        onClick={handleAdd}
        disabled={!isFormValid(form)}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        추가하기
      </button>
    </>
  );

  const editModalFooter = (
    <>
      <button
        type="button"
        onClick={() => {
          setShowEditModal(false);
          setSelectedReason(null);
        }}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        취소하기
      </button>
      <button
        type="button"
        onClick={handleEdit}
        disabled={!isFormValid(form)}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        저장하기
      </button>
    </>
  );

  return (
    <div>
      <PageHeader
        title="반려사유 설정"
        breadcrumbItems={[
          { label: '팬퀘스트', href: '/fan-quest' },
          { label: '반려사유 설정' },
        ]}
        actions={
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
          >
            + 새 사유 추가
          </button>
        }
      />

      <div className="mb-4">
        <FilterBar
          filters={filterConfig}
          onFilterChange={(key, value) => {
            if (key === 'status') setStatusFilter(value);
          }}
          onReset={() => setStatusFilter('')}
        />
      </div>

      <DataTable<RejectionReason & Record<string, unknown>>
        columns={columns}
        data={filteredReasons as (RejectionReason & Record<string, unknown>)[]}
        onRowClick={(item) => openEditModal(item as unknown as RejectionReason)}
        emptyMessage="등록된 반려 사유가 없습니다."
      />

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="반려사유 추가"
        footer={addModalFooter}
        width="max-w-xl"
      >
        {renderModalBody('add')}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedReason(null);
        }}
        title="반려사유 수정"
        footer={editModalFooter}
        width="max-w-xl"
      >
        {renderModalBody('edit')}
      </Modal>
    </div>
  );
}
