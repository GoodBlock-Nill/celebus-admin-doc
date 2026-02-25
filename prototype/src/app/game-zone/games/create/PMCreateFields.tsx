'use client';

import MultiLangTextarea from '@/components/forms/MultiLangTextarea';
import NumberInput from '@/components/forms/NumberInput';
import DateTimePicker from '@/components/forms/DateTimePicker';
import DatePicker from '@/components/forms/DatePicker';
import type { MultiLangText } from '@/lib/types';

interface PMCreateFieldsProps {
  maxParticipants: number;
  setMaxParticipants: (v: number) => void;
  useLimit: boolean;
  setUseLimit: (v: boolean) => void;
  participationCost: number;
  setParticipationCost: (v: number) => void;
  boostingCost: number;
  setBoostingCost: (v: number) => void;
  boostingMultiplier: number;
  setBoostingMultiplier: (v: number) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  resultDate: string;
  setResultDate: (v: string) => void;
  resultBasis: MultiLangText;
  setResultBasis: (v: MultiLangText) => void;
  errors: Record<string, string>;
}

export default function PMCreateFields(props: PMCreateFieldsProps) {
  const {
    maxParticipants, setMaxParticipants,
    useLimit, setUseLimit,
    participationCost, setParticipationCost,
    boostingCost, setBoostingCost,
    boostingMultiplier, setBoostingMultiplier,
    endDate, setEndDate,
    resultDate, setResultDate,
    resultBasis, setResultBasis,
    errors,
  } = props;

  return (
    <>
      <Section title="참여설정">
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useLimit}
                onChange={(e) => setUseLimit(e.target.checked)}
                className="rounded border-gray-300"
              />
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
          <div className="space-y-4">
            <NumberInput label="부스팅 비용" value={boostingCost} onChange={setBoostingCost} min={1} unit="GP" required />
            <NumberInput label="부스팅 배수" value={boostingMultiplier} onChange={setBoostingMultiplier} min={1} max={10} unit="배" required />
            <p className="text-xs text-gray-400">부스팅 GP는 보상 계산 시 해당 배수만큼 가중치가 적용됩니다.</p>
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
          <DatePicker label="결과 발표 예정일" value={resultDate} onChange={setResultDate} min={endDate} required error={errors.resultDate} />
        </div>
      </Section>

      <Section title="결과설정">
        <MultiLangTextarea
          label="결과 확인 기준"
          values={resultBasis}
          onChange={setResultBasis}
          maxLength={500}
          rows={3}
          required
          error={errors.resultBasisKo || errors.resultBasisEn || errors.resultBasisJp}
        />
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
