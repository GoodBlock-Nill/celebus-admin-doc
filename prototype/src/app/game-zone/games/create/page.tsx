'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import MultiLangInput from '@/components/forms/MultiLangInput';
import MultiLangEditor from '@/components/forms/MultiLangEditor';
import NumberInput from '@/components/forms/NumberInput';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { useGameStore } from '@/stores/useGameStore';
import { useUIStore } from '@/stores/useUIStore';
import { generateId } from '@/lib/utils';
import type { Game, MultiLangText, GameStatus, GameType, Quiz, QuizChoice, PrizeTier, STRewardType } from '@/lib/types';
import PMCreateFields from './PMCreateFields';
import STCreateFields from './STCreateFields';

const EMPTY_LANG: MultiLangText = { ko: '', en: '', jp: '' };

function createEmptyQuizzes(): Quiz[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `quiz-new-${i + 1}`,
    questionNumber: i + 1,
    text: { ko: '', en: '', jp: '' },
    choices: [
      { ko: '', en: '', jp: '' },
      { ko: '', en: '', jp: '' },
      { ko: '', en: '', jp: '' },
      { ko: '', en: '', jp: '' },
    ] as [QuizChoice, QuizChoice, QuizChoice, QuizChoice],
    correctIndex: 0,
    timeLimit: 10,
    resultDisplayTime: 5,
  }));
}

const DEFAULT_PRIZE_TIERS: PrizeTier[] = [
  { recruitmentRate: 100, prizeRate: 100 },
  { recruitmentRate: 80, prizeRate: 80 },
  { recruitmentRate: 50, prizeRate: 50 },
  { recruitmentRate: 20, prizeRate: 20 },
];

