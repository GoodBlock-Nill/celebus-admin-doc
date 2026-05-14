'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import { getQuestById } from '@/mock/fanquest';
import { QUEST_STATUS_BADGE } from '@/app/sq/quests/page';
import { QuestForm, canSubmitQuest, type QuestFormValues } from '../../_components/QuestForm';
import ConfirmModal from '../../_components/ConfirmModal';
import EpisodeUsagePanel from '../../_components/EpisodeUsagePanel';

export default function QuestEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const questId = parseInt(id, 10);
  const quest = getQuestById(questId);
  const router = useRouter();

  const initial: QuestFormValues = quest ? {
    titleKO: quest.titleKO,
    titleEN: quest.titleEN,
    titleJA: quest.titleJA,
    descKO: quest.descKO,
    descEN: quest.descEN,
    descJA: quest.descJA,
    guideKO: quest.guideKO,
    guideEN: quest.guideEN,
    guideJA: quest.guideJA,
    imageSrc: quest.imageSrc || '/sq/placeholder.jpg',
    artist: quest.artist,
    questType: quest.questType,
    endDate: quest.endDate,
    endTime: quest.endTime,
    relatedLinks: quest.relatedLinks,
    kind: quest.kind,
    repeatCycle: quest.repeatCycle,
    reward: quest.reward,
  } : null as unknown as QuestFormValues;

  const [values, setValues] = useState<QuestFormValues>(initial);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  if (!quest) return <div className="p-8 text-sm text-gray-500">Quest를 찾을 수 없습니다.</div>;

  if (quest.status === '종료') {
    return (
      <div className="p-8 text-sm text-gray-500">
        종료된 Quest는 수정할 수 없습니다.{' '}
        <button onClick={() => router.push(`/fanquest/${questId}?tab=info`)} className="text-indigo-600 hover:underline">상세로 돌아가기</button>
      </div>
    );
  }

  const canSubmit = canSubmitQuest(values, 'edit', quest.status);

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '팬퀘스트', href: '/fanquest' },
          { label: 'Quest 수정' },
        ]}
      />

      <div className="flex items-start justify-between -mt-2 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-[24px] font-bold text-gray-900">Quest 수정</h1>
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${QUEST_STATUS_BADGE[quest.status]}`}>{quest.status}</span>
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
            onClick={() => setCompleteOpen(true)}
            className="h-10 px-4 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 disabled:text-indigo-300 disabled:cursor-not-allowed"
          >
            수정하기
          </button>
        </div>
      </div>

      <EpisodeUsagePanel fanQuestId={questId} variant="banner" />

      <QuestForm
        mode="edit"
        questStatus={quest.status}
        values={values}
        onChange={setValues}
        initialValues={initial}
      />

      {cancelOpen && (
        <ConfirmModal
          title="Quest 수정 취소"
          message="작성 중인 내용이 사라집니다. 취소하시겠습니까?"
          confirmLabel="확인"
          cancelLabel="계속 작성"
          onCancel={() => setCancelOpen(false)}
          onConfirm={() => router.push(`/fanquest/${questId}?tab=info`)}
        />
      )}

      {completeOpen && (
        <ConfirmModal
          title="Quest 수정 완료"
          message="Quest 정보가 수정되었습니다."
          singleAction
          onConfirm={() => router.push(`/fanquest/${questId}?tab=info`)}
        />
      )}
    </div>
  );
}
