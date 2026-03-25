'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Badge from '@/components/ui/Badge';
import StatsCard from '@/components/ui/StatsCard';
import Modal from '@/components/ui/Modal';
import { useFQStore } from '@/stores/useFQStore';
import { useUIStore } from '@/stores/useUIStore';
import { QUEST_STATUS_ACTIONS, REWARD_TYPE_CONFIG } from '@/lib/constants';
import { formatDateTime, formatNumber } from '@/lib/utils';
import PendingTab from './PendingTab';
import HistoryTab from './HistoryTab';

import type { Quest } from '@/lib/fq-types';

function BasicInfoTab({ quest }: { quest: Quest }) {
  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard label="총 제출 수" value={formatNumber(quest.stats.total)} variant="count" />
        <StatsCard label="승인" value={formatNumber(quest.stats.approved)} variant="count" />
        <StatsCard label="반려" value={formatNumber(quest.stats.rejected)} variant="warning" />
        <StatsCard label="대기" value={formatNumber(quest.stats.pending)} variant="warning" />
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Thumbnail */}
        <div className="col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">대표 이미지</h3>
            <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
              <span className="text-4xl">🖼️</span>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center truncate">{quest.thumbnailImage}</p>
          </div>
        </div>

        {/* Right: Info tables */}
        <div className="col-span-2 space-y-6">
          {/* Quest 정보 */}
          <DetailSection title="Quest 정보" fields={[
            { label: '아티스트', value: quest.artist },
            { label: '타입', value: quest.questType },
            { label: '보상', value: (
              <span className="flex items-center gap-2">
                <Badge variant="rewardType" value={quest.rewardType} />
                <span className="text-sm text-gray-700">
                  {quest.ticketCount > 0 && `${quest.ticketCount}장`}
                  {quest.nftEvent && ` / ${quest.nftEvent}`}
                </span>
              </span>
            )},
            { label: '연관 링크', value: quest.relatedLinks.length > 0 ? (
              <div className="space-y-1">
                {quest.relatedLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm block">
                    {link.label.ko} ({link.url})
                  </a>
                ))}
              </div>
            ) : '-' },
            { label: quest.startedAt ? '시작일시' : '마감일시', value: quest.startedAt ? formatDateTime(quest.startedAt) : formatDateTime(quest.deadline) },
            { label: '마감일시', value: formatDateTime(quest.deadline) },
          ]} />

          {/* 관리 정보 */}
          <DetailSection title="관리 정보" fields={[
            { label: '상태', value: <Badge variant="questStatus" value={quest.status} /> },
            { label: '생성 관리자', value: quest.createdBy },
            { label: '생성 일시', value: formatDateTime(quest.createdAt) },
            { label: '최근 수정자', value: quest.updatedBy },
            { label: '최근 수정 일시', value: formatDateTime(quest.updatedAt) },
          ]} />
        </div>
      </div>

      {/* Multi-lang text sections */}
      <DetailSection title="Quest 타이틀" fields={[
        { label: 'KO', value: quest.title.ko || '-' },
        { label: 'EN', value: quest.title.en || '-' },
        { label: 'JA', value: quest.title.jp || '-' },
      ]} />

      <DetailSection title="Quest 설명" fields={[
        { label: 'KO', value: quest.description.ko || '-', full: true },
        { label: 'EN', value: quest.description.en || '-', full: true },
        { label: 'JA', value: quest.description.jp || '-', full: true },
      ]} />

      <DetailSection title="Quest 유저 가이드" fields={[
        { label: 'KO', value: quest.userGuide.ko || '-', full: true, pre: true },
        { label: 'EN', value: quest.userGuide.en || '-', full: true, pre: true },
        { label: 'JA', value: quest.userGuide.jp || '-', full: true, pre: true },
      ]} />
    </div>
  );
}