export default function CreateGamePage() {
  const router = useRouter();
  const addGame = useGameStore((s) => s.addGame);
  const { addToast, activeModal, openModal, closeModal } = useUIStore();

  // Common state
  const [gameType, setGameType] = useState<GameType>('PREDICTION_MARKET');
  const isST = gameType === 'SURVIVAL_TRIVIA';
  const [title, setTitle] = useState<MultiLangText>({ ...EMPTY_LANG });
  const [description, setDescription] = useState<MultiLangText>({ ...EMPTY_LANG });
  const [totalPrizeGP, setTotalPrizeGP] = useState(10000);
  const [hintLinkEnabled, setHintLinkEnabled] = useState(false);
  const [hintLink, setHintLink] = useState('');
  const [participationCost, setParticipationCost] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // PM-specific state
  const [maxParticipants, setMaxParticipants] = useState(0);
  const [useLimit, setUseLimit] = useState(false);
  const [boostingCost, setBoostingCost] = useState(1);
  const [boostingMultiplier, setBoostingMultiplier] = useState(2);
  const [endDate, setEndDate] = useState('');
  const [resultDate, setResultDate] = useState('');
  const [resultBasis, setResultBasis] = useState<MultiLangText>({ ...EMPTY_LANG });

  // ST-specific state
  const [quizzes, setQuizzes] = useState<Quiz[]>(createEmptyQuizzes());
  const [startDateTime, setStartDateTime] = useState('');
  const [stMaxPrizePool, setStMaxPrizePool] = useState(10_000_000);
  const [stMaxRecruitment, setStMaxRecruitment] = useState(10_000);
  const [stMultiplier, setStMultiplier] = useState(1.25);
  const [stPrizeTiers, setStPrizeTiers] = useState<PrizeTier[]>(DEFAULT_PRIZE_TIERS);
  const [stRewardType, setStRewardType] = useState<STRewardType>('TIERED');
  const [stEliminationTickets, setStEliminationTickets] = useState(1);

  const handleTypeChange = (type: GameType) => {
    setGameType(type);
    setErrors({});
    setBoostingCost(1); setBoostingMultiplier(2); setEndDate(''); setResultDate(''); setResultBasis({ ...EMPTY_LANG });
    setQuizzes(createEmptyQuizzes()); setStartDateTime('');
    setStMaxPrizePool(10_000_000); setStMaxRecruitment(10_000); setStMultiplier(1.25);
    setStRewardType('TIERED'); setStPrizeTiers(DEFAULT_PRIZE_TIERS); setStEliminationTickets(1);
  };

  const validateForReady = () => {
    const errs: Record<string, string> = {};
    if (!title.ko.trim()) errs.titleKo = '타이틀(KO)은 필수입니다.';
    if (!title.en.trim()) errs.titleEn = '타이틀(EN)은 필수입니다.';
    if (!title.jp.trim()) errs.titleJp = '타이틀(JP)은 필수입니다.';
    if (!description.ko.trim()) errs.descKo = '상세설명(KO)은 필수입니다.';
    if (!description.en.trim()) errs.descEn = '상세설명(EN)은 필수입니다.';
    if (!description.jp.trim()) errs.descJp = '상세설명(JP)은 필수입니다.';
    if (!isST && totalPrizeGP <= 0) errs.totalPrizeGP = '총 상금 GP를 입력하세요.';

    if (gameType === 'PREDICTION_MARKET') {
      if (!endDate) errs.endDate = '투표 종료일시를 입력하세요.';
      if (!resultDate) errs.resultDate = '결과 발표일자를 입력하세요.';
      if (!resultBasis.ko.trim()) errs.resultBasisKo = '결과 확인 기준(KO)은 필수입니다.';
      if (!resultBasis.en.trim()) errs.resultBasisEn = '결과 확인 기준(EN)은 필수입니다.';
      if (!resultBasis.jp.trim()) errs.resultBasisJp = '결과 확인 기준(JP)은 필수입니다.';
    }

    if (gameType === 'SURVIVAL_TRIVIA') {
      if (stMaxPrizePool <= 0) errs.maxPrizePool = '최대 상금풀을 입력하세요.';
      if (stMaxRecruitment <= 0) errs.maxRecruitment = '최대 모집인원을 입력하세요.';
      if (!startDateTime) errs.startDateTime = '게임 시작일시를 입력하세요.';
      const hasEmptyQuiz = quizzes.some((q) => !q.text.ko.trim() || q.choices.some((c) => !c.ko.trim()));
      if (hasEmptyQuiz) errs.quizzes = '모든 퀴즈의 문제와 선택지(KO)를 입력하세요.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateForDraft = () => { setErrors({}); return true; };

  const isReadyEnabled = () => {
    const base = title.ko.trim() && title.en.trim() && title.jp.trim() &&
      description.ko.trim() && description.en.trim() && description.jp.trim();
    if (gameType === 'PREDICTION_MARKET') {
      return base && totalPrizeGP > 0 && endDate && resultDate && resultBasis.ko.trim() && resultBasis.en.trim() && resultBasis.jp.trim();
    }
    return base && startDateTime && stMaxPrizePool > 0 && stMaxRecruitment > 0;
  };

  const handleSave = (status: GameStatus) => {
    if (status === 'Ready' && !validateForReady()) return;
    if (status === 'Draft' && !validateForDraft()) return;

    const game: Game = {
      id: `game-${generateId()}`,
      type: gameType,
      title,
      description,
      hintLinkEnabled: isST ? false : hintLinkEnabled,
      hintLink: isST ? '' : (hintLinkEnabled ? hintLink : ''),
      status,
      totalPrizeGP: isST ? 0 : totalPrizeGP,
      maxParticipants: 0,
      participationCost: isST ? 0 : participationCost,
      boostingCost: isST ? 0 : boostingCost,
      boostingMultiplier: isST ? 0 : boostingMultiplier,
      endDate: isST ? '' : endDate,
      resultDate: isST ? '' : resultDate,
      resultBasis: isST ? { ko: '', en: '', jp: '' } : resultBasis,
      result: null,
      resultTitle: { ko: '', en: '', jp: '' },
      resultDescription: { ko: '', en: '', jp: '' },
      resultLinkText: { ko: '', en: '', jp: '' },
      resultLinkUrl: { ko: '', en: '', jp: '' },
      rewardDistributed: false,
      rewardDistributedAt: null,
      participantCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: 'admin.user',
      updatedAt: new Date().toISOString(),
      publishedAt: null,
      ...(isST ? {
        quizzes,
        timePerQuestion: 10,
        startDateTime,
        maxPrizePool: stMaxPrizePool,
        maxRecruitment: stMaxRecruitment,
        stMultiplier,
        stRewardType,
        calculatedEntryFee: stMaxRecruitment > 0 ? Math.floor(stMaxPrizePool / stMaxRecruitment * stMultiplier) : 0,
        prizeTiers: stRewardType === 'TIERED' ? stPrizeTiers : [],
        eliminationTickets: stEliminationTickets,
      } : {
        maxParticipants: useLimit ? maxParticipants : 0,
        participationCost,
      }),
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
            <GameTypeSelector gameType={gameType} onChange={handleTypeChange} />
            <MultiLangInput label="타이틀" values={title} onChange={setTitle} maxLength={50} required error={errors.titleKo || errors.titleEn || errors.titleJp} />
            <MultiLangEditor label="상세설명" values={description} onChange={setDescription} required error={errors.descKo || errors.descEn || errors.descJp} />
            {!isST && (
              <HintLinkField enabled={hintLinkEnabled} onToggle={setHintLinkEnabled} value={hintLink} onChange={setHintLink} />
            )}
          </div>
        </Section>

        {!isST && (
          <Section title="보상설정">
            <NumberInput label="총 상금 GP" value={totalPrizeGP} onChange={setTotalPrizeGP} min={1} unit="GP" required error={errors.totalPrizeGP} />
          </Section>
        )}

        {gameType === 'PREDICTION_MARKET' ? (
          <PMCreateFields
            maxParticipants={maxParticipants} setMaxParticipants={setMaxParticipants} useLimit={useLimit} setUseLimit={setUseLimit}
            participationCost={participationCost} setParticipationCost={setParticipationCost} boostingCost={boostingCost} setBoostingCost={setBoostingCost}
            boostingMultiplier={boostingMultiplier} setBoostingMultiplier={setBoostingMultiplier} endDate={endDate} setEndDate={setEndDate}
            resultDate={resultDate} setResultDate={setResultDate} resultBasis={resultBasis} setResultBasis={setResultBasis} errors={errors}
          />
        ) : (
          <STCreateFields
            quizzes={quizzes} setQuizzes={setQuizzes}
            maxPrizePool={stMaxPrizePool} setMaxPrizePool={setStMaxPrizePool}
            maxRecruitment={stMaxRecruitment} setMaxRecruitment={setStMaxRecruitment}
            stMultiplier={stMultiplier} setStMultiplier={setStMultiplier}
            stRewardType={stRewardType} setStRewardType={setStRewardType}
            prizeTiers={stPrizeTiers} setPrizeTiers={setStPrizeTiers}
            eliminationTickets={stEliminationTickets} setEliminationTickets={setStEliminationTickets}
            startDateTime={startDateTime} setStartDateTime={setStartDateTime}
            errors={errors}
          />
        )}

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

function HintLinkField({ enabled, onToggle, value, onChange }: { enabled: boolean; onToggle: (v: boolean) => void; value: string; onChange: (v: string) => void }) {
  const btnCls = (active: boolean) => `px-4 py-1.5 text-sm font-medium transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`;
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm font-medium text-gray-700 w-[100px]">힌트 링크</span>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button type="button" onClick={() => onToggle(true)} className={btnCls(enabled)}>사용</button>
          <button type="button" onClick={() => onToggle(false)} className={btnCls(!enabled)}>미사용</button>
        </div>
      </div>
      {enabled && (
        <div>
          <input type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://example.com/hint"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p className="text-xs text-gray-400 mt-1">게임 관련 힌트 페이지 URL을 입력하세요.</p>
        </div>
      )}
    </div>
  );
}

function GameTypeSelector({ gameType, onChange }: { gameType: GameType; onChange: (t: GameType) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700 w-[100px]">게임유형</span>
      <div className="flex gap-4">
        {([['PREDICTION_MARKET', 'Prediction Market', 'text-blue-600'], ['SURVIVAL_TRIVIA', 'Survival Trivia', 'text-purple-600']] as const).map(([value, label, cls]) => (
          <label key={value} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="gameType" value={value} checked={gameType === value} onChange={() => onChange(value)} className={cls} />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
