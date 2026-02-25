'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import MultiLangInput from '@/components/forms/MultiLangInput';
import MultiLangEditor from '@/components/forms/MultiLangEditor';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { useGameStore } from '@/stores/useGameStore';
import { useUIStore } from '@/stores/useUIStore';
import { GAME_TYPE_LABELS } from '@/lib/constants';
import PMEditFields from './PMEditFields';
import STEditFields from './STEditFields';
import { Section, HintLinkField } from './editHelpers';
import type { MultiLangText, GameStatus, Quiz } from '@/lib/types';

export default function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const game = useGameStore((s) => s.getGameById(id));
  const updateGame = useGameStore((s) => s.updateGame);
  const { addToast, activeModal, openModal, closeModal } = useUIStore();

  const [title, setTitle] = useState<MultiLangText>({ ko: '', en: '', jp: '' });
  const [description, setDescription] = useState<MultiLangText>({ ko: '', en: '', jp: '' });
  const [totalPrizeGP, setTotalPrizeGP] = useState(0);
  const [maxParticipants, setMaxParticipants] = useState(0);
  const [useLimit, setUseLimit] = useState(false);
  const [participationCost, setParticipationCost] = useState(1);
  const [boostingCost, setBoostingCost] = useState(1);
  const [boostingMultiplier, setBoostingMultiplier] = useState(2);
  const [hintLinkEnabled, setHintLinkEnabled] = useState(false);
  const [hintLink, setHintLink] = useState('');
  const [endDate, setEndDate] = useState('');
  const [resultDate, setResultDate] = useState('');
  const [resultBasis, setResultBasis] = useState<MultiLangText>({ ko: '', en: '', jp: '' });
  // ST-specific state
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [startDateTime, setStartDateTime] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (game) {
      setTitle({ ...game.title });
      setDescription({ ...game.description });
      setTotalPrizeGP(game.totalPrizeGP);
      setMaxParticipants(game.maxParticipants);
      setUseLimit(game.maxParticipants > 0);
      setParticipationCost(game.participationCost);
      setBoostingCost(game.boostingCost);
      setBoostingMultiplier(game.boostingMultiplier || 2);
      setHintLinkEnabled(game.hintLinkEnabled ?? false);
      setHintLink(game.hintLink || '');
      setEndDate(game.endDate);
      setResultDate(game.resultDate);
      setResultBasis({ ...game.resultBasis });
      if (game.type === 'SURVIVAL_TRIVIA') {
        setQuizzes(game.quizzes ? [...game.quizzes] : []);
        setStartDateTime(game.startDateTime || '');
      }
    }
  }, [game]);

  if (!game) {
    return <div className="text-center py-20 text-gray-500">게임을 찾을 수 없습니다.</div>;
  }

  const status = game.status;
  const isST = game.type === 'SURVIVAL_TRIVIA';
  const hasParticipants = game.participantCount > 0;

  const getEditableFields = (gameStatus: GameStatus) => {
    if (isST) {
      switch (gameStatus) {
        case 'Draft':
        case 'Ready':
          return { all: true };
        case 'Active':
          return { title: true, description: true, hintLink: true, startDateTime: true };
        case 'Ended':
        default:
          return {};
      }
    }
    switch (gameStatus) {
      case 'Draft':
      case 'Ready':
        return { all: true };
      case 'Active':
        return { title: true, description: true, hintLink: true, endDate: true, resultDate: true, resultBasis: true };
      case 'Pending':
        return { resultDate: true, resultBasis: true };
      case 'Closed':
      case 'Ended':
      default:
        return {};
    }
  };

  const editable = getEditableFields(status);
  const canEditAll = !!(('all' in editable) && editable.all);
  const canEditTitle = !!(canEditAll || editable.title);
  const canEditDescription = !!(canEditAll || editable.description);
  const canEditHintLink = !!(canEditAll || editable.hintLink);
  const canEditEndDate = !!(canEditAll || editable.endDate);
  const canEditResultDate = !!(canEditAll || editable.resultDate);
  const canEditResultBasis = !!(canEditAll || editable.resultBasis);
  const canEditReward = canEditAll;
  const canEditParticipation = canEditAll && !hasParticipants;
  const canEditBoosting = canEditAll && !hasParticipants;
  const canEditStartDateTime = !!(canEditAll || editable.startDateTime);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (canEditTitle && !title.ko.trim()) errs.titleKo = '타이틀(KO)은 필수입니다.';
    if (canEditReward && totalPrizeGP <= 0) errs.totalPrizeGP = '총 상금 GP를 입력하세요.';
    if (isST) {
      if (canEditAll && (maxParticipants <= 0 || maxParticipants > 500)) errs.maxParticipants = '1~500명';
      if (canEditStartDateTime && !startDateTime) errs.startDateTime = '게임 시작일시를 입력하세요.';
    } else {
      if (canEditEndDate && !endDate) errs.endDate = '투표 종료일시를 입력하세요.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isAllLangFilled = (t: MultiLangText) => !!(t.ko.trim() && t.en.trim() && t.jp.trim());

  const handleSave = () => {
    if (!validate()) return;

    const updateData: Record<string, unknown> = {};

    if (canEditTitle) updateData.title = title;
    if (canEditDescription) updateData.description = description;
    if (canEditHintLink) {
      updateData.hintLinkEnabled = hintLinkEnabled;
      updateData.hintLink = hintLinkEnabled ? hintLink : '';
    }
    if (canEditReward) updateData.totalPrizeGP = totalPrizeGP;

    if (isST) {
      if (canEditAll) {
        updateData.maxParticipants = maxParticipants;
        updateData.participationCost = participationCost;
        updateData.quizzes = quizzes;
        updateData.startDateTime = startDateTime;
      } else if (canEditStartDateTime) {
        updateData.startDateTime = startDateTime;
      }
    } else {
      if (canEditParticipation) {
        updateData.maxParticipants = useLimit ? maxParticipants : 0;
        updateData.participationCost = participationCost;
      }
      if (canEditBoosting) {
        updateData.boostingCost = boostingCost;
        updateData.boostingMultiplier = boostingMultiplier;
      }
      if (canEditEndDate) updateData.endDate = endDate;
      if (canEditResultDate) updateData.resultDate = resultDate;
      if (canEditResultBasis) updateData.resultBasis = resultBasis;
    }

    const isAllFilled = isST
      ? !!(isAllLangFilled(title) && isAllLangFilled(description) && totalPrizeGP > 0 && startDateTime && maxParticipants > 0 && quizzes.length > 0)
      : !!(isAllLangFilled(title) && isAllLangFilled(description) && totalPrizeGP > 0 && endDate && resultDate && isAllLangFilled(resultBasis));
    if (status === 'Draft' && isAllFilled) {
      updateData.status = 'Ready';
      updateGame(id, updateData);
      addToast('success', '게임이 저장되었습니다. 게시대기 상태로 변경되었습니다.');
    } else {
      updateGame(id, updateData);
      addToast('success', '게임 정보가 수정되었습니다.');
    }
    router.push(`/game-zone/games/${id}`);
  };

  const activeWarning = isST
    ? '진행중인 게임은 일부 필드만 수정할 수 있습니다. 퀴즈는 수정할 수 없습니다.'
    : '진행중인 게임은 일부 필드만 수정할 수 있습니다.';

  return (
    <div>
      <PageHeader
        title="게임 수정"
        breadcrumbItems={[
          { label: '게임존', href: '/game-zone' },
          { label: '게임 관리', href: '/game-zone/games' },
          { label: '게임 상세', href: `/game-zone/games/${id}` },
          { label: '게임 수정' },
        ]}
      />

      {(status === 'Active' || status === 'Pending') && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            {status === 'Active' && activeWarning}
            {status === 'Pending' && '결과 대기 중인 게임은 결과 발표 예정일과 결과 확인 기준만 수정할 수 있습니다.'}
          </p>
        </div>
      )}

      <div className="max-w-[800px] space-y-8">
        <Section title="기본정보">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-[100px]">게임유형</span>
              <span className="text-sm text-gray-500">{GAME_TYPE_LABELS[game.type]}</span>
            </div>
            <MultiLangInput
              label="타이틀"
              values={title}
              onChange={setTitle}
              maxLength={50}
              required
              error={errors.titleKo}
              disabled={!canEditTitle}
            />
            <MultiLangEditor
              label="상세설명"
              values={description}
              onChange={setDescription}
              disabled={!canEditDescription}
            />
            {(canEditAll || canEditHintLink) && (
              <HintLinkField
                hintLinkEnabled={hintLinkEnabled}
                setHintLinkEnabled={setHintLinkEnabled}
                hintLink={hintLink}
                setHintLink={setHintLink}
                canEdit={canEditHintLink}
              />
            )}
          </div>
        </Section>

        {isST ? (
          <STEditFields
            totalPrizeGP={totalPrizeGP} setTotalPrizeGP={setTotalPrizeGP} canEditReward={canEditReward}
            maxParticipants={maxParticipants} setMaxParticipants={setMaxParticipants}
            participationCost={participationCost} setParticipationCost={setParticipationCost} canEditAll={canEditAll}
            startDateTime={startDateTime} setStartDateTime={setStartDateTime} canEditStartDateTime={canEditStartDateTime}
            quizzes={quizzes} setQuizzes={setQuizzes} quizzesDisabled={status === 'Active'}
            errors={errors}
          />
        ) : (
          <PMEditFields
            totalPrizeGP={totalPrizeGP} setTotalPrizeGP={setTotalPrizeGP} canEditReward={canEditReward}
            maxParticipants={maxParticipants} setMaxParticipants={setMaxParticipants}
            useLimit={useLimit} setUseLimit={setUseLimit}
            participationCost={participationCost} setParticipationCost={setParticipationCost}
            boostingCost={boostingCost} setBoostingCost={setBoostingCost}
            boostingMultiplier={boostingMultiplier} setBoostingMultiplier={setBoostingMultiplier}
            canEditAll={canEditAll} canEditParticipation={canEditParticipation} canEditBoosting={canEditBoosting}
            hasParticipants={hasParticipants} publishedAt={game.publishedAt}
            endDate={endDate} setEndDate={setEndDate} resultDate={resultDate} setResultDate={setResultDate}
            canEditEndDate={canEditEndDate} canEditResultDate={canEditResultDate}
            resultBasis={resultBasis} setResultBasis={setResultBasis} canEditResultBasis={canEditResultBasis}
            errors={errors}
          />
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => openModal('cancelEdit')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={activeModal === 'cancelEdit'}
        onClose={closeModal}
        onConfirm={() => { closeModal(); router.push(`/game-zone/games/${id}`); }}
        title="수정 취소 확인"
        message="수정을 취소하시겠습니까?"
        warning="변경된 내용은 저장되지 않습니다."
        confirmText="취소하기"
        cancelText="계속 수정"
        confirmVariant="danger"
      />
    </div>
  );
}
