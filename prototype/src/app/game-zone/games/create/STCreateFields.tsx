'use client';

import NumberInput from '@/components/forms/NumberInput';
import DateTimePicker from '@/components/forms/DateTimePicker';
import QuizEditor from '@/components/forms/QuizEditor';
import type { Quiz, PrizeTier, STRewardType } from '@/lib/types';

interface STCreateFieldsProps {
  quizzes: Quiz[];
  setQuizzes: (v: Quiz[]) => void;
  maxPrizePool: number;
  setMaxPrizePool: (v: number) => void;
  maxRecruitment: number;
  setMaxRecruitment: (v: number) => void;
  stMultiplier: number;
  setStMultiplier: (v: number) => void;
  stRewardType: STRewardType;
  setStRewardType: (v: STRewardType) => void;
  prizeTiers: PrizeTier[];
  setPrizeTiers: (v: PrizeTier[]) => void;
  eliminationTickets: number;
  setEliminationTickets: (v: number) => void;
  startDateTime: string;
  setStartDateTime: (v: string) => void;
  errors: Record<string, string>;
}

export default function STCreateFields(props: STCreateFieldsProps) {
  const {
    quizzes, setQuizzes,
    maxPrizePool, setMaxPrizePool,
    maxRecruitment, setMaxRecruitment,
    stMultiplier, setStMultiplier,
    stRewardType, setStRewardType,
    prizeTiers, setPrizeTiers,
    eliminationTickets, setEliminationTickets,
    startDateTime, setStartDateTime,
    errors,
  } = props;

  const calculatedEntryFee = maxRecruitment > 0
    ? Math.floor(maxPrizePool / maxRecruitment * stMultiplier)
    : null;

  const updateTier = (idx: number, field: keyof PrizeTier, value: number) => {
    const updated = prizeTiers.map((t, i) => i === idx ? { ...t, [field]: value } : t);
    setPrizeTiers(updated);
  };

  const removeTier = (idx: number) => {
    setPrizeTiers(prizeTiers.filter((_, i) => i !== idx));
  };

  const addTier = () => {
    setPrizeTiers([...prizeTiers, { recruitmentRate: 0, prizeRate: 0 }]);
  };

  return (
    <>
      <Section title="퀴즈설정">
        <QuizEditor quizzes={quizzes} onChange={setQuizzes} />
        {errors.quizzes && <p className="text-sm text-red-500 mt-2">{errors.quizzes}</p>}
      </Section>

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
          <NumberInput
            label="배수"
            value={stMultiplier}
            onChange={setStMultiplier}
            min={1}
            step={0.01}
            required
          />
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 w-[120px]">참여비</span>
            <span className="text-sm text-gray-900 font-semibold">
              {calculatedEntryFee !== null ? `${calculatedEntryFee.toLocaleString()} GP` : '-'}
            </span>
            <span className="text-xs text-gray-400">(자동 계산)</span>
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
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">모집인원별 상금 단계</p>
              <div className="space-y-2">
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
                      onChange={(e) => updateTier(idx, 'recruitmentRate', Number(e.target.value))}
                      min={0}
                      max={100}
                      className="w-[120px] px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      value={tier.prizeRate}
                      onChange={(e) => updateTier(idx, 'prizeRate', Number(e.target.value))}
                      min={0}
                      max={100}
                      className="w-[120px] px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <span className="w-[140px] text-sm text-gray-600">
                      {maxPrizePool > 0 ? `${Math.floor(maxPrizePool * tier.prizeRate / 100).toLocaleString()} GP` : '-'}
                    </span>
                    <button
                      onClick={() => removeTier(idx)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                ))}
                <button
                  onClick={addTier}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + 단계 추가
                </button>
              </div>
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
            label="탈락자 응모권 수량"
            value={eliminationTickets}
            onChange={setEliminationTickets}
            min={0}
            unit="장"
            required
          />
        </div>
      </Section>

      <Section title="일정설정">
        <DateTimePicker
          label="게임 시작일시"
          value={startDateTime}
          onChange={setStartDateTime}
          required
          error={errors.startDateTime}
        />
        <p className="text-xs text-gray-400 mt-1">게시 후 시작 10분 전부터 참여자가 입장할 수 있습니다.</p>
      </Section>
    </>
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
