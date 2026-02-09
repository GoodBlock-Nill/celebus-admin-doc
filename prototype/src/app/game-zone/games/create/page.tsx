'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import MultiLangInput from '@/components/forms/MultiLangInput';
import MultiLangTextarea from '@/components/forms/MultiLangTextarea';
import MultiLangEditor from '@/components/forms/MultiLangEditor';
import NumberInput from '@/components/forms/NumberInput';
import DateTimePicker from '@/components/forms/DateTimePicker';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { useGameStore } from '@/stores/useGameStore';
import { useUIStore } from '@/stores/useUIStore';
import { generateId } from '@/lib/utils';
import type { Game, MultiLangText, GameStatus } from '@/lib/types';

const EMPTY_LANG: MultiLangText = { ko: '', en: '', jp: '' };

export default function CreateGamePage() {
  const router = useRouter();
  const addGame = useGameStore((s) => s.addGame);
  const { addToast, activeModal, openModal, closeModal } = useUIStore();

  const [title, setTitle] = useState<MultiLangText>({ ...EMPTY_LANG });
  const [description, setDescription] = useState<MultiLangText>({ ...EMPTY_LANG });
  const [totalPrizeGP, setTotalPrizeGP] = useState(10000);
  const [maxParticipants, setMaxParticipants] = useState(0);
  const [useLimit, setUseLimit] = useState(false);
  const [participationCost, setParticipationCost] = useState(1);
  const [boostingCost, setBoostingCost] = useState(1);
  const [boostingMultiplier, setBoostingMultiplier] = useState(2);
  const [hintLinkEnabled, setHintLinkEnabled] = useState(false);
  const [hintLink, setHintLink] = useState('');
  const [boostingEnabled, setBoostingEnabled] = useState(true);
  const [endDate, setEndDate] = useState('');
  const [resultDate, setResultDate] = useState('');
  const [resultBasis, setResultBasis] = useState<MultiLangText>({ ...EMPTY_LANG });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 필수값 검증 (생성하기 버튼용)
  const validateForReady = () => {
    const errs: Record<string, string> = {};
    if (!title.ko.trim()) errs.titleKo = '타이틀(KO)은 필수입니다.';
    if (!title.en.trim()) errs.titleEn = '타이틀(EN)은 필수입니다.';
    if (!title.jp.trim()) errs.titleJp = '타이틀(JP)은 필수입니다.';
    if (!description.ko.trim()) errs.descKo = '상세설명(KO)은 필수입니다.';
    if (!description.en.trim()) errs.descEn = '상세설명(EN)은 필수입니다.';
    if (!description.jp.trim()) errs.descJp = '상세설명(JP)은 필수입니다.';
    if (totalPrizeGP <= 0) errs.totalPrizeGP = '총 상금 GP를 입력하세요.';
    if (!endDate) errs.endDate = '투표 종료일시를 입력하세요.';
    if (!resultDate) errs.resultDate = '결과 발표일자를 입력하세요.';
    if (!resultBasis.ko.trim()) errs.resultBasisKo = '결과 확인 기준(KO)은 필수입니다.';
    if (!resultBasis.en.trim()) errs.resultBasisEn = '결과 확인 기준(EN)은 필수입니다.';
    if (!resultBasis.jp.trim()) errs.resultBasisJp = '결과 확인 기준(JP)은 필수입니다.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // 임시저장은 필수값 없이 저장 가능
  const validateForDraft = () => {
    setErrors({});
    return true;
  };

  const isReadyEnabled = () => {
    return (
      title.ko.trim() &&
      title.en.trim() &&
      title.jp.trim() &&
      description.ko.trim() &&
      description.en.trim() &&
      description.jp.trim() &&
      totalPrizeGP > 0 &&
      endDate &&
      resultDate &&
      resultBasis.ko.trim() &&
      resultBasis.en.trim() &&
      resultBasis.jp.trim()
    );
  };

  const handleSave = (status: GameStatus) => {
    if (status === 'Ready' && !validateForReady()) return;
    if (status === 'Draft' && !validateForDraft()) return;

    const game: Game = {
      id: `game-${generateId()}`,
      type: 'PREDICTION_MARKET',
      title,
      description,
      hintLinkEnabled,
      hintLink: hintLinkEnabled ? hintLink : '',
      status,
      totalPrizeGP,
      maxParticipants: useLimit ? maxParticipants : 0,
      participationCost,
      boostingEnabled,
      boostingCost: boostingEnabled ? boostingCost : 0,
      boostingMultiplier: boostingEnabled ? boostingMultiplier : 2,
      endDate,
      resultDate,
      resultBasis,
      result: null,
      resultLink: '',
      rewardDistributed: false,
      rewardDistributedAt: null,
      participantCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: 'admin.user',
      updatedAt: new Date().toISOString(),
      publishedAt: null,
    };

    addGame(game);
    addToast('success', status === 'Draft' ? '게임이 임시저장되었습니다.' : '게임이 생성되었습니다.');
    router.push('/game-zone/games');
  };

  return (
    <div>
      <PageHeader
        title="게임 생성"
        breadcrumbItems={[
          { label: '게임존', href: '/game-zone' },
          { label: '게임 관리', href: '/game-zone/games' },
          { label: '게임 생성' },
        ]}
      />

      <div className="max-w-[800px] space-y-8">
        <Section title="기본정보">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-[100px]">게임유형</span>
              <span className="text-sm text-gray-900">Prediction Market</span>
              <span className="text-xs text-gray-400">(Survival Trivia는 개발 준비중)</span>
            </div>
            <MultiLangInput label="타이틀" values={title} onChange={setTitle} maxLength={50} required error={errors.titleKo || errors.titleEn || errors.titleJp} />
            <MultiLangEditor label="상세설명" values={description} onChange={setDescription} required error={errors.descKo || errors.descEn || errors.descJp} />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-medium text-gray-700 w-[100px]">힌트 링크</span>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setHintLinkEnabled(true)}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                      hintLinkEnabled ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    사용
                  </button>
                  <button
                    type="button"
                    onClick={() => setHintLinkEnabled(false)}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                      !hintLinkEnabled ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    미사용
                  </button>
                </div>
              </div>
              {hintLinkEnabled && (
                <div>
                  <input
                    type="url"
                    value={hintLink}
                    onChange={(e) => setHintLink(e.target.value)}
                    placeholder="https://example.com/hint"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">게임 관련 힌트 페이지 URL을 입력하세요.</p>
                </div>
              )}
            </div>
          </div>
        </Section>

        <Section title="보상설정">
          <NumberInput label="총 상금 GP" value={totalPrizeGP} onChange={setTotalPrizeGP} min={1} unit="GP" required error={errors.totalPrizeGP} />
        </Section>

        <Section title="참여설정">
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={useLimit} onChange={(e) => setUseLimit(e.target.checked)} className="rounded border-gray-300" />
                <span className="font-medium text-gray-700">참여 정원 제한</span>
              </label>
              {useLimit && (
                <div className="mt-2">
                  <NumberInput label="참여 정원" value={maxParticipants} onChange={setMaxParticipants} min={1} unit="명" />
                </div>
              )}
              {!useLimit && <p className="text-sm text-gray-500 mt-1">무제한</p>}
            </div>
            <NumberInput label="참여 비용" value={participationCost} onChange={setParticipationCost} min={1} unit="GP" required />
            <div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-[100px]">부스팅</span>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setBoostingEnabled(true)}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                      boostingEnabled ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    사용
                  </button>
                  <button
                    type="button"
                    onClick={() => setBoostingEnabled(false)}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                      !boostingEnabled ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    미사용
                  </button>
                </div>
              </div>
              {boostingEnabled && (
                <div className="mt-4 space-y-4">
                  <NumberInput label="부스팅 비용" value={boostingCost} onChange={setBoostingCost} min={1} unit="GP" />
                  <NumberInput label="부스팅 배수" value={boostingMultiplier} onChange={setBoostingMultiplier} min={1} max={10} unit="배" />
                  <p className="text-xs text-gray-400">부스팅 GP는 보상 계산 시 해당 배수만큼 가중치가 적용됩니다.</p>
                </div>
              )}
            </div>
          </div>
        </Section>

        <Section title="일정설정">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-[140px]">투표 시작일시</span>
              <span className="text-sm text-gray-500">(게시 시점에 자동 설정)</span>
            </div>
            <DateTimePicker label="투표 종료일시" value={endDate} onChange={setEndDate} required error={errors.endDate} />
            <DateTimePicker label="결과 발표 예정일" value={resultDate} onChange={setResultDate} min={endDate} required error={errors.resultDate} />
          </div>
        </Section>

        <Section title="결과설정">
          <MultiLangTextarea label="결과 확인 기준" values={resultBasis} onChange={setResultBasis} maxLength={500} rows={3} required error={errors.resultBasisKo || errors.resultBasisEn || errors.resultBasisJp} />
        </Section>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button onClick={() => openModal('cancelCreate')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            취소
          </button>
          <button onClick={() => handleSave('Draft')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            임시저장
          </button>
          <button
            onClick={() => handleSave('Ready')}
            disabled={!isReadyEnabled()}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              isReadyEnabled()
                ? 'text-white bg-blue-600 hover:bg-blue-700'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            }`}
          >
            생성하기
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={activeModal === 'cancelCreate'}
        onClose={closeModal}
        onConfirm={() => { closeModal(); router.push('/game-zone/games'); }}
        title="생성 취소 확인"
        message="게임 생성을 취소하시겠습니까?"
        warning="작성 중인 내용은 저장되지 않습니다."
        confirmText="취소하기"
        cancelText="계속 작성"
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
