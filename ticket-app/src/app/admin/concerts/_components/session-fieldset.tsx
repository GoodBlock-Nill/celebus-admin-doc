'use client';

import { Button, Field, NumberInput, TextInput } from '../../_components/form';
import { POOL_TYPES } from '../../_components/pools';
import { sessionTotal, type FieldErrors, type SessionDraft } from './concert-form-state';
import type { PoolType } from '@/lib/api-types';
import { poolLabel } from '@/lib/api-types';

interface SessionFieldsetProps {
  session: SessionDraft;
  index: number;
  errors: FieldErrors;
  removable: boolean;
  onChangeName: (value: string) => void;
  onChangeStartAt: (value: string) => void;
  onChangeEntryMinutes: (value: string) => void;
  onChangePool: (poolType: PoolType, value: string) => void;
  onRemove: () => void;
}

/** 회차 1건 입력 블록 — 이름·공연 일시·입장 기준·4분류 배정 수량 */
export function SessionFieldset({
  session,
  index,
  errors,
  removable,
  onChangeName,
  onChangeStartAt,
  onChangeEntryMinutes,
  onChangePool,
  onRemove,
}: SessionFieldsetProps) {
  const total = sessionTotal(session);

  return (
    <div className="rounded-xl border border-[#E3E5EA] bg-[#FAFBFC] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[13px] font-bold text-[#1B1D22]">회차 {index}</p>
        <Button variant="danger" size="sm" disabled={!removable} onClick={onRemove}>
          회차 삭제
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label="회차 이름" required error={errors[`${session.key}:name`]}>
          <TextInput
            value={session.name}
            onChange={(event) => onChangeName(event.target.value)}
            placeholder="예) 1회차 10/15(목) 19:00"
            maxLength={60}
          />
        </Field>
        <Field label="공연 일시" required error={errors[`${session.key}:startAt`]}>
          <TextInput
            type="datetime-local"
            value={session.startAt}
            onChange={(event) => onChangeStartAt(event.target.value)}
          />
        </Field>
        <Field
          label="입장 오픈 (분 전)"
          required
          error={errors[`${session.key}:entry`]}
          hint="이 시각부터 앱에서 입장 코드가 활성화됩니다."
        >
          <NumberInput
            min={0}
            value={session.entryOpenMinutesBefore}
            onChange={(event) => onChangeEntryMinutes(event.target.value)}
          />
        </Field>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {POOL_TYPES.map((poolType) => (
          <Field key={poolType} label={`${poolLabel(poolType)} (매)`}>
            <NumberInput
              min={0}
              value={session.pools[poolType]}
              onChange={(event) => onChangePool(poolType, event.target.value)}
            />
          </Field>
        ))}
      </div>

      {errors[`${session.key}:pools`] ? (
        <p className="mt-2 text-[11px] font-semibold text-[#C2402A]">{errors[`${session.key}:pools`]}</p>
      ) : null}

      <p className="mt-3 text-[12px] text-[#6B7080]">
        회차 배정 합계{' '}
        <span className="font-bold tabular-nums text-[#1B1D22]">{total.toLocaleString('ko-KR')}매</span>
      </p>
    </div>
  );
}
