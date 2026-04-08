'use client';

import NumberInput from '@/components/forms/NumberInput';
import DateTimePicker from '@/components/forms/DateTimePicker';
import DatePicker from '@/components/forms/DatePicker';
import MultiLangTextarea from '@/components/forms/MultiLangTextarea';
import { Section } from './editHelpers';
import type { MultiLangText, PMSubType } from '@/lib/types';

interface PMEditFieldsProps {
  pmType?: PMSubType;
  // 보상설정
  totalPrizeGP: number;
  setTotalPrizeGP: (v: number) => void;
  winRewardGP: number;
  setWinRewardGP: (v: number) => void;
  canEditReward: boolean;
  // 참여설정
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
  canEditAll: boolean;
  canEditParticipation: boolean;
  canEditBoosting: boolean;
  hasParticipants: boolean;
  // 일정설정
  publishedAt: string | null;
  endDate: string;
  setEndDate: (v: string) => void;
  resultDate: string;
  setResultDate: (v: string) => void;
  canEditEndDate: boolean;
  canEditResultDate: boolean;
  // 결과설정
  resultBasis: MultiLangText;
  setResultBasis: (v: MultiLangText) => void;
  canEditResultBasis: boolean;
  // errors
  errors: Record<string, string>;
}

export default function PMEditFields(props: PMEditFieldsProps) {
  const {
    pmType,
    totalPrizeGP, setTotalPrizeGP,
    winRewardGP, setWinRewardGP,
    canEditReward,
    maxParticipants, setMaxParticipants, useLimit, setUseLimit,
    participationCost, setParticipationCost,
    boostingCost, setBoostingCost, boostingMultiplier, setBoostingMultiplier,
    canEditAll, canEditParticipation, canEditBoosting, hasParticipants,
    publishedAt, endDate, setEndDate, resultDate, setResultDate,
    canEditEndDate, canEditResultDate,
    resultBasis, setResultBasis, canEditResultBasis,
    errors,
  } = props;

  const isType2 = pmType === 'type2';

  return (
    <>
      {canEditReward && (
        <Section title="보상설정">
          {isType2 ? (
            <div className="space-y-4">
              <NumberInput
                label="승리 보상 GP"
                value={winRewardGP}
                onChange={setWinRewardGP}
                min={1}
                unit="GP"
                required
                error={errors.winRewardGP}
              />
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-[140px]">총 상금 GP</span>
                  <span className="text-sm text-gray-900 font-semibold">
                    {maxParticipants > 0 ? `${(winRewardGP * maxParticipants).toLocaleString()} GP` : '-'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 ml-[152px]">승리 보상 GP x 참여 정원 (자동 계산)</p>
              </div>
            </div>
          ) : (
            <NumberInput
              label="총 상금 GP"
              value={totalPrizeGP}
              onChange={setTotalPrizeGP}
              min={1}
              unit="GP"
              required
              error={errors.totalPrizeGP}
            />
          )}
        </Section>
      )}

      {canEditAll && (
        <Section title="참여설정">
          <div className="space-y-4">
            {isType2 ? (
              <>
                {hasParticipants && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-700">참여자가 있어 참여 정원을 변경할 수 없습니다.</p>
                  </div>
                )}
                <NumberInput
                  label="참여 정원"
                  value={maxParticipants}
                  onChange={setMaxParticipants}
                  min={1}
                  unit="명"
                  required
                  disabled={!canEditParticipation}
                  error={errors.maxParticipants}
                />
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-[140px]">참여 비용</span>
                  <span className="text-sm text-gray-500">0 GP (무료)</span>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </Section>
      )}

      <Section title="일정설정">
        <div className="space-y-4">
          {publishedAt && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-[140px]">투표 시작일시</span>
              <span className="text-sm text-gray-500">{new Date(publishedAt).toLocaleString('ko-KR')}</span>
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
          <DatePicker
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
    </>
  );
}

