'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import MultiLangInput from '@/components/forms/MultiLangInput';
import MultiLangEditor from '@/components/forms/MultiLangEditor';
import MultiLangTextarea from '@/components/forms/MultiLangTextarea';
import NumberInput from '@/components/forms/NumberInput';
import DateTimePicker from '@/components/forms/DateTimePicker';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { useGameStore } from '@/stores/useGameStore';
import { useUIStore } from '@/stores/useUIStore';
import { GAME_TYPE_LABELS } from '@/lib/constants';
import type { MultiLangText, GameStatus } from '@/lib/types';

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
    }
  }, [game]);

  if (!game) {
    return <div className="text-center py-20 text-gray-500">게임을 찾을 수 없습니다.</div>;
  }

  const status = game.status;
  const hasParticipants = game.participantCount > 0;

  // 상태별 수정 가능 필드 정의
  const getEditableFields = (gameStatus: GameStatus) => {
    switch (gameStatus) {
      case 'Draft':
      case 'Ready':
        return { all: true };
      case 'Active':
        return {
          title: true,
          description: true,
          hintLink: true,
          endDate: true,
          resultDate: true,
          resultBasis: true,
        };
      case 'Pending':
        return {
          resultDate: true,
          resultBasis: true,
        };
      case 'Closed':
      case 'Ended':
      default:
        return {};
    }
  };

  const editable = getEditableFields(status);
  const canEditAll = 'all' in editable && editable.all;
  const canEditTitle = canEditAll || editable.title;
  const canEditDescription = canEditAll || editable.description;
  const canEditHintLink = canEditAll || editable.hintLink;
  const canEditEndDate = canEditAll || editable.endDate;
  const canEditResultDate = canEditAll || editable.resultDate;
  const canEditResultBasis = canEditAll || editable.resultBasis;
  const canEditReward = canEditAll;
  const canEditParticipation = canEditAll && !hasParticipants;
  const canEditBoosting = canEditAll && !hasParticipants;

  const isAllRequiredFilled = () => {
    return !!(
      title.ko.trim() && title.en.trim() && title.jp.trim() &&
      description.ko.trim() && description.en.trim() && description.jp.trim() &&
      totalPrizeGP > 0 &&
      endDate && resultDate &&
      resultBasis.ko.trim() && resultBasis.en.trim() && resultBasis.jp.trim()
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (canEditTitle && !title.ko.trim()) errs.titleKo = '타이틀(KO)은 필수입니다.';
    if (canEditReward && totalPrizeGP <= 0) errs.totalPrizeGP = '총 상금 GP를 입력하세요.';
    if (canEditEndDate && !endDate) errs.endDate = '투표 종료일시를 입력하세요.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const updateData: Record<string, unknown> = {};

    if (canEditTitle) {
      updateData.title = title;
    }
    if (canEditDescription) {
      updateData.description = description;
    }
    if (canEditHintLink) {
      updateData.hintLinkEnabled = hintLinkEnabled;
      updateData.hintLink = hintLinkEnabled ? hintLink : '';
    }
    if (canEditReward) {
      updateData.totalPrizeGP = totalPrizeGP;
    }
    if (canEditParticipation) {
      updateData.maxParticipants = useLimit ? maxParticipants : 0;
      updateData.participationCost = participationCost;
    }
    if (canEditBoosting) {
      updateData.boostingCost = boostingCost;
      updateData.boostingMultiplier = boostingMultiplier;
    }
    if (canEditEndDate) {
      updateData.endDate = endDate;
    }
    if (canEditResultDate) {
      updateData.resultDate = resultDate;
    }
    if (canEditResultBasis) {
      updateData.resultBasis = resultBasis;
    }

    if (status === 'Draft' && isAllRequiredFilled()) {
      updateData.status = 'Ready';
      updateGame(id, updateData);
      addToast('success', '게임이 저장되었습니다. 게시대기 상태로 변경되었습니다.');
    } else {
      updateGame(id, updateData);
      addToast('success', '게임 정보가 수정되었습니다.');
    }
    router.push(`/game-zone/games/${id}`);
  };

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
            {status === 'Active' && '진행중인 게임은 일부 필드만 수정할 수 있습니다.'}
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
              <>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-[100px]">힌트 링크</span>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => canEditHintLink && setHintLinkEnabled(true)}
                      className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                        hintLinkEnabled ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                      } ${!canEditHintLink ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      사용
                    </button>
                    <button
                      type="button"
                      onClick={() => canEditHintLink && setHintLinkEnabled(false)}
                      className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                        !hintLinkEnabled ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                      } ${!canEditHintLink ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      미사용
                    </button>
                  </div>
                </div>
                {hintLinkEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">힌트 링크 URL</label>
                    <input
                      type="url"
                      value={hintLink}
                      onChange={(e) => setHintLink(e.target.value)}
                      placeholder="https://example.com/hint"
                      disabled={!canEditHintLink}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </Section>

        {canEditReward && (
          <Section title="보상설정">
            <NumberInput
              label="총 상금 GP"
              value={totalPrizeGP}
              onChange={setTotalPrizeGP}
              min={1}
              unit="GP"
              required
              error={errors.totalPrizeGP}
            />
          </Section>
        )}

        {canEditAll && (
          <Section title="참여설정">
            <div className="space-y-4">
              {hasParticipants && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">참여자가 있어 참여/부스팅 비용을 변경할 수 없습니다.</p>
                </div>
              )}
              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useLimit}
                    onChange={(e) => setUseLimit(e.target.checked)}
                    disabled={!canEditParticipation}
                    className="rounded border-gray-300"
                  />
                  <span className="font-medium text-gray-700">참여 정원 제한</span>
                </label>
                {useLimit && (
                  <div className="mt-2">
                    <NumberInput
                      label="참여 정원"
                      value={maxParticipants}
                      onChange={setMaxParticipants}
                      min={1}
                      unit="명"
                      disabled={!canEditParticipation}
                    />
                  </div>
                )}
              </div>
              <NumberInput
                label="참여 비용"
                value={participationCost}
                onChange={setParticipationCost}
                min={1}
                unit="GP"
                disabled={!canEditParticipation}
              />
              <div className="space-y-4">
                <NumberInput
                  label="부스팅 비용"
                  value={boostingCost}
                  onChange={setBoostingCost}
                  min={1}
                  unit="GP"
                  required
                  disabled={!canEditBoosting}
                />
                <NumberInput
                  label="부스팅 배수"
                  value={boostingMultiplier}
                  onChange={setBoostingMultiplier}
                  min={1}
                  max={10}
                  unit="배"
                  required
                  disabled={!canEditBoosting}
                />
                <p className="text-xs text-gray-400">부스팅 GP는 보상 계산 시 해당 배수만큼 가중치가 적용됩니다.</p>
              </div>
            </div>
          </Section>
        )}

        <Section title="일정설정">
          <div className="space-y-4">
            {game.publishedAt && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-[140px]">투표 시작일시</span>
                <span className="text-sm text-gray-500">{new Date(game.publishedAt).toLocaleString('ko-KR')}</span>
                <span className="text-xs text-gray-400">(게시 시점에 자동 설정)</span>
              </div>
            )}
            <DateTimePicker
              label="투표 종료일시"
              value={endDate}
              onChange={setEndDate}
              required
              error={errors.endDate}
              disabled={!canEditEndDate}
            />
            <DateTimePicker
              label="결과 발표 예정일"
              value={resultDate}
              onChange={setResultDate}
              min={endDate}
              disabled={!canEditResultDate}
            />
          </div>
        </Section>

        <Section title="결과설정">
          <div className="space-y-4">
            <MultiLangTextarea
              label="결과 확인 기준"
              values={resultBasis}
              onChange={setResultBasis}
              maxLength={500}
              rows={3}
              disabled={!canEditResultBasis}
            />
          </div>
        </Section>

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}
