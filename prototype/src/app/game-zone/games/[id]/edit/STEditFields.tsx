'use client';

import NumberInput from '@/components/forms/NumberInput';
import DateTimePicker from '@/components/forms/DateTimePicker';
import QuizEditor from '@/components/forms/QuizEditor';
import { Section } from './editHelpers';
import { generateId } from '@/lib/utils';
import type { Quiz, QuizChoice, PrizeTier, STRewardType } from '@/lib/types';

interface STEditFieldsProps {
  maxPrizePool: number;
  setMaxPrizePool: (v: number) => void;
  stMultiplier: number;
  setStMultiplier: (v: number) => void;
  stRewardType: STRewardType;
  setStRewardType: (v: STRewardType) => void;
  maxRecruitment: number;
  setMaxRecruitment: (v: number) => void;
  prizeTiers: PrizeTier[];
  setPrizeTiers: (v: PrizeTier[]) => void;
  eliminationTickets: number;
  setEliminationTickets: (v: number) => void;
  canEditReward: boolean;
  canEditAll: boolean;
  startDateTime: string;
  setStartDateTime: (v: string) => void;
  canEditStartDateTime: boolean;
  quizzes: Quiz[];
  setQuizzes: (v: Quiz[]) => void;
  quizzesDisabled: boolean;
  errors: Record<string, string>;
}

export default function STEditFields(props: STEditFieldsProps) {
  const {
    maxPrizePool, setMaxPrizePool,
    stMultiplier, setStMultiplier,
    stRewardType, setStRewardType,
    maxRecruitment, setMaxRecruitment,
    prizeTiers, setPrizeTiers,
    eliminationTickets, setEliminationTickets,
    canEditReward,
    canEditAll,
    startDateTime, setStartDateTime, canEditStartDateTime,
    quizzes, setQuizzes, quizzesDisabled,
    errors,
  } = props;

  const calculatedEntryFee = maxRecruitment > 0
    ? Math.floor(maxPrizePool / maxRecruitment * stMultiplier).toLocaleString() + ' GP'
    : '-';

  const addQuiz = () => {
    if (quizzes.length >= 10) return;
    const newQuiz: Quiz = {
      id: generateId(),
      questionNumber: quizzes.length + 1,
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
    };
    setQuizzes([...quizzes, newQuiz]);
  };

  const deleteQuiz = (index: number) => {
    if (quizzes.length <= 1) return;
    const updated = quizzes
      .filter((_, i) => i !== index)
      .map((q, i) => ({ ...q, questionNumber: i + 1 }));
    setQuizzes(updated);
  };

  return (
    <>
      {canEditAll && (
        <Section title="참여설정">
          <div className="space-y-4">
            <NumberInput
              label="최대 모집인원"
              value={maxRecruitment}
              onChange={setMaxRecruitment}
              min={1}
              unit="명"
              required
              error={errors.maxRecruitment}
            />
            <p className="text-xs text-gray-400">참여비는 보상설정에서 자동 계산됩니다.</p>
            <p className="text-xs text-gray-400">부스팅은 Survival Trivia에서 지원하지 않습니다.</p>
          </div>
        </Section>
      )}

      {canEditReward && (
        <Section title="보상설정">
          <div className="space-y-4">
            <NumberInput
              label="최대 상금풀"
              value={maxPrizePool}
              onChange={setMaxPrizePool}
              min={1}
              unit="GP"
              required
              error={errors.maxPrizePool}
            />
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                배수 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={stMultiplier}
                onChange={(e) => setStMultiplier(Number(e.target.value))}
                step="0.01"
                min={0}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">참여비</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-900">{calculatedEntryFee}</span>
                <span className="text-xs text-gray-400">(자동 계산)</span>
              </div>
            </div>

            {/* 보상 유형 선택 */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">보상 유형</p>
              <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setStRewardType('TIERED')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    stRewardType === 'TIERED'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  단계별 보상
                </button>
                <button
                  type="button"
                  onClick={() => setStRewardType('PROPORTIONAL')}
                  className={`px-4 py-2 text-sm font-medium border-l border-gray-200 transition-colors ${
                    stRewardType === 'PROPORTIONAL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  비율별 보상
                </button>
              </div>
            </div>

            {/* 단계별 보상: 모집인원별 상금 단계 테이블 */}
            {stRewardType === 'TIERED' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">모집인원별 상금 단계</label>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <span className="w-[120px]">모집률 (%)</span>
                  <span className="w-[120px]">상금 비율 (%)</span>
                  <span className="w-[140px]">책정 상금</span>
                  <span className="w-[60px]"></span>
                </div>
                {prizeTiers.map((tier, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="number"
                      value={tier.recruitmentRate}
                      onChange={(e) => {
                        const updated = [...prizeTiers];
                        updated[idx] = { ...updated[idx], recruitmentRate: Number(e.target.value) };
                        setPrizeTiers(updated);
                      }}
                      min={0}
                      max={100}
                      className="w-[120px] px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      value={tier.prizeRate}
                      onChange={(e) => {
                        const updated = [...prizeTiers];
                        updated[idx] = { ...updated[idx], prizeRate: Number(e.target.value) };
                        setPrizeTiers(updated);
                      }}
                      min={0}
                      max={100}
                      className="w-[120px] px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <span className="w-[140px] text-sm text-gray-600">
                      {maxPrizePool > 0 ? `${Math.floor(maxPrizePool * tier.prizeRate / 100).toLocaleString()} GP` : '-'}
                    </span>
                    <button
                      onClick={() => setPrizeTiers(prizeTiers.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setPrizeTiers([...prizeTiers, { recruitmentRate: 0, prizeRate: 0 }])}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + 단계 추가
                </button>
              </div>
            )}

            {/* 비율별 보상: 공식 안내 */}
            {stRewardType === 'PROPORTIONAL' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-800 mb-1">적용 상금풀 계산 공식</p>
                <p className="text-sm text-blue-700">
                  적용 상금풀 = 실제 모집인원 / 최대 모집인원 × 최대 상금풀
                </p>
                <p className="text-xs text-blue-500 mt-2">
                  게임 시작 시 실제 모집인원에 비례하여 상금풀이 자동 결정됩니다.
                </p>
              </div>
            )}

            <NumberInput
              label="탈락자 응모권"
              value={eliminationTickets}
              onChange={setEliminationTickets}
              min={0}
              unit="장"
            />
          </div>
        </Section>
      )}

      <Section title="일정설정">
        <DateTimePicker
          label="게임 시작일시"
          value={startDateTime}
          onChange={setStartDateTime}
          required
          error={errors.startDateTime}
          disabled={!canEditStartDateTime}
        />
        <p className="text-xs text-gray-400 mt-1">게시 후 시작 10분 전부터 참여자가 입장할 수 있습니다.</p>
      </Section>

      <Section title="퀴즈설정">
        <QuizEditor
          quizzes={quizzes}
          onChange={setQuizzes}
          disabled={quizzesDisabled}
          onAdd={quizzesDisabled ? undefined : addQuiz}
          onDelete={quizzesDisabled ? undefined : deleteQuiz}
        />
        {errors.quizzes && <p className="text-sm text-red-500 mt-2">{errors.quizzes}</p>}
      </Section>
    </>
  );
}
