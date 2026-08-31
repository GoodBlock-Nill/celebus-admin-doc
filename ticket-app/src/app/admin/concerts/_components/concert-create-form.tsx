'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { Button } from '../../_components/form';
import { useToast } from '../../_components/toast';
import { Card, InfoNote } from '../../_components/ui';
import { ConcertBasicFields } from './concert-basic-fields';
import {
  MAX_SESSION_COUNT,
  createConcertDraft,
  createSessionDraft,
  draftTotal,
  toCreateInput,
  validateDraft,
  type ConcertDraft,
  type ConcertField,
  type FieldErrors,
  type SessionDraft,
} from './concert-form-state';
import { ConcertMediaFields } from './concert-media-fields';
import { SessionFieldset } from './session-fieldset';
import { adminApi } from '@/lib/admin-client';
import type { PoolType, SeatType } from '@/lib/api-types';

/** 공연 등록 폼 — 등록 직후 상태는 판매 예정이며, 판매 시작은 상세 화면에서 진행한다. */
export function ConcertCreateForm() {
  const router = useRouter();
  const toast = useToast();

  const [draft, setDraft] = useState<ConcertDraft>(createConcertDraft);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  /** 한 번이라도 등록을 시도했는지 — 이후에는 입력을 고칠 때마다 오류 표시를 갱신한다. */
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!attempted) return;
    setErrors(validateDraft(draft));
  }, [attempted, draft]);

  const updateField = (field: ConcertField, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updateSeatType = (seatType: SeatType) => {
    setDraft((current) => ({ ...current, seatType }));
  };

  const updateDetailImages = (detailImageUrls: string[]) => {
    setDraft((current) => ({ ...current, detailImageUrls }));
  };

  const updateSession = (key: string, patch: Partial<SessionDraft>) => {
    setDraft((current) => ({
      ...current,
      sessions: current.sessions.map((session) =>
        session.key === key ? { ...session, ...patch } : session,
      ),
    }));
  };

  const updatePool = (key: string, poolType: PoolType, value: string) => {
    setDraft((current) => ({
      ...current,
      sessions: current.sessions.map((session) =>
        session.key === key ? { ...session, pools: { ...session.pools, [poolType]: value } } : session,
      ),
    }));
  };

  const addSession = () => {
    setDraft((current) =>
      current.sessions.length >= MAX_SESSION_COUNT
        ? current
        : { ...current, sessions: [...current.sessions, createSessionDraft(current.sessions.length + 1)] },
    );
  };

  const removeSession = (key: string) => {
    setDraft((current) =>
      current.sessions.length <= 1
        ? current
        : { ...current, sessions: current.sessions.filter((session) => session.key !== key) },
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateDraft(draft);
    setAttempted(true);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error('입력값을 확인해 주세요.');
      return;
    }

    setSubmitting(true);
    const result = await adminApi.createConcert(toCreateInput(draft));
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.reason);
      return;
    }

    toast.success(`${draft.title.trim()} 공연을 등록했습니다. 판매 시작은 상세 화면에서 진행해 주세요.`);
    router.push(`/admin/concerts/${result.data.concert_id}`);
  };

  const total = draftTotal(draft);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ConcertBasicFields
        draft={draft}
        errors={errors}
        onChange={updateField}
        onSeatTypeChange={updateSeatType}
        mediaFields={
          <ConcertMediaFields
            draft={draft}
            errors={errors}
            onChange={updateField}
            onDetailImagesChange={updateDetailImages}
          />
        }
      />

      <Card
        title="회차 · 배정 수량"
        description="회차별로 유상 판매·당첨자·초대·운영 보류 배정을 나눕니다. 등록 후에도 재조정할 수 있습니다."
        actions={
          <Button onClick={addSession} disabled={draft.sessions.length >= MAX_SESSION_COUNT}>
            회차 추가
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          {draft.sessions.map((session, index) => (
            <SessionFieldset
              key={session.key}
              session={session}
              index={index + 1}
              errors={errors}
              removable={draft.sessions.length > 1}
              onChangeName={(value) => updateSession(session.key, { name: value })}
              onChangeStartAt={(value) => updateSession(session.key, { startAt: value })}
              onChangeEntryMinutes={(value) =>
                updateSession(session.key, { entryOpenMinutesBefore: value })
              }
              onChangePool={(poolType, value) => updatePool(session.key, poolType, value)}
              onRemove={() => removeSession(session.key)}
            />
          ))}
        </div>

        <p className="mt-4 text-[13px] text-[#4A4E5A]">
          전체 배정 합계{' '}
          <span className="text-[15px] font-bold tabular-nums text-[#1B1D22]">
            {total.toLocaleString('ko-KR')}매
          </span>
          <span className="ml-2 text-[12px] text-[#6B7080]">회차 {draft.sessions.length}개</span>
        </p>
      </Card>

      <InfoNote>
        등록하면 판매 예정 상태로 저장되며 앱에는 아직 예매 버튼이 열리지 않습니다. 공연 상세에서 [판매 시작]을
        눌러야 예매가 시작됩니다.
      </InfoNote>

      <div className="flex justify-end gap-2">
        <Button onClick={() => router.push('/admin/concerts')}>취소</Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          등록하기
        </Button>
      </div>
    </form>
  );
}
