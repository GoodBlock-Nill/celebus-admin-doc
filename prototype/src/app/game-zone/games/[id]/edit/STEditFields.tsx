'use client';

import NumberInput from '@/components/forms/NumberInput';
import DateTimePicker from '@/components/forms/DateTimePicker';
import QuizEditor from '@/components/forms/QuizEditor';
import { Section } from './editHelpers';
import type { Quiz } from '@/lib/types';

interface STEditFieldsProps {
  // 보상설정
  totalPrizeGP: number;
  setTotalPrizeGP: (v: number) => void;
  canEditReward: boolean;
  // 참여설정
  maxParticipants: number;
  setMaxParticipants: (v: number) => void;
  participationCost: number;
  setParticipationCost: (v: number) => void;
  canEditAll: boolean;
  // 일정설정
  startDateTime: string;
  setStartDateTime: (v: string) => void;
  canEditStartDateTime: boolean;
  // 퀴즈설정
  quizzes: Quiz[];
  setQuizzes: (v: Quiz[]) => void;
  quizzesDisabled: boolean;
  // errors
  errors: Record<string, string>;
}

export default function STEditFields(props: STEditFieldsProps) {
  const {
    totalPrizeGP, setTotalPrizeGP, canEditReward,
    maxParticipants, setMaxParticipants,
    participationCost, setParticipationCost, canEditAll,
    startDateTime, setStartDateTime, canEditStartDateTime,
    quizzes, setQuizzes, quizzesDisabled,
    errors,
  } = props;

  return (
    <>
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
            <NumberInput
              label="참여 정원"
              value={maxParticipants}
              onChange={setMaxParticipants}
              min={1}
              max={500}
              unit="명"
              required
              error={errors.maxParticipants}
            />
            <p className="text-xs text-gray-400">Survival Trivia는 최대 500명까지 참여 가능합니다.</p>
            <NumberInput
              label="참여 비용"
              value={participationCost}
              onChange={setParticipationCost}
              min={1}
              unit="GP"
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
        />
        {errors.quizzes && <p className="text-sm text-red-500 mt-2">{errors.quizzes}</p>}
      </Section>
    </>
  );
}

