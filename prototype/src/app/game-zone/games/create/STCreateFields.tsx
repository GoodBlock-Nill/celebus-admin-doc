'use client';

import NumberInput from '@/components/forms/NumberInput';
import DateTimePicker from '@/components/forms/DateTimePicker';
import QuizEditor from '@/components/forms/QuizEditor';
import type { Quiz } from '@/lib/types';

interface STCreateFieldsProps {
  quizzes: Quiz[];
  setQuizzes: (v: Quiz[]) => void;
  maxParticipants: number;
  setMaxParticipants: (v: number) => void;
  participationCost: number;
  setParticipationCost: (v: number) => void;
  startDateTime: string;
  setStartDateTime: (v: string) => void;
  errors: Record<string, string>;
}

export default function STCreateFields(props: STCreateFieldsProps) {
  const {
    quizzes, setQuizzes,
    maxParticipants, setMaxParticipants,
    participationCost, setParticipationCost,
    startDateTime, setStartDateTime,
    errors,
  } = props;

  return (
    <>
      <Section title="퀴즈설정">
        <QuizEditor quizzes={quizzes} onChange={setQuizzes} />
        {errors.quizzes && <p className="text-sm text-red-500 mt-2">{errors.quizzes}</p>}
      </Section>

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
          <NumberInput label="참여 비용" value={participationCost} onChange={setParticipationCost} min={1} unit="GP" required />
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