function DetailSection({ title, fields }: {
  title: string;
  fields: { label: string; value: React.ReactNode; full?: boolean; pre?: boolean }[];
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="divide-y divide-gray-100">
        {fields.map((field, i) => (
          <div key={i} className="flex items-start py-3 first:pt-0 last:pb-0">
            <span className="text-sm text-gray-500 w-[160px] shrink-0">{field.label}</span>
            {field.pre && typeof field.value === 'string' ? (
              <pre className="text-sm text-gray-900 flex-1 whitespace-pre-wrap font-sans">{field.value}</pre>
            ) : (
              <span className="text-sm text-gray-900 flex-1">{field.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function QuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const quest = useFQStore((s) => s.getQuestById(id));
  const { publishQuest, closeQuest, deleteQuest } = useFQStore();
  const { addToast } = useUIStore();

  const [activeTab, setActiveTab] = useState('basic');
  const [activeModal, setActiveModal] = useState<string | null>(null);

  if (!quest) {
    return <div className="text-center py-20 text-gray-500">Quest를 찾을 수 없습니다.</div>;
  }

  const actions = QUEST_STATUS_ACTIONS[quest.status] || [];
  const pendingCount = quest.stats.pending;

  const handleAction = (action: string) => {
    switch (action) {
      case 'edit': router.push(`/fan-quest/quests/${id}/edit`); break;
      case 'publish': setActiveModal('publish'); break;
      case 'close': setActiveModal('close'); break;
      case 'delete': setActiveModal('delete'); break;
    }
  };

  const actionButtons: Record<string, { label: string; variant: string }> = {
    delete: { label: '삭제하기', variant: 'danger-outline' },
    edit: { label: '수정하기', variant: 'outline' },
    publish: { label: '게시하기', variant: 'primary' },
    close: { label: '종료하기', variant: 'danger' },
  };

  const btnClass = (v: string) => {
    if (v === 'primary') return 'bg-blue-600 text-white hover:bg-blue-700';
    if (v === 'danger') return 'bg-red-600 text-white hover:bg-red-700';
    if (v === 'danger-outline') return 'border border-red-300 text-red-600 hover:bg-red-50';
    return 'border border-gray-200 text-gray-700 hover:bg-gray-50';
  };

  const tabs = [
    { key: 'basic', label: '기본정보', badge: 0 },
    { key: 'pending', label: '대기내역', badge: pendingCount },
    { key: 'history', label: '처리내역', badge: 0 },
  ];

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '팬퀘스트', href: '/fan-quest' },
          { label: 'Fan Quest 관리', href: '/fan-quest' },
          { label: 'Quest 상세' },
        ]}
      />

      {/* Header: Title + Status + Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/fan-quest')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-[28px] font-bold text-gray-900">{quest.title.ko}</h1>
          <Badge variant="questStatus" value={quest.status} />
        </div>
        <div className="flex items-center gap-2">
          {actions.map((action) => {
            const btn = actionButtons[action];
            if (!btn) return null;
            return (
              <button
                key={action}
                onClick={() => handleAction(action)}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${btnClass(btn.variant)}`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-red-500 text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'basic' && <BasicInfoTab quest={quest} />}
      {activeTab === 'pending' && <PendingTab questId={id} />}
      {activeTab === 'history' && <HistoryTab questId={id} />}

      {/* Publish Modal */}
      <Modal
        isOpen={activeModal === 'publish'}
        onClose={() => setActiveModal(null)}
        title="Quest 게시"
        footer={
          <>
            <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">
              취소
            </button>
            <button
              onClick={() => {
                publishQuest(id);
                setActiveModal(null);
                addToast('success', 'Quest가 게시되었습니다.');
              }}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              게시
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">확인 버튼을 누르면 Quest가 게시됩니다. 계속 진행하시겠습니까?</p>
      </Modal>

      {/* Close Modal */}
      <Modal
        isOpen={activeModal === 'close'}
        onClose={() => setActiveModal(null)}
        title="Quest 종료"
        footer={
          <>
            <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">
              취소
            </button>
            <button
              onClick={() => {
                closeQuest(id);
                setActiveModal(null);
                addToast('success', 'Quest가 종료되었습니다.');
              }}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              종료
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">확인 버튼을 누르면 Quest가 조기 종료됩니다. 계속 진행하시겠습니까?</p>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={activeModal === 'delete'}
        onClose={() => setActiveModal(null)}
        title="Quest 삭제"
        footer={
          <>
            <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">
              취소
            </button>
            <button
              onClick={() => {
                deleteQuest(id);
                setActiveModal(null);
                addToast('success', 'Quest가 삭제되었습니다.');
                router.push('/fan-quest');
              }}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              삭제
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">확인 버튼을 누르면 Quest가 삭제됩니다. 계속 진행하시겠습니까?</p>
      </Modal>
    </div>
  );
}
