'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import { QuestForm, EMPTY_FORM_VALUES, canSubmitQuest, type QuestFormValues } from '../_components/QuestForm';
import ConfirmModal from '../_components/ConfirmModal';

export default function FanQuestCreatePage() {
  const router = useRouter();
  const [values, setValues] = useState<QuestFormValues>(EMPTY_FORM_VALUES);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  const canSubmit = canSubmitQuest(values, 'create');

  const handleSubmit = () => {
    if (!canSubmit) return;
    setCompleteOpen(true);
  };

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '팬퀘스트', href: '/fanquest' },
          { label: 'Quest 생성' },
        ]}
      />

      <div className="flex items-start justify-between -mt-2 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setCancelOpen(true)} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <h1 className="text-[24px] font-bold text-gray-900">Quest 생성</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCancelOpen(true)}
            className="h-10 px-4 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100"
          >
            취소하기
          </button>
          <button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="h-10 px-4 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 disabled:text-indigo-300 disabled:cursor-not-allowed"
          >
            생성하기
          </button>
        </div>
      </div>

      <QuestForm mode="create" values={values} onChange={setValues} initialValues={EMPTY_FORM_VALUES} />

      {cancelOpen && (
        <ConfirmModal
          title="Quest 생성 취소"
          message="작성 중인 내용이 사라집니다. 취소하시겠습니까?"
          confirmLabel="확인"
          cancelLabel="계속 작성"
          onCancel={() => setCancelOpen(false)}
          onConfirm={() => router.push('/fanquest')}
        />
      )}

      {completeOpen && (
        <ConfirmModal
          title="Quest 생성 완료"
          message={`'${values.titleKO}' Quest가 임시저장으로 생성되었습니다.`}
          confirmLabel="확인"
          singleAction
          onConfirm={() => router.push('/fanquest')}
        />
      )}
    </div>
  );
}
