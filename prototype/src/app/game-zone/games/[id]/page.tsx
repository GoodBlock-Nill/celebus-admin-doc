'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/modals/ConfirmModal';
import PublishModal from '@/components/modals/PublishModal';
import ResultInputModal from '@/components/modals/ResultInputModal';
import RewardModal from '@/components/modals/RewardModal';
import { useGameStore } from '@/stores/useGameStore';
import { useUIStore } from '@/stores/useUIStore';
import { getParticipantsByGameId } from '@/mock/participants';
import { GAME_STATUS_ACTIONS, GAME_TYPE_LABELS, ITEMS_PER_PAGE } from '@/lib/constants';
import { formatDateTime, formatGP, formatNumber } from '@/lib/utils';
import type { Participant } from '@/lib/types';

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const game = useGameStore((s) => s.getGameById(id));
  const { changeGameStatus, setGameResult, distributeReward, deleteGame } = useGameStore();
  const { activeModal, openModal, closeModal, addToast, activeTab, setActiveTab } = useUIStore();
  const [participantPage, setParticipantPage] = useState(1);
  const [rewardPage, setRewardPage] = useState(1);

  const REWARD_ITEMS_PER_PAGE = 20;

  if (!game) {
    return <div className="text-center py-20 text-gray-500">게임을 찾을 수 없습니다.</div>;
  }

  const participants = getParticipantsByGameId(id);
  const actions = GAME_STATUS_ACTIONS[game.status];
  const winners = participants.filter(p => p.choice === game.result);
  const totalParticipantPages = Math.ceil(participants.length / ITEMS_PER_PAGE);

  // 보상상세 계산
  const totalShares = winners.reduce((sum, p) => sum + p.participationGP + (p.boostingGP * (game.boostingMultiplier || 2)), 0);
  const totalRewardPages = Math.ceil(winners.length / REWARD_ITEMS_PER_PAGE);
  const paginatedWinners = winners.slice(
    (rewardPage - 1) * REWARD_ITEMS_PER_PAGE,
    rewardPage * REWARD_ITEMS_PER_PAGE
  );
  const paginatedParticipants = participants.slice(
    (participantPage - 1) * ITEMS_PER_PAGE,
    participantPage * ITEMS_PER_PAGE,
  );

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

      {activeTab === 'basic' && (
        <div className="space-y-8">
          <DetailSection title="기본정보" fields={[
            { label: '게임유형', value: GAME_TYPE_LABELS[game.type] },
            { label: '타이틀 (KO)', value: game.title.ko },
            { label: '타이틀 (EN)', value: game.title.en || '-' },
            { label: '타이틀 (JP)', value: game.title.jp || '-' },
            { label: '상세설명 (KO)', value: game.description.ko || '-', full: true, html: true },
            { label: '상세설명 (EN)', value: game.description.en || '-', full: true, html: true },
            { label: '상세설명 (JP)', value: game.description.jp || '-', full: true, html: true },
            { label: '힌트 링크', value: game.hintLinkEnabled && game.hintLink ? (
              <a href={game.hintLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{game.hintLink}</a>
            ) : '-' },
            { label: '생성일', value: formatDateTime(game.createdAt) },
            { label: '생성자', value: game.createdBy },
          ]} />
          <DetailSection title="보상설정" fields={[
            { label: '총 상금 GP', value: formatGP(game.totalPrizeGP) },
          ]} />
          <DetailSection title="참여설정" fields={[
            { label: '참여 정원', value: game.maxParticipants === 0 ? '무제한' : `${formatNumber(game.maxParticipants)}명` },
            { label: '참여 비용', value: formatGP(game.participationCost) },
            { label: '부스팅', value: game.boostingEnabled ? '사용' : '미사용' },
            { label: '부스팅 비용', value: game.boostingEnabled ? formatGP(game.boostingCost) : '-' },
            { label: '부스팅 배수', value: game.boostingEnabled ? `${game.boostingMultiplier}배` : '-' },
          ]} />
          <DetailSection title="일정설정" fields={[
            { label: '투표 시작일시', value: game.publishedAt ? formatDateTime(game.publishedAt) : '(게시 시 설정)' },
            { label: '투표 종료일시', value: formatDateTime(game.endDate) },
            { label: '결과 발표 예정일', value: formatDateTime(game.resultDate) },
          ]} />
          <DetailSection title="결과설정" fields={[
            { label: '결과 확인 기준 (KO)', value: game.resultBasis.ko || '-', full: true },
            { label: '결과 확인 기준 (EN)', value: game.resultBasis.en || '-', full: true },
            { label: '결과 확인 기준 (JP)', value: game.resultBasis.jp || '-', full: true },
          ]} />
        </div>
      )}

      {activeTab === 'participants' && (
        <div>
          {(game.status === 'Draft' || game.status === 'Ready') ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <p className="text-gray-500">게임이 아직 게시되지 않아 참여 내역이 없습니다.</p>
            </div>
          ) : (
            <>
              <DataTable<Participant & Record<string, unknown>>
                columns={[
                  { key: 'nickname', label: '닉네임', render: (item: Participant) => <span className="text-blue-600 hover:underline cursor-pointer">{item.nickname.toLowerCase()}</span> },
                  { key: 'participatedAt', label: '참여일시', sortable: true, render: (item: Participant) => formatDateTime(item.participatedAt) },
                  { key: 'choice', label: '선택', align: 'center', width: '100px' },
                  { key: 'participationGP', label: '참여 GP', align: 'right', width: '120px', sortable: true, render: (item: Participant) => formatGP(item.participationGP) },
                  { key: 'boostingGP', label: '부스팅 GP', align: 'right', width: '120px', sortable: true, render: (item: Participant) => formatGP(item.boostingGP) },
                  { key: 'status', label: '상태', align: 'center', width: '120px', render: (item: Participant) => <Badge variant="custom" value={item.status} customBg="bg-green-100" customText="text-green-600" customLabel={item.status} /> },
                ]}
                data={paginatedParticipants as (Participant & Record<string, unknown>)[]}
                emptyMessage="참여 내역이 없습니다."
                rowNumber={{ page: participantPage, perPage: ITEMS_PER_PAGE }}
              />
              <Pagination currentPage={participantPage} totalPages={totalParticipantPages} onPageChange={setParticipantPage} />
            </>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-8">
          <DetailSection title="결과 정보" fields={[
            { label: '결과제목 (KO)', value: game.resultTitle?.ko || '-', full: true },
            { label: '결과제목 (EN)', value: game.resultTitle?.en || '-', full: true },
            { label: '결과제목 (JP)', value: game.resultTitle?.jp || '-', full: true },
            { label: '결과', value: game.result ? (
              <Badge variant="custom" value={game.result} customBg={game.result === 'YES' ? 'bg-green-100' : 'bg-red-100'} customText={game.result === 'YES' ? 'text-green-700' : 'text-red-700'} customLabel={game.result} />
            ) : '-' },
            { label: '결과설명 (KO)', value: game.resultDescription?.ko || '-', full: true },
            { label: '결과설명 (EN)', value: game.resultDescription?.en || '-', full: true },
            { label: '결과설명 (JP)', value: game.resultDescription?.jp || '-', full: true },
            { label: '결과링크 (KO)', value: game.resultLinkUrl?.ko ? (
              <a href={game.resultLinkUrl.ko} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{game.resultLinkText?.ko || game.resultLinkUrl.ko}</a>
            ) : '-' },
            { label: '결과링크 (EN)', value: game.resultLinkUrl?.en ? (
              <a href={game.resultLinkUrl.en} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{game.resultLinkText?.en || game.resultLinkUrl.en}</a>
            ) : '-' },
            { label: '결과링크 (JP)', value: game.resultLinkUrl?.jp ? (
              <a href={game.resultLinkUrl.jp} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{game.resultLinkText?.jp || game.resultLinkUrl.jp}</a>
            ) : '-' },
          ]} />
          <DetailSection title="보상 현황" fields={[
            { label: '총 상금 GP', value: formatGP(game.totalPrizeGP) },
            { label: '정답자 수', value: `${winners.length}명` },
            { label: '미지급 보상 GP', value: !game.rewardDistributed ? formatGP(game.totalPrizeGP) : '0 GP' },
            { label: '미지급보상자(탈퇴회원)', value: '0명' },
            { label: '지분당 보상 GP', value: totalShares > 0 ? formatGP(Math.floor(game.totalPrizeGP / totalShares)) : '-' },
            { label: '보상 지급 상태', value: (
              <Badge variant="custom" value={game.rewardDistributed ? 'done' : 'pending'} customBg={game.rewardDistributed ? 'bg-green-100' : 'bg-gray-100'} customText={game.rewardDistributed ? 'text-green-700' : 'text-gray-600'} customLabel={game.rewardDistributed ? '지급 완료' : '미지급'} />
            ) },
            { label: '보상 지급일', value: game.rewardDistributedAt ? formatDateTime(game.rewardDistributedAt) : '-' },
          ]} />
          {game.result && winners.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">보상 상세 (정답자 목록)</h3>
              <DataTable<Participant & Record<string, unknown>>
                columns={[
                  { key: 'nickname', label: '닉네임', render: (p: Participant) => p.nickname.toLowerCase() },
                  { key: 'share', label: '지분', align: 'right', render: (p: Participant) => `${p.participationGP + (p.boostingGP * (game.boostingMultiplier || 2))} GP` },
                  { key: 'participationGP', label: '참여 GP', align: 'right', render: (p: Participant) => formatGP(p.participationGP) },
                  { key: 'boostingGP', label: '부스팅 GP', align: 'right', render: (p: Participant) => formatGP(p.boostingGP) },
                  { key: 'rewardGP', label: '보상 GP', align: 'right', render: (p: Participant) => {
                    const share = p.participationGP + (p.boostingGP * (game.boostingMultiplier || 2));
                    const reward = totalShares > 0 ? Math.floor((share / totalShares) * game.totalPrizeGP) : 0;
                    return <span className="font-semibold">{formatGP(reward)}</span>;
                  }},
                  { key: 'refundGP', label: '환급 GP', align: 'right', render: (p: Participant) => formatGP(p.participationGP) },
                ]}
                data={paginatedWinners as (Participant & Record<string, unknown>)[]}
                rowNumber={{ page: rewardPage, perPage: REWARD_ITEMS_PER_PAGE }}
              />
              <Pagination currentPage={rewardPage} totalPages={totalRewardPages} onPageChange={setRewardPage} />
            </div>
          )}
        </div>
      )}

      <PublishModal isOpen={activeModal === 'publish'} onClose={closeModal} game={game}
        onConfirm={() => { changeGameStatus(id, 'Active'); closeModal(); addToast('success', '게임이 게시되었습니다.'); }} />
      <ConfirmModal isOpen={activeModal === 'forceClose'} onClose={closeModal} title="강제 종료 확인"
        message="게임을 강제 종료하시겠습니까?" warning="강제 종료 시 모든 참여자에게 참여 GP와 부스팅 GP가 전액 환급됩니다. 이 작업은 되돌릴 수 없습니다."
        confirmText="강제 종료" confirmVariant="danger"
        onConfirm={() => { changeGameStatus(id, 'Ended'); closeModal(); addToast('success', '게임이 강제 종료되었습니다.'); }} />
      <ConfirmModal isOpen={activeModal === 'delete'} onClose={closeModal} title="삭제 확인"
        message="게임을 삭제하시겠습니까?" warning="삭제된 게임은 복구할 수 없습니다."
        confirmText="삭제하기" confirmVariant="danger"
        onConfirm={() => { deleteGame(id); closeModal(); addToast('success', '게임이 삭제되었습니다.'); router.push('/game-zone/games'); }} />
      <ResultInputModal isOpen={activeModal === 'inputResult'} onClose={closeModal} game={game}
        onConfirm={(result, resultTitle, resultDescription, resultLinkText, resultLinkUrl) => { setGameResult(id, result, resultTitle, resultDescription, resultLinkText, resultLinkUrl); closeModal(); addToast('success', `결과가 "${result}"(으)로 확정되었습니다.`); }} />
      <RewardModal isOpen={activeModal === 'distributeReward'} onClose={closeModal} game={game}
        onConfirm={() => { distributeReward(id); closeModal(); addToast('success', '보상이 지급되었습니다.'); }} />
    </div>
  );
}

function DetailSection({ title, fields }: { title: string; fields: { label: string; value: React.ReactNode; full?: boolean; html?: boolean }[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="divide-y divide-gray-100">
        {fields.map((field, i) => (
          <div key={i} className="flex items-start py-3 first:pt-0 last:pb-0">
            <span className="text-sm text-gray-500 w-[160px] shrink-0">{field.label}</span>
            {field.html && typeof field.value === 'string' ? (
              <div className="text-sm text-gray-900 prose prose-sm max-w-none flex-1" dangerouslySetInnerHTML={{ __html: field.value }} />
            ) : (
              <span className="text-sm text-gray-900 flex-1">{field.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
