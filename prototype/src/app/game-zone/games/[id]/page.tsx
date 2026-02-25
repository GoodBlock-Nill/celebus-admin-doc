'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Badge from '@/components/ui/Badge';
import ForceCloseModal from '@/components/modals/ForceCloseModal';
import DeleteModal from '@/components/modals/DeleteModal';
import PublishModal from '@/components/modals/PublishModal';
import ResultInputModal from '@/components/modals/ResultInputModal';
import RewardModal from '@/components/modals/RewardModal';
import { useGameStore } from '@/stores/useGameStore';
import { useUIStore } from '@/stores/useUIStore';
import { getParticipantsByGameId } from '@/mock/participants';
import { GAME_STATUS_ACTIONS, GAME_STATUS_ACTIONS_ST } from '@/lib/constants';
import BasicInfoTab from './BasicInfoTab';
import ParticipantsTab from './ParticipantsTab';
import ResultsTab from './ResultsTab';

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const game = useGameStore((s) => s.getGameById(id));
  const { changeGameStatus, setGameResult, distributeReward, deleteGame } = useGameStore();
  const { activeModal, openModal, closeModal, addToast, activeTab, setActiveTab } = useUIStore();

  if (!game) {
    return <div className="text-center py-20 text-gray-500">게임을 찾을 수 없습니다.</div>;
  }

  const participants = getParticipantsByGameId(id);
  const isST = game.type === 'SURVIVAL_TRIVIA';
  const actions = (isST ? GAME_STATUS_ACTIONS_ST : GAME_STATUS_ACTIONS)[game.status] || [];

  const handleAction = (action: string) => {
    switch (action) {
      case 'edit': router.push(`/game-zone/games/${id}/edit`); break;
      case 'publish': openModal('publish'); break;
      case 'forceClose': openModal('forceClose'); break;
      case 'delete': openModal('delete'); break;
      case 'inputResult': openModal('inputResult'); break;
      case 'editResult': openModal('inputResult'); break;
      case 'distributeReward': openModal('distributeReward'); break;
    }
  };

  const actionButtons: Record<string, { label: string; variant: string }> = {
    delete: { label: '삭제하기', variant: 'danger-outline' },
    edit: { label: '수정하기', variant: 'outline' },
    publish: { label: '게시하기', variant: 'primary' },
    forceClose: { label: '강제 종료', variant: 'danger' },
    inputResult: { label: '결과 입력', variant: 'primary' },
    editResult: { label: '결과 수정', variant: 'outline' },
    distributeReward: { label: '보상 지급', variant: 'primary' },
  };

  const btnClass = (v: string) => {
    if (v === 'primary') return 'bg-blue-600 text-white hover:bg-blue-700';
    if (v === 'danger') return 'bg-red-600 text-white hover:bg-red-700';
    if (v === 'danger-outline') return 'border border-red-300 text-red-600 hover:bg-red-50';
    return 'border border-gray-200 text-gray-700 hover:bg-gray-50';
  };

  const tabs = [
    { key: 'basic', label: '기본정보' },
    { key: 'participants', label: '참여내역' },
    { key: 'results', label: '결과/보상' },
  ];

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '게임존', href: '/game-zone' },
          { label: '게임 관리', href: '/game-zone/games' },
          { label: '게임 상세' },
        ]}
      />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-bold text-gray-900">{game.title.ko}</h1>
          <Badge variant="gameType" value={game.type} />
          <Badge variant="gameStatus" value={game.status} />
        </div>
        <div className="flex items-center gap-2">
          {actions.map((action) => {
            const btn = actionButtons[action];
            if (!btn) return null;
            return (
              <button key={action} onClick={() => handleAction(action)} className={`px-4 py-2 text-sm font-medium rounded-lg ${btnClass(btn.variant)}`}>
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'basic' && <BasicInfoTab game={game} />}
      {activeTab === 'participants' && <ParticipantsTab game={game} participants={participants} />}
      {activeTab === 'results' && <ResultsTab game={game} participants={participants} />}

      <PublishModal isOpen={activeModal === 'publish'} onClose={closeModal} game={game}
        onConfirm={() => { changeGameStatus(id, 'Active'); closeModal(); addToast('success', '게임이 게시되었습니다.'); }} />
      <ForceCloseModal isOpen={activeModal === 'forceClose'} onClose={closeModal} game={game}
        onConfirm={() => { changeGameStatus(id, 'Ended'); closeModal(); addToast('success', '게임이 강제 종료되었습니다.'); }} />
      <DeleteModal isOpen={activeModal === 'delete'} onClose={closeModal} game={game}
        onConfirm={() => { deleteGame(id); closeModal(); addToast('success', '게임이 삭제되었습니다.'); router.push('/game-zone/games'); }} />
      <ResultInputModal isOpen={activeModal === 'inputResult'} onClose={closeModal} game={game}
        onConfirm={(result, resultTitle, resultDescription, resultLinkText, resultLinkUrl) => { setGameResult(id, result, resultTitle, resultDescription, resultLinkText, resultLinkUrl); closeModal(); addToast('success', `결과가 "${result}"(으)로 확정되었습니다.`); }} />
      <RewardModal isOpen={activeModal === 'distributeReward'} onClose={closeModal} game={game}
        onConfirm={() => { distributeReward(id); closeModal(); addToast('success', '보상이 지급되었습니다.'); }} />
    </div>
  );
}
